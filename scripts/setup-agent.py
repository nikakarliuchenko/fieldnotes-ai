#!/usr/bin/env python3
"""
One-time setup: creates the FieldNotes Research Agent and environment.
Run once, save the IDs to .env.agents, then use run-session.py for all future sessions.
"""
import anthropic
import os
from pathlib import Path

MCP_URL = "https://fieldnotes-ai-production.up.railway.app/mcp"
BETAS = ["managed-agents-2026-04-01"]

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

system_prompt = Path("scripts/agent-system-prompt.md").read_text()

print("Creating agent...")
agent = client.beta.agents.create(
    name="FieldNotes Research Agent",
    model="claude-opus-4-7",
    system=system_prompt,
    tools=[
        {"type": "agent_toolset_20260401"},
        {"type": "mcp_toolset", "mcp_server_name": "fieldnotes"},
    ],
    mcp_servers=[{
        "type": "url",
        "url": MCP_URL,
        "name": "fieldnotes",
    }],
    betas=BETAS,
)
print(f"Agent created: {agent.id}")

print("Creating environment...")
environment = client.beta.environments.create(
    name="fieldnotes-prod",
    config={
        "type": "cloud",
        "networking": {"type": "unrestricted"},
    },
    betas=BETAS,
)
print(f"Environment created: {environment.id}")

print("Creating vault...")
vault = client.beta.vaults.create(display_name="FieldNotes MCP", betas=BETAS)
print(f"Vault created: {vault.id}")

print("Adding MCP bearer token to vault...")
client.beta.vaults.credentials.create(
    vault_id=vault.id,
    auth={
        "type": "static_bearer",
        "token": os.environ["MCP_AUTH_TOKEN"],
        "mcp_server_url": MCP_URL,
    },
    betas=BETAS,
)
print("Credential added to vault.")

ids = {
    "AGENT_ID": agent.id,
    "ENVIRONMENT_ID": environment.id,
    "VAULT_ID": vault.id,
}

env_path = Path("scripts/.env.agents")
with open(env_path, "w") as f:
    for k, v in ids.items():
        f.write(f"{k}={v}\n")

print(f"\nSetup complete. IDs saved to {env_path}:")
for k, v in ids.items():
    print(f"  {k}={v}")
print("\nNext step: run scripts/run-session.py to start a research session.")
