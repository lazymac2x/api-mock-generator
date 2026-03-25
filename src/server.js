#!/usr/bin/env node
/**
 * api-mock-generator — MCP server + HTTP API
 *
 * Generate mock API servers instantly from OpenAPI specs or natural language descriptions.
 *
 * MCP endpoint:  POST /mcp
 * Health:        GET  /health
 */

const express = require('express');
const cors = require('cors');
const { parseOpenAPI, parseDescription } = require('./parser');
const { generateMockServer, generateTypes, generateClient } = require('./generator');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── MCP Tool Definitions ────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'mock_from_openapi',
    description: 'Generate a complete mock Express server from an OpenAPI 3.x specification (YAML or JSON). Returns runnable JavaScript code with realistic fake data, request logging, pagination, and configurable error rates.',
    inputSchema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'OpenAPI 3.x specification as YAML or JSON string',
        },
        config: {
          type: 'object',
          description: 'Optional configuration',
          properties: {
            delay: { type: 'number', description: 'Response delay in ms (default: 0)' },
            errorRate: { type: 'number', description: 'Error simulation rate 0-1 (default: 0)' },
            pagination: { type: 'boolean', description: 'Enable pagination (default: true)' },
            port: { type: 'number', description: 'Server port (default: 4000)' },
          },
        },
      },
      required: ['spec'],
    },
  },
  {
    name: 'mock_from_description',
    description: 'Generate a complete mock Express server from a natural language description. Automatically infers resources, relationships, and generates CRUD endpoints with realistic fake data. Example: "todo app with users, todos, auth" or "ecommerce with products, orders, customers, reviews".',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the API (e.g., "blog api with posts, comments, users, tags")',
        },
        config: {
          type: 'object',
          description: 'Optional configuration',
          properties: {
            delay: { type: 'number', description: 'Response delay in ms (default: 0)' },
            errorRate: { type: 'number', description: 'Error simulation rate 0-1 (default: 0)' },
            pagination: { type: 'boolean', description: 'Enable pagination (default: true)' },
            port: { type: 'number', description: 'Server port (default: 4000)' },
          },
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'generate_types',
    description: 'Generate TypeScript interfaces from an OpenAPI spec or natural language description. Produces type-safe interfaces for all resources, request bodies, and responses including pagination types.',
    inputSchema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'OpenAPI spec (YAML/JSON) or natural language description',
        },
        mode: {
          type: 'string',
          enum: ['openapi', 'description'],
          description: 'Parse mode: "openapi" for OpenAPI specs, "description" for natural language (default: auto-detect)',
        },
      },
      required: ['spec'],
    },
  },
  {
    name: 'generate_client',
    description: 'Generate a TypeScript fetch-based API client SDK from an OpenAPI spec or description. Includes typed methods for every endpoint, auth token management, error handling, and utility methods for logs and config.',
    inputSchema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'OpenAPI spec (YAML/JSON) or natural language description',
        },
        mode: {
          type: 'string',
          enum: ['openapi', 'description'],
          description: 'Parse mode (default: auto-detect)',
        },
        baseUrl: {
          type: 'string',
          description: 'Base URL for the API client (default: http://localhost:4000)',
        },
      },
      required: ['spec'],
    },
  },
  {
    name: 'mock_config',
    description: 'Generate a mock server configuration object for tuning response delay, error simulation rates, and pagination. Returns the configuration as JSON that can be sent to the mock server\'s PUT /_config endpoint at runtime.',
    inputSchema: {
      type: 'object',
      properties: {
        delay: { type: 'number', description: 'Response delay in milliseconds (0 = instant)' },
        errorRate: { type: 'number', description: 'Probability of error responses (0-1, e.g. 0.1 = 10% errors)' },
        pagination: { type: 'boolean', description: 'Enable pagination on list endpoints' },
        corsOrigin: { type: 'string', description: 'CORS origin (default: *)' },
        port: { type: 'number', description: 'Server port (default: 4000)' },
      },
    },
  },
];

// ── Helper: Detect mode ─────────────────────────────────────────────────────

function detectMode(spec) {
  const trimmed = spec.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('openapi') || trimmed.startsWith('swagger') || trimmed.includes('openapi:') || trimmed.includes('"openapi"')) {
    return 'openapi';
  }
  return 'description';
}

function parseSpec(spec, mode) {
  const resolvedMode = mode || detectMode(spec);
  if (resolvedMode === 'openapi') {
    return parseOpenAPI(spec);
  }
  return parseDescription(spec);
}

// ── MCP Tool Execution ──────────────────────────────────────────────────────

function executeTool(name, args) {
  switch (name) {
    case 'mock_from_openapi': {
      const ir = parseOpenAPI(args.spec);
      const code = generateMockServer(ir, args.config || {});
      return {
        content: [
          { type: 'text', text: `Generated mock server for "${ir.info.title}" with ${ir.endpoints.length} endpoints.\n\nSave the code below to a .js file and run with: node server.js\nRequires: npm install express cors\n` },
          { type: 'text', text: code },
        ],
      };
    }

    case 'mock_from_description': {
      const ir = parseDescription(args.description);
      const code = generateMockServer(ir, args.config || {});
      return {
        content: [
          { type: 'text', text: `Generated mock server for "${ir.info.title}" with ${ir.endpoints.length} endpoints from description: "${args.description}"\n\nSave the code below to a .js file and run with: node server.js\nRequires: npm install express cors\n` },
          { type: 'text', text: code },
        ],
      };
    }

    case 'generate_types': {
      const ir = parseSpec(args.spec, args.mode);
      const types = generateTypes(ir);
      return {
        content: [
          { type: 'text', text: `Generated TypeScript types for "${ir.info.title}" — ${Object.keys(ir.schemas).length} schemas.\n` },
          { type: 'text', text: types },
        ],
      };
    }

    case 'generate_client': {
      const ir = parseSpec(args.spec, args.mode);
      const client = generateClient(ir, { baseUrl: args.baseUrl });
      return {
        content: [
          { type: 'text', text: `Generated API client for "${ir.info.title}" with ${ir.endpoints.length} endpoint methods.\n` },
          { type: 'text', text: client },
        ],
      };
    }

    case 'mock_config': {
      const config = {
        delay: args.delay ?? 0,
        errorRate: args.errorRate ?? 0,
        pagination: args.pagination ?? true,
        corsOrigin: args.corsOrigin ?? '*',
        port: args.port ?? 4000,
      };
      return {
        content: [
          { type: 'text', text: `Mock server configuration:\n\n${JSON.stringify(config, null, 2)}\n\nApply at runtime: PUT http://localhost:${config.port}/_config with the JSON body above.` },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Protocol Handler (JSON-RPC 2.0) ─────────────────────────────────────

app.post('/mcp', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  // Validate JSON-RPC
  if (jsonrpc !== '2.0') {
    return res.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid JSON-RPC version' } });
  }

  try {
    switch (method) {
      case 'initialize':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'api-mock-generator',
              version: '1.0.0',
              description: 'Generate mock API servers from OpenAPI specs or natural language descriptions',
            },
          },
        });

      case 'notifications/initialized':
        return res.json({ jsonrpc: '2.0', id, result: {} });

      case 'tools/list':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { tools: TOOLS },
        });

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        if (!toolName) {
          return res.json({
            jsonrpc: '2.0', id,
            error: { code: -32602, message: 'Missing tool name' },
          });
        }

        try {
          const result = executeTool(toolName, toolArgs);
          return res.json({ jsonrpc: '2.0', id, result });
        } catch (err) {
          return res.json({
            jsonrpc: '2.0', id,
            result: {
              content: [{ type: 'text', text: `Error: ${err.message}` }],
              isError: true,
            },
          });
        }
      }

      default:
        return res.json({
          jsonrpc: '2.0', id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
    }
  } catch (err) {
    return res.json({
      jsonrpc: '2.0', id,
      error: { code: -32603, message: err.message },
    });
  }
});

// ── Convenience REST Endpoints ──────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-mock-generator',
    version: '1.0.0',
    tools: TOOLS.map(t => t.name),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'api-mock-generator',
    version: '1.0.0',
    description: 'Generate mock API servers from OpenAPI specs or natural language descriptions',
    endpoints: {
      mcp: 'POST /mcp — MCP JSON-RPC 2.0 endpoint',
      health: 'GET /health — Health check',
      docs: 'GET / — This documentation',
    },
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    quickStart: {
      step1: 'POST /mcp with { "jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": { "name": "mock_from_description", "arguments": { "description": "todo app with users and todos" } } }',
      step2: 'Save the generated code to server.js',
      step3: 'npm install express cors && node server.js',
    },
  });
});

// ── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  api-mock-generator v1.0.0`);
  console.log(`  MCP server running at http://localhost:${PORT}`);
  console.log(`  MCP endpoint: POST http://localhost:${PORT}/mcp`);
  console.log(`  Health: GET http://localhost:${PORT}/health\n`);
});

module.exports = app;
