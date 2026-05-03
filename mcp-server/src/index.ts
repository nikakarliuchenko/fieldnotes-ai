import { randomUUID } from 'node:crypto'
import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { registerSearchTool } from './tools/search.js'
import { registerCoverageTool } from './tools/coverage.js'
import { registerPushDraftTool } from './tools/push-draft.js'

// Validate required env vars at startup
if (!process.env.MCP_AUTH_TOKEN) throw new Error('MCP_AUTH_TOKEN is required')
if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is required')

const app = express()
app.use(express.json())

const PORT = process.env.PORT ?? 3000

function isAllowedOrigin(origin: string): boolean {
  const allowed = [
    'https://api.anthropic.com',
    'https://managed-agents.anthropic.com',
    process.env.ALLOWED_ORIGIN,
  ].filter(Boolean)
  return allowed.some(o => origin.startsWith(o as string))
    || origin.endsWith('.anthropic.com')
}

// Origin header validation (DNS rebinding protection)
app.use('/mcp', (req, res, next) => {
  const origin = req.headers.origin
  // Allow requests with no Origin header (non-browser clients like the Managed Agents runtime)
  // Block requests where Origin is present but doesn't match expected values
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Forbidden: invalid origin' })
    return
  }
  next()
})

// Bearer token auth middleware
app.use('/mcp', (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${process.env.MCP_AUTH_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'fieldnotes-mcp', version: '1.0.0' })
})

// Factory: build a fresh MCP server with all tools registered.
// Per-session instantiation is required — McpServer cannot be shared across
// concurrent transports (GHSA-345p-7cg4-v4c7).
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'fieldnotes',
    version: '1.0.0',
  })
  registerSearchTool(server)
  registerCoverageTool(server)
  registerPushDraftTool(server)
  return server
}

// Active sessions: each MCP session owns its own server + transport.
type Session = { server: McpServer; transport: StreamableHTTPServerTransport }
const sessions = new Map<string, Session>()

function getSessionId(req: express.Request): string | undefined {
  const header = req.headers['mcp-session-id']
  return Array.isArray(header) ? header[0] : header
}

function badRequest(res: express.Response, message: string): void {
  res.status(400).json({
    jsonrpc: '2.0',
    error: { code: -32000, message },
    id: null,
  })
}

// POST /mcp — initialize a new session OR send a message on an existing one.
app.post('/mcp', async (req, res) => {
  const sessionId = getSessionId(req)

  if (sessionId) {
    const existing = sessions.get(sessionId)
    if (!existing) {
      badRequest(res, `Unknown session ID: ${sessionId}`)
      return
    }
    try {
      await existing.transport.handleRequest(req, res, req.body)
    } catch (err) {
      console.error('MCP request error:', err)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
    return
  }

  if (!isInitializeRequest(req.body)) {
    badRequest(res, 'No session ID provided and request is not an initialize')
    return
  }

  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (newSessionId) => {
      sessions.set(newSessionId, { server, transport })
    },
  })

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid) sessions.delete(sid)
    server.close().catch((err) => console.error('Error closing server:', err))
  }

  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (err) {
    console.error('MCP initialize error:', err)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      })
    }
  }
})

// GET /mcp — open SSE stream for server-initiated notifications.
app.get('/mcp', async (req, res) => {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    badRequest(res, 'Missing mcp-session-id header')
    return
  }
  const existing = sessions.get(sessionId)
  if (!existing) {
    badRequest(res, `Unknown session ID: ${sessionId}`)
    return
  }
  await existing.transport.handleRequest(req, res)
})

// DELETE /mcp — terminate a session.
app.delete('/mcp', async (req, res) => {
  const sessionId = getSessionId(req)
  if (!sessionId) {
    badRequest(res, 'Missing mcp-session-id header')
    return
  }
  const existing = sessions.get(sessionId)
  if (!existing) {
    badRequest(res, `Unknown session ID: ${sessionId}`)
    return
  }
  await existing.transport.handleRequest(req, res)
})

app.listen(PORT, () => {
  console.log(`FieldNotes MCP server running on port ${PORT}`)
})
