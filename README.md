# api-mock-generator

Generate mock API servers instantly from OpenAPI specs or natural language descriptions. MCP-enabled.

## Quick Start

```bash
npm install
npm start
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `mock_from_openapi` | Generate mock server from OpenAPI 3.x spec |
| `mock_from_description` | Generate mock from natural language (e.g., "todo app with users, todos, auth") |
| `generate_types` | Generate TypeScript interfaces |
| `generate_client` | Generate fetch-based API client SDK |
| `mock_config` | Configure delay, error rates, pagination |

## Features

- **Zero external API dependencies** — all data generation is built-in
- **Contextual fake data** — names for name fields, emails for email fields, dates for timestamps
- **CRUD endpoints** — auto-generated list, get, create, update, delete
- **Pagination** — built-in page/limit support on list endpoints
- **Request logging** — GET /_logs to inspect all requests
- **Error simulation** — configurable error rate for resilience testing
- **Response delay** — simulate slow networks
- **TypeScript types** — generate interfaces for all resources
- **Client SDK** — ready-to-use fetch-based API client

## License

MIT
