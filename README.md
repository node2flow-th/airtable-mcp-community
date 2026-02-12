# Airtable MCP Server

[![smithery badge](https://smithery.ai/badge/node2flow/airtable)](https://smithery.ai/server/node2flow/airtable)
[![npm version](https://img.shields.io/npm/v/@node2flow/airtable-mcp.svg)](https://www.npmjs.com/package/@node2flow/airtable-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for Airtable API — manage records, bases, tables, fields, and webhooks through 18 tools.

## Quick Start

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "airtable": {
      "command": "npx",
      "args": ["-y", "@node2flow/airtable-mcp"],
      "env": {
        "AIRTABLE_PAT": "your_personal_access_token"
      }
    }
  }
}
```

### HTTP Mode

```bash
AIRTABLE_PAT=your_token npx @node2flow/airtable-mcp --http
# MCP endpoint: http://localhost:3000/mcp
```

### Cloudflare Worker

```
POST https://airtable-mcp.node2flow.net/mcp?AIRTABLE_PAT=your_token
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `AIRTABLE_PAT` | Yes | Personal Access Token from [airtable.com/create/tokens](https://airtable.com/create/tokens) |

### Getting a Personal Access Token

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Create a new token with required scopes:
   - `data.records:read` — Read records
   - `data.records:write` — Create/Update/Delete records
   - `schema.bases:read` — Read base schema
   - `schema.bases:write` — Modify base schema
3. Select which bases/workspaces the token can access

## Tools (18)

### Record Tools (6)
| Tool | Description |
|------|-------------|
| `airtable_list_records` | List records with filters, sorting, pagination |
| `airtable_get_record` | Get a single record by ID |
| `airtable_create_records` | Create records (batch up to 10) |
| `airtable_update_records` | Partial update records (batch up to 10) |
| `airtable_delete_records` | Delete records (batch up to 10) |
| `airtable_upsert_records` | Update-or-create by matching fields |

### Bases & Schema Tools (7)
| Tool | Description |
|------|-------------|
| `airtable_list_bases` | List all accessible bases |
| `airtable_get_base_schema` | Get all tables, fields, views |
| `airtable_create_base` | Create a new base in a workspace |
| `airtable_create_table` | Create a new table with fields |
| `airtable_update_table` | Update table name or description |
| `airtable_create_field` | Add a field to a table |
| `airtable_update_field` | Update field name or description |

### Webhook Tools (5)
| Tool | Description |
|------|-------------|
| `airtable_create_webhook` | Create webhook for data changes |
| `airtable_list_webhooks` | List all webhooks for a base |
| `airtable_refresh_webhook` | Extend webhook expiration (+7 days) |
| `airtable_list_webhook_payloads` | Get pending webhook payloads |
| `airtable_delete_webhook` | Delete a webhook |

## Docker

```bash
docker compose up -d
# Endpoint: http://localhost:3024/mcp
```

## License

MIT
