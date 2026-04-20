import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

const app = express()
app.use(express.json())

const PORT = process.env.PORT ?? 3000

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

// MCP endpoint
app.all('/mcp', async (req, res) => {
  const server = new McpServer({
    name: 'fieldnotes',
    version: '1.0.0',
  })

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  })

  await server.connect(transport)
  await transport.handleRequest(req, res)
})

app.listen(PORT, () => {
  console.log(`FieldNotes MCP server running on port ${PORT}`)
})
