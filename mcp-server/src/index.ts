import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
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
// Per-request instantiation is required — McpServer cannot be shared across
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

// MCP endpoint — stateless: fresh server + transport per POST.
app.post('/mcp', async (req, res) => {
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  res.on('close', () => {
    transport.close()
    server.close()
  })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
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
})

// GET/DELETE not supported in stateless mode.
app.get('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null,
  })
})

app.listen(PORT, () => {
  console.log(`FieldNotes MCP server running on port ${PORT}`)
})
