import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerSearchTool } from './tools/search.js'

// Validate required env vars at startup
if (!process.env.MCP_AUTH_TOKEN) throw new Error('MCP_AUTH_TOKEN is required')
if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is required')

const app = express()
app.use(express.json())

const PORT = process.env.PORT ?? 3000

function isAllowedOrigin(origin: string): boolean {
  const allowed = [
    'https://api.anthropic.com',
    process.env.ALLOWED_ORIGIN,
  ].filter(Boolean)
  return allowed.some(o => origin.startsWith(o as string))
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

// Create persistent MCP server at startup
const mcpServer = new McpServer({
  name: 'fieldnotes',
  version: '1.0.0',
})

// Register tools
registerSearchTool(mcpServer)

// MCP endpoint — transport is per-request, server is persistent
app.all('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  })
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res)
})

app.listen(PORT, () => {
  console.log(`FieldNotes MCP server running on port ${PORT}`)
})
