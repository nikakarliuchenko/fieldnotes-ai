#!/usr/bin/env python3
"""
One-shot: update the live FieldNotes Research Agent so the fieldnotes MCP toolset
runs with permission_policy=always_allow. Skips per-call user confirmation for
search_fieldnotes / check_topic_coverage / push_contentful_draft.

Usage:
    ANTHROPIC_API_KEY=<your-key> python3 scripts/update-agent-permissions.py
"""
import anthropic
import os
from pathlib import Path

BETAS = ["managed-agents-2026-04-01"]


def load_env_agents():
    env_path = Path("scripts/.env.agents")
    if not env_path.exists():
        raise SystemExit("scripts/.env.agents not found — run scripts/setup-agent.py first.")
    env = {}
    for line in env_path.read_text().splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def main():
    env = load_env_agents()
    agent_id = env["AGENT_ID"]

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    print(f"Retrieving current version of agent {agent_id}...")
    existing = client.beta.agents.retrieve(agent_id, betas=BETAS)
    print(f"Current version: {existing.version}")

    new_tools = [
        {"type": "agent_toolset_20260401"},
        {
            "type": "mcp_toolset",
            "mcp_server_name": "fieldnotes",
            "default_config": {
                "permission_policy": {"type": "always_allow"},
            },
        },
    ]

    print("Updating agent with always_allow on fieldnotes MCP toolset...")
    agent = client.beta.agents.update(
        agent_id,
        version=existing.version,
        tools=new_tools,
        betas=BETAS,
    )
    print(f"Updated agent {agent.id}: version {existing.version} -> {agent.version}")
    print("Tools now configured:")
    for tool in agent.tools:
        print(f"  - {tool}")


if __name__ == "__main__":
    main()
