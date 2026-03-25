/**
 * Parser module — handles both OpenAPI 3.x specs and natural language descriptions.
 */

const yaml = require('js-yaml');

// ─── OpenAPI Parser ──────────────────────────────────────────────────────────

/**
 * Parse an OpenAPI 3.x spec (YAML string, JSON string, or object).
 * Returns a normalized intermediate representation (IR).
 */
function parseOpenAPI(input) {
  let spec;
  if (typeof input === 'string') {
    // Try YAML first (superset of JSON)
    try { spec = yaml.load(input); }
    catch { spec = JSON.parse(input); }
  } else {
    spec = input;
  }

  if (!spec || (!spec.openapi && !spec.swagger)) {
    throw new Error('Invalid OpenAPI spec: missing "openapi" or "swagger" field.');
  }

  const ir = {
    info: {
      title: spec.info?.title || 'Mock API',
      version: spec.info?.version || '1.0.0',
      description: spec.info?.description || '',
    },
    basePath: spec.servers?.[0]?.url || spec.basePath || '',
    schemas: resolveSchemas(spec),
    endpoints: [],
  };

  const paths = spec.paths || {};
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete'].indexOf(method) === -1) continue;

      const endpoint = {
        method: method.toUpperCase(),
        path: convertPathParams(path),
        operationId: op.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        summary: op.summary || '',
        tags: op.tags || [],
        parameters: parseParameters(op.parameters || [], methods.parameters || []),
        requestBody: parseRequestBody(op.requestBody, spec),
        responses: parseResponses(op.responses || {}, spec),
      };
      ir.endpoints.push(endpoint);
    }
  }

  return ir;
}

function convertPathParams(path) {
  // Convert {param} to :param for Express
  return path.replace(/\{(\w+)\}/g, ':$1');
}

function resolveRef(ref, spec) {
  if (!ref || typeof ref !== 'string') return null;
  const parts = ref.replace('#/', '').split('/');
  let node = spec;
  for (const p of parts) {
    node = node?.[p];
  }
  return node || {};
}

function resolveSchema(schema, spec) {
  if (!schema) return null;
  if (schema.$ref) return resolveRef(schema.$ref, spec);
  if (schema.allOf) {
    const merged = { type: 'object', properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const resolved = resolveSchema(sub, spec);
      if (resolved?.properties) Object.assign(merged.properties, resolved.properties);
      if (resolved?.required) merged.required.push(...resolved.required);
    }
    return merged;
  }
  if (schema.oneOf || schema.anyOf) {
    return resolveSchema((schema.oneOf || schema.anyOf)[0], spec);
  }
  // Resolve nested $ref in properties
  if (schema.properties) {
    const props = {};
    for (const [k, v] of Object.entries(schema.properties)) {
      props[k] = resolveSchema(v, spec) || v;
    }
    return { ...schema, properties: props };
  }
  if (schema.items) {
    return { ...schema, items: resolveSchema(schema.items, spec) || schema.items };
  }
  return schema;
}

function resolveSchemas(spec) {
  const schemas = {};
  const components = spec.components?.schemas || spec.definitions || {};
  for (const [name, schema] of Object.entries(components)) {
    schemas[name] = resolveSchema(schema, spec);
  }
  return schemas;
}

function parseParameters(opParams, pathParams) {
  return [...(pathParams || []), ...opParams].map(p => ({
    name: p.name,
    in: p.in,
    required: p.required || false,
    schema: p.schema || { type: 'string' },
  }));
}

function parseRequestBody(body, spec) {
  if (!body) return null;
  const content = body.content?.['application/json'];
  if (!content?.schema) return null;
  return resolveSchema(content.schema, spec);
}

function parseResponses(responses, spec) {
  const result = {};
  for (const [code, resp] of Object.entries(responses)) {
    const content = resp.content?.['application/json'];
    result[code] = {
      description: resp.description || '',
      schema: content?.schema ? resolveSchema(content.schema, spec) : null,
    };
  }
  return result;
}

// ─── Natural Language Parser ─────────────────────────────────────────────────

/**
 * Parse a natural-language description into the same IR format.
 * Examples:
 *   "todo app with users, todos, auth"
 *   "blog api with posts, comments, categories, users"
 *   "ecommerce with products, orders, customers, reviews"
 */
function parseDescription(text) {
  const lower = text.toLowerCase().trim();

  // Extract resource names
  const resources = extractResources(lower);
  const hasAuth = /\bauth\b|\blogin\b|\bsignup\b|\bregister\b/.test(lower);

  const ir = {
    info: {
      title: extractTitle(lower),
      version: '1.0.0',
      description: `Mock API generated from: "${text}"`,
    },
    basePath: '/api',
    schemas: {},
    endpoints: [],
  };

  // Generate auth endpoints if requested
  if (hasAuth) {
    ir.endpoints.push(
      makeEndpoint('POST', '/auth/register', 'register', {
        requestBody: { type: 'object', properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          name: { type: 'string' },
        }},
        responseSchema: { type: 'object', properties: {
          token: { type: 'string' },
          user: { type: 'object', properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
          }},
        }},
      }),
      makeEndpoint('POST', '/auth/login', 'login', {
        requestBody: { type: 'object', properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        }},
        responseSchema: { type: 'object', properties: {
          token: { type: 'string' },
          user: { type: 'object', properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
          }},
        }},
      })
    );
  }

  // Generate CRUD endpoints for each resource
  for (const resource of resources) {
    const schema = inferSchema(resource);
    const plural = pluralize(resource);
    const singular = resource;
    ir.schemas[capitalize(singular)] = schema;

    const basePath = `/${plural}`;

    // LIST
    ir.endpoints.push(makeEndpoint('GET', basePath, `list_${plural}`, {
      responseSchema: {
        type: 'array',
        items: schema,
      },
    }));

    // GET by ID
    ir.endpoints.push(makeEndpoint('GET', `${basePath}/:id`, `get_${singular}`, {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responseSchema: schema,
    }));

    // CREATE
    ir.endpoints.push(makeEndpoint('POST', basePath, `create_${singular}`, {
      requestBody: schema,
      responseSchema: schema,
    }));

    // UPDATE
    ir.endpoints.push(makeEndpoint('PUT', `${basePath}/:id`, `update_${singular}`, {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: schema,
      responseSchema: schema,
    }));

    // DELETE
    ir.endpoints.push(makeEndpoint('DELETE', `${basePath}/:id`, `delete_${singular}`, {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responseSchema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
    }));
  }

  return ir;
}

function makeEndpoint(method, path, operationId, opts = {}) {
  return {
    method,
    path,
    operationId,
    summary: `${method} ${path}`,
    tags: [],
    parameters: opts.parameters || [],
    requestBody: opts.requestBody || null,
    responses: {
      [method === 'POST' ? '201' : '200']: {
        description: 'Success',
        schema: opts.responseSchema || null,
      },
    },
  };
}

function extractResources(text) {
  // Remove noise words
  const cleaned = text
    .replace(/\b(app|api|with|and|the|a|an|for|that|has|have|having|including|plus|also)\b/g, ' ')
    .replace(/\b(auth|login|signup|register|authentication)\b/g, ' ')
    .replace(/[^a-z\s,]/g, ' ');

  // Split by comma or whitespace, filter meaningful words
  const words = cleaned
    .split(/[\s,]+/)
    .map(w => w.trim())
    .filter(w => w.length > 1);

  // Singularize and deduplicate
  const seen = new Set();
  const resources = [];
  for (const w of words) {
    const s = singularize(w);
    if (!seen.has(s) && s.length > 1) {
      seen.add(s);
      resources.push(s);
    }
  }
  return resources.length > 0 ? resources : ['item'];
}

function extractTitle(text) {
  const match = text.match(/^([\w\s]+?)(?:\s+(?:app|api|with|that))/);
  if (match) return capitalize(match[1].trim()) + ' API';
  return 'Mock API';
}

/**
 * Infer a JSON Schema for a resource name based on common patterns.
 */
function inferSchema(resource) {
  const base = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id'],
  };

  const RESOURCE_SCHEMAS = {
    user: { name: 's', email: 'email', username: 's', avatar: 's', role: 's', bio: 's' },
    profile: { name: 's', email: 'email', avatar: 's', bio: 's', website: 'url' },
    post: { title: 's', body: 's', authorId: 'uuid', status: 's', tags: 'tags' },
    article: { title: 's', content: 's', authorId: 'uuid', status: 's', category: 's' },
    blog: { title: 's', content: 's', authorId: 'uuid', slug: 's', published: 'b' },
    comment: { body: 's', authorId: 'uuid', postId: 'uuid' },
    todo: { title: 's', description: 's', completed: 'b', priority: 's', dueDate: 'dt' },
    task: { title: 's', description: 's', status: 's', assigneeId: 'uuid', priority: 's', dueDate: 'dt' },
    product: { name: 's', description: 's', price: 'n', category: 's', sku: 's', inStock: 'b', imageUrl: 'url' },
    order: { userId: 'uuid', status: 's', total: 'n', currency: 's', items: 'arr' },
    customer: { name: 's', email: 'email', phone: 's', address: 's', company: 's' },
    review: { rating: 'n', body: 's', authorId: 'uuid', productId: 'uuid' },
    category: { name: 's', description: 's', slug: 's', parentId: 'uuid' },
    tag: { name: 's', slug: 's', color: 's' },
    message: { body: 's', senderId: 'uuid', receiverId: 'uuid', read: 'b' },
    notification: { title: 's', body: 's', type: 's', read: 'b', userId: 'uuid' },
    event: { title: 's', description: 's', startDate: 'dt', endDate: 'dt', location: 's' },
    project: { name: 's', description: 's', status: 's', ownerId: 'uuid', startDate: 'dt' },
    team: { name: 's', description: 's', ownerId: 'uuid' },
    invoice: { amount: 'n', currency: 's', status: 's', dueDate: 'dt', customerId: 'uuid' },
    payment: { amount: 'n', currency: 's', method: 's', status: 's', orderId: 'uuid' },
    file: { name: 's', url: 'url', mimeType: 's', size: 'i', uploadedBy: 'uuid' },
    setting: { key: 's', value: 's', description: 's' },
    log: { level: 's', message: 's', source: 's', metadata: 's' },
  };

  const fields = RESOURCE_SCHEMAS[resource] || { name: 's', description: 's', status: 's' };

  for (const [key, type] of Object.entries(fields)) {
    switch (type) {
      case 's':     base.properties[key] = { type: 'string' }; break;
      case 'i':     base.properties[key] = { type: 'integer' }; break;
      case 'n':     base.properties[key] = { type: 'number' }; break;
      case 'b':     base.properties[key] = { type: 'boolean' }; break;
      case 'dt':    base.properties[key] = { type: 'string', format: 'date-time' }; break;
      case 'email': base.properties[key] = { type: 'string', format: 'email' }; break;
      case 'url':   base.properties[key] = { type: 'string', format: 'uri' }; break;
      case 'uuid':  base.properties[key] = { type: 'string', format: 'uuid' }; break;
      case 'tags':  base.properties[key] = { type: 'array', items: { type: 'string' } }; break;
      case 'arr':   base.properties[key] = { type: 'array', items: { type: 'object', properties: {
        productId: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer' },
        price: { type: 'number' },
      } } }; break;
    }
  }

  return base;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function singularize(w) {
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ses') || w.endsWith('xes') || w.endsWith('zes')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

function pluralize(w) {
  if (w.endsWith('y') && !/[aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
  if (w.endsWith('s') || w.endsWith('x') || w.endsWith('z') || w.endsWith('ch') || w.endsWith('sh')) return w + 'es';
  return w + 's';
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = { parseOpenAPI, parseDescription, pluralize, singularize, capitalize };
