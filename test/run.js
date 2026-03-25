/**
 * Test suite for api-mock-generator
 * Run: node test/run.js
 */

const assert = require('assert');
const { parseOpenAPI, parseDescription } = require('../src/parser');
const { generateMockServer, generateTypes, generateClient } = require('../src/generator');
const { fakeValue, fakeObject, fakeArray, uuid, email, fullName } = require('../src/faker');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${err.message}`);
  }
}

console.log('\n  api-mock-generator tests\n');

// ─── Faker Tests ─────────────────────────────────────────────────────────────
console.log('  Faker:');

test('uuid generates valid format', () => {
  const id = uuid();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('email generates valid format', () => {
  const e = email();
  assert.match(e, /^.+@.+\..+$/);
});

test('fullName generates two words', () => {
  const name = fullName();
  assert.ok(name.split(' ').length >= 2);
});

test('fakeValue matches field name "email"', () => {
  const val = fakeValue('email');
  assert.match(val, /@/);
});

test('fakeValue matches field name "id"', () => {
  const val = fakeValue('id');
  assert.match(val, /-/); // uuid contains dashes
});

test('fakeValue matches field name "price"', () => {
  const val = fakeValue('price');
  assert.ok(typeof val === 'number');
});

test('fakeValue matches field name "createdAt"', () => {
  const val = fakeValue('createdAt');
  assert.match(val, /^\d{4}-\d{2}-\d{2}T/);
});

test('fakeValue matches field name "active"', () => {
  const val = fakeValue('active');
  assert.ok(typeof val === 'boolean');
});

test('fakeValue respects enum', () => {
  const val = fakeValue('status', { enum: ['a', 'b', 'c'] });
  assert.ok(['a', 'b', 'c'].includes(val));
});

test('fakeObject generates all properties', () => {
  const obj = fakeObject({
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    age: { type: 'integer' },
  });
  assert.ok(obj.id);
  assert.ok(obj.name);
  assert.ok(typeof obj.age === 'number');
});

test('fakeArray generates correct count', () => {
  const arr = fakeArray({ id: { type: 'string' } }, [], 7);
  assert.strictEqual(arr.length, 7);
});

// ─── Parser Tests ────────────────────────────────────────────────────────────
console.log('\n  Parser:');

test('parseDescription extracts resources', () => {
  const ir = parseDescription('todo app with users, todos, auth');
  const paths = ir.endpoints.map(e => e.path);
  assert.ok(paths.some(p => p.includes('/users')));
  assert.ok(paths.some(p => p.includes('/todos')));
  assert.ok(paths.some(p => p.includes('/auth')));
});

test('parseDescription generates CRUD endpoints', () => {
  const ir = parseDescription('blog with posts');
  const methods = ir.endpoints.filter(e => e.path.startsWith('/posts')).map(e => e.method);
  assert.ok(methods.includes('GET'));
  assert.ok(methods.includes('POST'));
  assert.ok(methods.includes('PUT'));
  assert.ok(methods.includes('DELETE'));
});

test('parseDescription infers schemas', () => {
  const ir = parseDescription('ecommerce with products, orders');
  assert.ok(ir.schemas.Product);
  assert.ok(ir.schemas.Product.properties.price);
  assert.ok(ir.schemas.Order);
  assert.ok(ir.schemas.Order.properties.total);
});

const SAMPLE_OPENAPI = `
openapi: "3.0.0"
info:
  title: Petstore
  version: "1.0.0"
paths:
  /pets:
    get:
      operationId: listPets
      summary: List all pets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      operationId: createPet
      summary: Create a pet
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pets/{petId}:
    get:
      operationId: getPet
      summary: Get a pet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: A pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
components:
  schemas:
    Pet:
      type: object
      required: [id, name]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        tag:
          type: string
        status:
          type: string
          enum: [available, pending, sold]
`;

test('parseOpenAPI parses valid spec', () => {
  const ir = parseOpenAPI(SAMPLE_OPENAPI);
  assert.strictEqual(ir.info.title, 'Petstore');
  assert.strictEqual(ir.endpoints.length, 3);
});

test('parseOpenAPI resolves $ref schemas', () => {
  const ir = parseOpenAPI(SAMPLE_OPENAPI);
  assert.ok(ir.schemas.Pet);
  assert.ok(ir.schemas.Pet.properties.name);
});

test('parseOpenAPI converts path params to Express format', () => {
  const ir = parseOpenAPI(SAMPLE_OPENAPI);
  const getEp = ir.endpoints.find(e => e.operationId === 'getPet');
  assert.strictEqual(getEp.path, '/pets/:petId');
});

// ─── Generator Tests ─────────────────────────────────────────────────────────
console.log('\n  Generator:');

test('generateMockServer produces valid JS', () => {
  const ir = parseDescription('todo app with todos');
  const code = generateMockServer(ir);
  assert.ok(code.includes('express'));
  assert.ok(code.includes('app.get'));
  assert.ok(code.includes('app.post'));
  assert.ok(code.includes('app.listen'));
});

test('generateMockServer includes health endpoint', () => {
  const ir = parseDescription('simple app with items');
  const code = generateMockServer(ir);
  assert.ok(code.includes("'/health'"));
});

test('generateMockServer includes request logger', () => {
  const ir = parseDescription('api with tasks');
  const code = generateMockServer(ir);
  assert.ok(code.includes('requestLog'));
  assert.ok(code.includes("'/_logs'"));
});

test('generateMockServer includes config endpoint', () => {
  const ir = parseDescription('api with users');
  const code = generateMockServer(ir);
  assert.ok(code.includes("'/_config'"));
  assert.ok(code.includes('mockConfig'));
});

test('generateMockServer includes pagination', () => {
  const ir = parseDescription('api with products');
  const code = generateMockServer(ir);
  assert.ok(code.includes('pagination'));
  assert.ok(code.includes('totalPages'));
});

test('generateMockServer from OpenAPI', () => {
  const ir = parseOpenAPI(SAMPLE_OPENAPI);
  const code = generateMockServer(ir);
  assert.ok(code.includes('Petstore'));
  assert.ok(code.includes('/pets'));
});

test('generateTypes produces TypeScript interfaces', () => {
  const ir = parseDescription('blog with posts, users');
  const types = generateTypes(ir);
  assert.ok(types.includes('export interface'));
  assert.ok(types.includes('Post'));
  assert.ok(types.includes('User'));
  assert.ok(types.includes('PaginatedResponse'));
});

test('generateTypes from OpenAPI', () => {
  const ir = parseOpenAPI(SAMPLE_OPENAPI);
  const types = generateTypes(ir);
  assert.ok(types.includes('Pet'));
  assert.ok(types.includes('name'));
});

test('generateClient produces TypeScript client', () => {
  const ir = parseDescription('todo app with todos');
  const client = generateClient(ir);
  assert.ok(client.includes('class ApiClient'));
  assert.ok(client.includes('setToken'));
  assert.ok(client.includes('fetch'));
  assert.ok(client.includes('export'));
});

test('generateClient has methods for each endpoint', () => {
  const ir = parseDescription('api with products');
  const client = generateClient(ir);
  assert.ok(client.includes('listProducts'));
  assert.ok(client.includes('getProduct'));
  assert.ok(client.includes('createProduct'));
  assert.ok(client.includes('updateProduct'));
  assert.ok(client.includes('deleteProduct'));
});

// ─── Integration: MCP Server ─────────────────────────────────────────────────
console.log('\n  Integration (MCP):');

async function testMCP() {
  // Dynamically start and test the server
  const http = require('http');
  const app = require('../src/server');

  // Wait for server to be ready (it's already listening from require)
  await new Promise(r => setTimeout(r, 500));

  function mcpCall(method, params = {}) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
      const req = http.request({
        hostname: 'localhost',
        port: process.env.PORT || 3000,
        path: '/mcp',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Invalid JSON response')); }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  test('MCP initialize returns server info', async () => {
    const res = await mcpCall('initialize');
    assert.strictEqual(res.result.serverInfo.name, 'api-mock-generator');
    assert.ok(res.result.capabilities.tools);
  });

  test('MCP tools/list returns 5 tools', async () => {
    const res = await mcpCall('tools/list');
    assert.strictEqual(res.result.tools.length, 5);
  });

  test('MCP mock_from_description works', async () => {
    const res = await mcpCall('tools/call', {
      name: 'mock_from_description',
      arguments: { description: 'todo app with users, todos' },
    });
    assert.ok(!res.result.isError);
    assert.ok(res.result.content[1].text.includes('express'));
  });

  test('MCP generate_types works', async () => {
    const res = await mcpCall('tools/call', {
      name: 'generate_types',
      arguments: { spec: 'blog with posts, comments' },
    });
    assert.ok(res.result.content[1].text.includes('interface'));
  });

  test('MCP generate_client works', async () => {
    const res = await mcpCall('tools/call', {
      name: 'generate_client',
      arguments: { spec: 'api with products' },
    });
    assert.ok(res.result.content[1].text.includes('ApiClient'));
  });

  test('MCP mock_config works', async () => {
    const res = await mcpCall('tools/call', {
      name: 'mock_config',
      arguments: { delay: 100, errorRate: 0.1 },
    });
    assert.ok(res.result.content[0].text.includes('100'));
  });

  test('MCP mock_from_openapi works', async () => {
    const res = await mcpCall('tools/call', {
      name: 'mock_from_openapi',
      arguments: { spec: SAMPLE_OPENAPI },
    });
    assert.ok(!res.result.isError);
    assert.ok(res.result.content[1].text.includes('Petstore'));
  });

  test('MCP unknown tool returns error', async () => {
    const res = await mcpCall('tools/call', {
      name: 'nonexistent',
      arguments: {},
    });
    assert.ok(res.result.isError);
  });

  // Done — summary
  console.log(`\n  \x1b[32m${passed} passing\x1b[0m`);
  if (failed) console.log(`  \x1b[31m${failed} failing\x1b[0m`);
  process.exit(failed > 0 ? 1 : 0);
}

// Run async MCP tests after sync tests
testMCP().catch(err => {
  console.error('MCP test error:', err);
  process.exit(1);
});
