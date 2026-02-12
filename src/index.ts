#!/usr/bin/env node
/**
 * Airtable MCP Server
 *
 * Community edition — connects directly to Airtable API.
 *
 * Usage (stdio - for Claude Desktop / Cursor / VS Code):
 *   AIRTABLE_PAT=your_token npx @node2flow/airtable-mcp
 *
 * Usage (HTTP - Streamable HTTP transport):
 *   AIRTABLE_PAT=your_token npx @node2flow/airtable-mcp --http
 */

import { randomUUID } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  StreamableHTTPServerTransport,
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { createServer } from './server.js';
import { TOOLS } from './tools.js';

function getConfig() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) return null;
  return { pat };
}

async function startStdio() {
  const config = getConfig();
  const server = createServer(config ?? undefined);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Airtable MCP Server running on stdio');
  console.error(`PAT: ${config ? '***configured***' : '(not configured yet)'}`);
  console.error(`Tools available: ${TOOLS.length}`);
  console.error('Ready for MCP client\n');
}

async function startHttp() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const app = createMcpExpressApp({ host: '0.0.0.0' });

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.post('/mcp', async (req: any, res: any) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const qPat = url.searchParams.get('AIRTABLE_PAT');
    if (qPat) process.env.AIRTABLE_PAT = qPat;

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid: string) => {
            transports[sid] = transport;
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };

        const config = getConfig();
        const server = createServer(config ?? undefined);
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.get('/', (_req: any, res: any) => {
    res.json({
      name: 'airtable-mcp',
      version: '1.0.0',
      status: 'ok',
      tools: TOOLS.length,
      transport: 'streamable-http',
      endpoints: { mcp: '/mcp' },
    });
  });

  const config = getConfig();
  app.listen(port, () => {
    console.log(`Airtable MCP Server (HTTP) listening on port ${port}`);
    console.log(`PAT: ${config ? '***configured***' : '(not configured yet)'}`);
    console.log(`Tools available: ${TOOLS.length}`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  });

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    for (const sessionId in transports) {
      try {
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch { /* ignore */ }
    }
    process.exit(0);
  });
}

async function main() {
  const useHttp = process.argv.includes('--http');
  if (useHttp) {
    await startHttp();
  } else {
    await startStdio();
  }
}

export default function createSmitheryServer(opts?: { config?: { AIRTABLE_PAT?: string } }) {
  if (opts?.config?.AIRTABLE_PAT) process.env.AIRTABLE_PAT = opts.config.AIRTABLE_PAT;
  const config = getConfig();
  return createServer(config ?? undefined);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
