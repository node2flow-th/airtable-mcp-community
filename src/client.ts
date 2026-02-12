/**
 * Airtable API Client
 * Uses Personal Access Token (PAT) for Bearer authentication
 */

import type {
  AirtableConfig,
  AirtableRecord,
  AirtableRecordList,
  AirtableDeleteResult,
  AirtableBaseList,
  AirtableSchema,
  AirtableTable,
  AirtableField,
  AirtableWebhookList,
  AirtableWebhookCreate,
  AirtableWebhookRefresh,
  AirtableWebhookPayloads,
} from './types.js';

export class AirtableClient {
  private config: AirtableConfig;
  private baseUrl = 'https://api.airtable.com/v0';

  constructor(config: AirtableConfig) {
    this.config = config;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.pat}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API Error (${response.status}): ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // ========== Records ==========

  async listRecords(
    baseId: string,
    tableIdOrName: string,
    params?: {
      pageSize?: number;
      maxRecords?: number;
      view?: string;
      sort?: Array<{ field: string; direction?: string }>;
      filterByFormula?: string;
      fields?: string[];
      offset?: string;
      cellFormat?: string;
      timeZone?: string;
      returnFieldsByFieldId?: boolean;
    }
  ): Promise<AirtableRecordList> {
    const query = new URLSearchParams();
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.maxRecords) query.set('maxRecords', String(params.maxRecords));
    if (params?.view) query.set('view', params.view);
    if (params?.filterByFormula) query.set('filterByFormula', params.filterByFormula);
    if (params?.cellFormat) query.set('cellFormat', params.cellFormat);
    if (params?.timeZone) query.set('timeZone', params.timeZone);
    if (params?.offset) query.set('offset', params.offset);
    if (params?.returnFieldsByFieldId) query.set('returnFieldsByFieldId', 'true');
    if (params?.fields) {
      for (const f of params.fields) query.append('fields[]', f);
    }
    if (params?.sort) {
      params.sort.forEach((s, i) => {
        query.set(`sort[${i}][field]`, s.field);
        if (s.direction) query.set(`sort[${i}][direction]`, s.direction);
      });
    }
    const qs = query.toString();
    return this.request(`/${baseId}/${encodeURIComponent(tableIdOrName)}${qs ? `?${qs}` : ''}`);
  }

  async getRecord(
    baseId: string,
    tableIdOrName: string,
    recordId: string
  ): Promise<AirtableRecord> {
    return this.request(`/${baseId}/${encodeURIComponent(tableIdOrName)}/${recordId}`);
  }

  async createRecords(
    baseId: string,
    tableIdOrName: string,
    records: Array<{ fields: Record<string, unknown> }>,
    typecast?: boolean
  ): Promise<AirtableRecordList> {
    const body: Record<string, unknown> = { records };
    if (typecast) body.typecast = true;
    return this.request(`/${baseId}/${encodeURIComponent(tableIdOrName)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateRecords(
    baseId: string,
    tableIdOrName: string,
    records: Array<{ id: string; fields: Record<string, unknown> }>,
    typecast?: boolean
  ): Promise<AirtableRecordList> {
    const body: Record<string, unknown> = { records };
    if (typecast) body.typecast = true;
    return this.request(`/${baseId}/${encodeURIComponent(tableIdOrName)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteRecords(
    baseId: string,
    tableIdOrName: string,
    recordIds: string[]
  ): Promise<AirtableDeleteResult> {
    const query = recordIds.map(id => `records[]=${id}`).join('&');
    return this.request(`/${baseId}/${encodeURIComponent(tableIdOrName)}?${query}`, {
      method: 'DELETE',
    });
  }

  async upsertRecords(
    baseId: string,
    tableIdOrName: string,
    records: Array<{ fields: Record<string, unknown> }>,
    fieldsToMergeOn: string[],
    typecast?: boolean
  ): Promise<AirtableRecordList> {
    const body: Record<string, unknown> = {
      performUpsert: { fieldsToMergeOn },
      records,
    };
    if (typecast) body.typecast = true;
    return this.request(`/${baseId}/${encodeURIComponent(tableIdOrName)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // ========== Bases & Schema ==========

  async listBases(offset?: string): Promise<AirtableBaseList> {
    const qs = offset ? `?offset=${offset}` : '';
    return this.request(`/meta/bases${qs}`);
  }

  async getBaseSchema(baseId: string): Promise<AirtableSchema> {
    return this.request(`/meta/bases/${baseId}/tables`);
  }

  async createBase(
    name: string,
    workspaceId: string,
    tables: Array<{
      name: string;
      fields: Array<{ name: string; type: string; options?: Record<string, unknown> }>;
      description?: string;
    }>
  ): Promise<Record<string, unknown>> {
    return this.request('/meta/bases', {
      method: 'POST',
      body: JSON.stringify({ name, workspaceId, tables }),
    });
  }

  async createTable(
    baseId: string,
    name: string,
    fields: Array<{ name: string; type: string; options?: Record<string, unknown> }>,
    description?: string
  ): Promise<AirtableTable> {
    const body: Record<string, unknown> = { name, fields };
    if (description) body.description = description;
    return this.request(`/meta/bases/${baseId}/tables`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateTable(
    baseId: string,
    tableId: string,
    params: { name?: string; description?: string }
  ): Promise<AirtableTable> {
    return this.request(`/meta/bases/${baseId}/tables/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async createField(
    baseId: string,
    tableId: string,
    name: string,
    type: string,
    options?: Record<string, unknown>,
    description?: string
  ): Promise<AirtableField> {
    const body: Record<string, unknown> = { name, type };
    if (options) body.options = options;
    if (description) body.description = description;
    return this.request(`/meta/bases/${baseId}/tables/${tableId}/fields`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateField(
    baseId: string,
    tableId: string,
    fieldId: string,
    params: { name?: string; description?: string }
  ): Promise<AirtableField> {
    return this.request(`/meta/bases/${baseId}/tables/${tableId}/fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  // ========== Webhooks ==========

  async createWebhook(
    baseId: string,
    notificationUrl: string,
    specification?: Record<string, unknown>
  ): Promise<AirtableWebhookCreate> {
    const body: Record<string, unknown> = { notificationUrl };
    if (specification) body.specification = specification;
    return this.request(`/bases/${baseId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async listWebhooks(baseId: string): Promise<AirtableWebhookList> {
    return this.request(`/bases/${baseId}/webhooks`);
  }

  async refreshWebhook(baseId: string, webhookId: string): Promise<AirtableWebhookRefresh> {
    return this.request(`/bases/${baseId}/webhooks/${webhookId}/refresh`, {
      method: 'POST',
    });
  }

  async listWebhookPayloads(
    baseId: string,
    webhookId: string,
    cursor?: number,
    limit?: number
  ): Promise<AirtableWebhookPayloads> {
    const query = new URLSearchParams();
    if (cursor !== undefined) query.set('cursor', String(cursor));
    if (limit) query.set('limit', String(limit));
    const qs = query.toString();
    return this.request(`/bases/${baseId}/webhooks/${webhookId}/payloads${qs ? `?${qs}` : ''}`);
  }

  async deleteWebhook(baseId: string, webhookId: string): Promise<Record<string, unknown>> {
    return this.request(`/bases/${baseId}/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }
}
