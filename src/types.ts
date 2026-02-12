/**
 * Airtable API - Type Definitions
 */

export interface AirtableConfig {
  pat: string;
}

// --- Record Types ---

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export interface AirtableRecordList {
  records: AirtableRecord[];
  offset?: string;
}

export interface AirtableDeletedRecord {
  id: string;
  deleted: boolean;
}

export interface AirtableDeleteResult {
  records: AirtableDeletedRecord[];
}

// --- Base Types ---

export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface AirtableBaseList {
  bases: AirtableBase[];
  offset?: string;
}

// --- Schema Types ---

export interface AirtableField {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, unknown>;
}

export interface AirtableView {
  id: string;
  name: string;
  type: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
  views: AirtableView[];
  description?: string;
}

export interface AirtableSchema {
  tables: AirtableTable[];
}

// --- Webhook Types ---

export interface AirtableWebhook {
  id: string;
  type?: string;
  isHookEnabled?: boolean;
  notificationUrl?: string;
  expirationTime?: string;
  cursorForNextPayload?: number;
  areNotificationsEnabled?: boolean;
  createdTime?: string;
  specification?: Record<string, unknown>;
}

export interface AirtableWebhookList {
  webhooks: AirtableWebhook[];
}

export interface AirtableWebhookCreate {
  id: string;
  macSecretBase64: string;
  expirationTime: string;
}

export interface AirtableWebhookRefresh {
  expirationTime: string;
}

export interface AirtableWebhookPayload {
  timestamp: string;
  baseTransactionNumber: number;
  payloadFormat: string;
  actionMetadata: Record<string, unknown>;
  changedTablesById: Record<string, unknown>;
}

export interface AirtableWebhookPayloads {
  payloads: AirtableWebhookPayload[];
  cursor: number;
  mightHaveMore: boolean;
}
