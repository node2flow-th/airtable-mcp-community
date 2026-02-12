/**
 * Airtable API - MCP Tool Definitions (18 tools)
 */

export interface ToolAnnotation {
  title: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  annotations: ToolAnnotation;
  inputSchema: Record<string, unknown>;
}

export const TOOLS: MCPToolDefinition[] = [
  // ========== Record Tools (6) ==========
  {
    name: 'airtable_list_records',
    description:
      'List records from an Airtable table. Supports filtering with formulas, sorting, field selection, views, and pagination (max 100 per page). Use the offset token from the response to get the next page.',
    annotations: {
      title: 'List Records',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID (e.g., "appXXXXXXXXXXXXXX")',
        },
        table_id_or_name: {
          type: 'string',
          description: 'Table ID (e.g., "tblXXX") or table name (e.g., "Tasks")',
        },
        page_size: {
          type: 'number',
          description: 'Number of records per page (1-100, default: 100)',
        },
        max_records: {
          type: 'number',
          description: 'Maximum total records to return',
        },
        view: {
          type: 'string',
          description: 'View name or ID to use for pre-filtering',
        },
        filter_by_formula: {
          type: 'string',
          description: 'Airtable formula to filter records (e.g., "{Status}=\'Active\'")',
        },
        sort: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of sort objects: [{"field": "Name", "direction": "asc"}]',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of field names to include in the response',
        },
        offset: {
          type: 'string',
          description: 'Pagination token from previous response',
        },
      },
      required: ['base_id', 'table_id_or_name'],
    },
  },
  {
    name: 'airtable_get_record',
    description:
      'Get a single record by its ID. Returns the record with all fields.',
    annotations: {
      title: 'Get Record',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id_or_name: {
          type: 'string',
          description: 'Table ID or name',
        },
        record_id: {
          type: 'string',
          description: 'Record ID (e.g., "recXXXXXXXXXXXXXX")',
        },
      },
      required: ['base_id', 'table_id_or_name', 'record_id'],
    },
  },
  {
    name: 'airtable_create_records',
    description:
      'Create one or more records in a table (max 10 per request). Each record needs a "fields" object with field name-value pairs. Enable typecast to auto-convert values to the correct field type.',
    annotations: {
      title: 'Create Records',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id_or_name: {
          type: 'string',
          description: 'Table ID or name',
        },
        records: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of record objects (max 10). Each: {"fields": {"Name": "value", "Status": "Open"}}',
        },
        typecast: {
          type: 'boolean',
          description: 'Auto-convert field values to correct type (default: false)',
        },
      },
      required: ['base_id', 'table_id_or_name', 'records'],
    },
  },
  {
    name: 'airtable_update_records',
    description:
      'Update specific fields in one or more records (PATCH — partial update, max 10 per request). Only specified fields are changed; other fields remain untouched.',
    annotations: {
      title: 'Update Records',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id_or_name: {
          type: 'string',
          description: 'Table ID or name',
        },
        records: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of record objects (max 10). Each: {"id": "recXXX", "fields": {"Status": "Done"}}',
        },
        typecast: {
          type: 'boolean',
          description: 'Auto-convert field values to correct type (default: false)',
        },
      },
      required: ['base_id', 'table_id_or_name', 'records'],
    },
  },
  {
    name: 'airtable_delete_records',
    description:
      'Delete one or more records by their IDs (max 10 per request). This action is irreversible.',
    annotations: {
      title: 'Delete Records',
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id_or_name: {
          type: 'string',
          description: 'Table ID or name',
        },
        record_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of record IDs to delete (max 10)',
        },
      },
      required: ['base_id', 'table_id_or_name', 'record_ids'],
    },
  },
  {
    name: 'airtable_upsert_records',
    description:
      'Update existing records or create new ones based on matching fields. Specify fields_to_merge_on to match existing records — matched records are updated, unmatched are created.',
    annotations: {
      title: 'Upsert Records',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id_or_name: {
          type: 'string',
          description: 'Table ID or name',
        },
        records: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of record objects. Each: {"fields": {"Email": "user@example.com", "Name": "John"}}',
        },
        fields_to_merge_on: {
          type: 'array',
          items: { type: 'string' },
          description: 'Field names to match existing records on (e.g., ["Email"])',
        },
        typecast: {
          type: 'boolean',
          description: 'Auto-convert field values to correct type (default: false)',
        },
      },
      required: ['base_id', 'table_id_or_name', 'records', 'fields_to_merge_on'],
    },
  },

  // ========== Bases & Schema Tools (7) ==========
  {
    name: 'airtable_list_bases',
    description:
      'List all bases accessible to the authenticated user. Returns base ID, name, and permission level.',
    annotations: {
      title: 'List Bases',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        offset: {
          type: 'string',
          description: 'Pagination token from previous response',
        },
      },
    },
  },
  {
    name: 'airtable_get_base_schema',
    description:
      'Get the complete schema of a base — all tables with their fields (name, type, options) and views. Essential for understanding the data structure before querying.',
    annotations: {
      title: 'Get Base Schema',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID (e.g., "appXXXXXXXXXXXXXX")',
        },
      },
      required: ['base_id'],
    },
  },
  {
    name: 'airtable_create_base',
    description:
      'Create a new base in a workspace. Requires at least one table with at least one field.',
    annotations: {
      title: 'Create Base',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the new base',
        },
        workspace_id: {
          type: 'string',
          description: 'Workspace ID (e.g., "wspXXXXXXXXXXXXXX")',
        },
        tables: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of table definitions. Each: {"name": "Tasks", "fields": [{"name": "Name", "type": "singleLineText"}]}',
        },
      },
      required: ['name', 'workspace_id', 'tables'],
    },
  },
  {
    name: 'airtable_create_table',
    description:
      'Create a new table in a base. Requires at least one field. Field types: singleLineText, multilineText, number, singleSelect, multipleSelects, date, checkbox, email, url, etc.',
    annotations: {
      title: 'Create Table',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        name: {
          type: 'string',
          description: 'Table name',
        },
        fields: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of field definitions. Each: {"name": "Status", "type": "singleSelect", "options": {"choices": [{"name": "Open"}]}}',
        },
        description: {
          type: 'string',
          description: 'Table description',
        },
      },
      required: ['base_id', 'name', 'fields'],
    },
  },
  {
    name: 'airtable_update_table',
    description:
      'Update a table name or description.',
    annotations: {
      title: 'Update Table',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id: {
          type: 'string',
          description: 'Table ID (e.g., "tblXXXXXXXXXXXXXX")',
        },
        name: {
          type: 'string',
          description: 'New table name',
        },
        description: {
          type: 'string',
          description: 'New table description',
        },
      },
      required: ['base_id', 'table_id'],
    },
  },
  {
    name: 'airtable_create_field',
    description:
      'Add a new field to a table. Common types: singleLineText, multilineText, number, singleSelect, multipleSelects, date, dateTime, checkbox, email, url, multipleAttachments, multipleRecordLinks.',
    annotations: {
      title: 'Create Field',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id: {
          type: 'string',
          description: 'Table ID',
        },
        name: {
          type: 'string',
          description: 'Field name',
        },
        type: {
          type: 'string',
          description: 'Field type (e.g., "singleLineText", "number", "singleSelect")',
        },
        options: {
          type: 'object',
          description: 'Field options (e.g., for singleSelect: {"choices": [{"name": "High", "color": "redBright"}]})',
        },
        description: {
          type: 'string',
          description: 'Field description',
        },
      },
      required: ['base_id', 'table_id', 'name', 'type'],
    },
  },
  {
    name: 'airtable_update_field',
    description:
      'Update a field name or description. Cannot change field type.',
    annotations: {
      title: 'Update Field',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        table_id: {
          type: 'string',
          description: 'Table ID',
        },
        field_id: {
          type: 'string',
          description: 'Field ID (e.g., "fldXXXXXXXXXXXXXX")',
        },
        name: {
          type: 'string',
          description: 'New field name',
        },
        description: {
          type: 'string',
          description: 'New field description',
        },
      },
      required: ['base_id', 'table_id', 'field_id'],
    },
  },

  // ========== Webhook Tools (5) ==========
  {
    name: 'airtable_create_webhook',
    description:
      'Create a webhook to receive notifications when data changes in a base. Webhooks expire after 7 days — use airtable_refresh_webhook to extend. Returns a MAC secret for verifying payloads.',
    annotations: {
      title: 'Create Webhook',
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        notification_url: {
          type: 'string',
          description: 'HTTPS URL to receive webhook notifications',
        },
        specification: {
          type: 'object',
          description: 'Webhook specification with filters (e.g., {"options": {"filters": {"dataTypes": ["tableData"], "recordChangeScope": "tblXXX"}}})',
        },
      },
      required: ['base_id', 'notification_url'],
    },
  },
  {
    name: 'airtable_list_webhooks',
    description:
      'List all webhooks for a base. Shows webhook IDs, enabled status, notification URLs, and expiration times.',
    annotations: {
      title: 'List Webhooks',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
      },
      required: ['base_id'],
    },
  },
  {
    name: 'airtable_refresh_webhook',
    description:
      'Extend a webhook expiration time by 7 days from now. Webhooks expire after 7 days — call this periodically to keep them active.',
    annotations: {
      title: 'Refresh Webhook',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID (e.g., "achXXXXXXXXXXXXXX")',
        },
      },
      required: ['base_id', 'webhook_id'],
    },
  },
  {
    name: 'airtable_list_webhook_payloads',
    description:
      'Get pending webhook notification payloads. Returns changed records, fields, and tables since the last cursor position.',
    annotations: {
      title: 'List Webhook Payloads',
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID',
        },
        cursor: {
          type: 'number',
          description: 'Cursor position from previous response for pagination',
        },
        limit: {
          type: 'number',
          description: 'Number of payloads to return (1-100, default: 100)',
        },
      },
      required: ['base_id', 'webhook_id'],
    },
  },
  {
    name: 'airtable_delete_webhook',
    description:
      'Delete a webhook. Stops all notifications for this webhook.',
    annotations: {
      title: 'Delete Webhook',
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        base_id: {
          type: 'string',
          description: 'Airtable base ID',
        },
        webhook_id: {
          type: 'string',
          description: 'Webhook ID to delete',
        },
      },
      required: ['base_id', 'webhook_id'],
    },
  },
];
