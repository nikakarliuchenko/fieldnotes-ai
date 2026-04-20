# FieldNotes MCP Server

Custom MCP server for the FieldNotes Research Agent pipeline.
Provides three tools: semantic search over Field Notes, topic coverage checking, and Contentful draft creation.

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env
# Fill in .env values
npm run dev
```

## Tools

- **search_fieldnotes** — semantic search over existing Field Notes chunks
- **check_topic_coverage** — checks if a topic is too similar to existing content
- **push_contentful_draft** — pushes a draft to Contentful (never publishes)

## Deployment

Deployed on Railway. Point Railway at the `mcp-server/` subdirectory.
Requires all env vars from `.env.example` to be set in Railway dashboard.
