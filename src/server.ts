/**
 * Shared MCP Server — used by both Node.js (index.ts) and CF Worker (worker.ts)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AirtableClient } from './client.js';
import { TOOLS } from './tools.js';

export interface AirtableMcpConfig {
  pat: string;
}

export function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  client: AirtableClient
) {
  switch (toolName) {
    // ========== Records ==========
    case 'airtable_list_records':
      return client.listRecords(
        args.base_id as string,
        args.table_id_or_name as string,
        {
          pageSize: args.page_size as number | undefined,
          maxRecords: args.max_records as number | undefined,
          view: args.view as string | undefined,
          filterByFormula: args.filter_by_formula as string | undefined,
          sort: args.sort as Array<{ field: string; direction?: string }> | undefined,
          fields: args.fields as string[] | undefined,
          offset: args.offset as string | undefined,
        }
      );
    case 'airtable_get_record':
      return client.getRecord(
        args.base_id as string,
        args.table_id_or_name as string,
        args.record_id as string
      );
    case 'airtable_create_records':
      return client.createRecords(
        args.base_id as string,
        args.table_id_or_name as string,
        args.records as Array<{ fields: Record<string, unknown> }>,
        args.typecast as boolean | undefined
      );
    case 'airtable_update_records':
      return client.updateRecords(
        args.base_id as string,
        args.table_id_or_name as string,
        args.records as Array<{ id: string; fields: Record<string, unknown> }>,
        args.typecast as boolean | undefined
      );
    case 'airtable_delete_records':
      return client.deleteRecords(
        args.base_id as string,
        args.table_id_or_name as string,
        args.record_ids as string[]
      );
    case 'airtable_upsert_records':
      return client.upsertRecords(
        args.base_id as string,
        args.table_id_or_name as string,
        args.records as Array<{ fields: Record<string, unknown> }>,
        args.fields_to_merge_on as string[],
        args.typecast as boolean | undefined
      );

    // ========== Bases & Schema ==========
    case 'airtable_list_bases':
      return client.listBases(args.offset as string | undefined);
    case 'airtable_get_base_schema':
      return client.getBaseSchema(args.base_id as string);
    case 'airtable_create_base':
      return client.createBase(
        args.name as string,
        args.workspace_id as string,
        args.tables as Array<{
          name: string;
          fields: Array<{ name: string; type: string; options?: Record<string, unknown> }>;
          description?: string;
        }>
      );
    case 'airtable_create_table':
      return client.createTable(
        args.base_id as string,
        args.name as string,
        args.fields as Array<{ name: string; type: string; options?: Record<string, unknown> }>,
        args.description as string | undefined
      );
    case 'airtable_update_table':
      return client.updateTable(
        args.base_id as string,
        args.table_id as string,
        { name: args.name as string | undefined, description: args.description as string | undefined }
      );
    case 'airtable_create_field':
      return client.createField(
        args.base_id as string,
        args.table_id as string,
        args.name as string,
        args.type as string,
        args.options as Record<string, unknown> | undefined,
        args.description as string | undefined
      );
    case 'airtable_update_field':
      return client.updateField(
        args.base_id as string,
        args.table_id as string,
        args.field_id as string,
        { name: args.name as string | undefined, description: args.description as string | undefined }
      );

    // ========== Webhooks ==========
    case 'airtable_create_webhook':
      return client.createWebhook(
        args.base_id as string,
        args.notification_url as string,
        args.specification as Record<string, unknown> | undefined
      );
    case 'airtable_list_webhooks':
      return client.listWebhooks(args.base_id as string);
    case 'airtable_refresh_webhook':
      return client.refreshWebhook(
        args.base_id as string,
        args.webhook_id as string
      );
    case 'airtable_list_webhook_payloads':
      return client.listWebhookPayloads(
        args.base_id as string,
        args.webhook_id as string,
        args.cursor as number | undefined,
        args.limit as number | undefined
      );
    case 'airtable_delete_webhook':
      return client.deleteWebhook(
        args.base_id as string,
        args.webhook_id as string
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export function createServer(config?: AirtableMcpConfig) {
  const server = new McpServer({
    name: 'airtable-mcp',
    version: '1.0.0',
  });

  let client: AirtableClient | null = null;

  // Register all 18 tools with annotations
  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema as any,
        annotations: tool.annotations,
      },
      async (args: Record<string, unknown>) => {
        const pat =
          config?.pat ||
          (args as Record<string, unknown>).AIRTABLE_PAT as string;

        if (!pat) {
          return {
            content: [{ type: 'text' as const, text: 'Error: AIRTABLE_PAT is required' }],
            isError: true,
          };
        }

        if (!client || config?.pat !== pat) {
          client = new AirtableClient({ pat });
        }

        try {
          const result = await handleToolCall(tool.name, args, client);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
          };
        }
      }
    );
  }

  // Register prompts
  server.prompt(
    'manage-records',
    'Guide for managing Airtable records — list, create, update, delete, upsert',
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'You are an Airtable data management assistant.',
            '',
            'Available record actions:',
            '1. **List records** — Use airtable_list_records with filters, sorting, pagination',
            '2. **Get record** — Use airtable_get_record by record ID',
            '3. **Create records** — Use airtable_create_records (batch up to 10)',
            '4. **Update records** — Use airtable_update_records (partial update, batch up to 10)',
            '5. **Delete records** — Use airtable_delete_records (batch up to 10)',
            '6. **Upsert records** — Use airtable_upsert_records to update-or-create by matching fields',
            '',
            'Start by listing bases with airtable_list_bases, then get the schema with airtable_get_base_schema.',
          ].join('\n'),
        },
      }],
    }),
  );

  server.prompt(
    'manage-schema',
    'Guide for managing Airtable bases, tables, fields, and webhooks',
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'You are an Airtable schema management assistant.',
            '',
            'Available schema actions:',
            '1. **List bases** — Use airtable_list_bases to see all accessible bases',
            '2. **Get schema** — Use airtable_get_base_schema for all tables, fields, views',
            '3. **Create base** — Use airtable_create_base with workspace ID and table definitions',
            '4. **Create table** — Use airtable_create_table with field definitions',
            '5. **Create field** — Use airtable_create_field (singleLineText, number, singleSelect, etc.)',
            '6. **Webhooks** — Use airtable_create_webhook, airtable_list_webhooks, airtable_refresh_webhook',
            '',
            'What would you like to manage?',
          ].join('\n'),
        },
      }],
    }),
  );

  // Register resources
  server.resource(
    'server-info',
    'airtable://server-info',
    {
      description: 'Connection status and available tools for this Airtable MCP server',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [{
        uri: 'airtable://server-info',
        mimeType: 'application/json',
        text: JSON.stringify({
          name: 'airtable-mcp',
          version: '1.0.0',
          connected: !!config,
          tools_available: TOOLS.length,
          tool_categories: {
            records: 6,
            bases_and_schema: 7,
            webhooks: 5,
          },
        }, null, 2),
      }],
    }),
  );

  // Override tools/list handler to return raw JSON Schema with property descriptions.
  // McpServer's Zod processing strips raw JSON Schema properties, returning empty schemas.
  (server as any).server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
    })),
  }));

  return server;
}
