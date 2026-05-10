#!/usr/bin/env python3
"""
Creates the FieldNotes Research Digest Agent.
No MCP server or vault — the agent uses only built-in tools.

Usage:
    ANTHROPIC_API_KEY=<key> python3 scripts/setup-agent.py
"""
import anthropic
import os
import sys
from pathlib import Path

BETAS = ["managed-agents-2026-04-01"]
AGENT_NAME = "FieldNotes Research Digest"
ENVIRONMENT_NAME = "FieldNotes Research Digest"
MODEL = "claude-sonnet-4-6"

SYSTEM_PROMPT = """You are a research agent for Nika Karliuchenko, a developer building in public at fieldnotes-ai.com.

## Your job
Research the latest developments across six AI sources. Produce a structured digest with exactly three sections. Output it as plain text — your runner script will handle email delivery.

## About Nika
Stack: Claude Managed Agents, MCP servers, Contentful, Next.js, Supabase pgvector, Voyage AI, Railway, Vercel, Resend
Audience: AI practitioners building with Claude, Contentful developers, people building in public
Goals: Ship fieldnotes-ai.com content regularly, build in public, learn agentic AI patterns

## Sources to research (cover all six every run)
- Anthropic — blog.anthropic.com, docs.anthropic.com changelog, github.com/anthropics
- OpenAI — openai.com/blog, platform.openai.com/docs
- Google DeepMind — deepmind.google/discover/blog
- xAI / Grok — x.ai/news, @xai on X
- Perplexity — blog.perplexity.ai, @perplexity_ai on X
- Andrej Karpathy — @karpathy on X, youtube.com/@AndrejKarpathy

## Output format
Produce exactly this structure — three sections, nothing else:

---
## What Shipped
[3-5 items. One sentence each. Include source URL. Facts only, no opinion.]

## What to Try
[2-3 items relevant to Nika's stack. One sentence on what it is, one sentence on why it matters to her specifically.]

## Field Note Candidates
[1-2 topic suggestions. One sentence on the topic, one sentence on the angle worth writing about.]
---

## Rules
- Cover all six sources every run — if nothing notable at a source, say so in one line
- Be specific: distinguish what shipped vs what was announced vs what is rumored
- Never invent items — only include things found via web_search or web_fetch
- No hype, no filler, no preamble — start directly with ## What Shipped
- When done, output the digest and nothing else"""


def write_env_agents(agent_id: str, environment_id: str) -> None:
    env_path = Path("scripts/.env.agents")
    env_path.write_text(
        f"AGENT_ID={agent_id}\n"
        f"ENVIRONMENT_ID={environment_id}\n"
    )
    print(f"Wrote {env_path}")


def main() -> None:
    if "ANTHROPIC_API_KEY" not in os.environ:
        print("Error: ANTHROPIC_API_KEY not set in environment.")
        sys.exit(1)

    client = anthropic.Anthropic()

    print(f"Creating agent: {AGENT_NAME}")
    agent = client.beta.agents.create(
        name=AGENT_NAME,
        model=MODEL,
        system=SYSTEM_PROMPT,
        tools=[
            {
                "type": "agent_toolset_20260401",
                "default_config": {
                    "enabled": True,
                    "permission_policy": {"type": "always_allow"},
                },
            }
        ],
        betas=BETAS,
    )
    print(f"  Agent ID: {agent.id}")

    print(f"Creating environment: {ENVIRONMENT_NAME}")
    environment = client.beta.environments.create(
        name=ENVIRONMENT_NAME,
        betas=BETAS,
    )
    print(f"  Environment ID: {environment.id}")

    write_env_agents(agent.id, environment.id)
    print("Done.")


if __name__ == "__main__":
    main()
