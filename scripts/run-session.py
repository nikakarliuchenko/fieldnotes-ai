#!/usr/bin/env python3
"""
Start a FieldNotes research session.
Usage: python3 scripts/run-session.py "Topic to research" <entry_number>
Example: python3 scripts/run-session.py "Building MCP servers with Streamable HTTP" 22
"""
import anthropic
import os
import sys
from pathlib import Path

BETAS = ["managed-agents-2026-04-01"]


def load_env_agents():
    env_path = Path("scripts/.env.agents")
    if not env_path.exists():
        print("Error: scripts/.env.agents not found. Run scripts/setup-agent.py first.")
        sys.exit(1)
    env = {}
    for line in env_path.read_text().splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/run-session.py <topic> <entry_number>")
        sys.exit(1)

    topic = sys.argv[1]
    entry_number = int(sys.argv[2])

    env = load_env_agents()
    agent_id = env["AGENT_ID"]
    environment_id = env["ENVIRONMENT_ID"]
    vault_id = env["VAULT_ID"]

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    print(f"Creating session for topic: {topic}")
    session = client.beta.sessions.create(
        agent=agent_id,
        environment_id=environment_id,
        vault_ids=[vault_id],
        title=f"Research: {topic}",
        betas=BETAS,
    )
    print(f"Session ID: {session.id}")

    initial_message = f"""Research and write a Field Note about the following topic:

Topic: {topic}

Context for this session:
- Session ID: {session.id}
- Entry number: {entry_number}
- Site: fieldnotes-ai.com

Start by calling check_topic_coverage to confirm this topic has not been covered yet.
Then follow your research methodology. Good luck."""

    print("\nStreaming session...\n")
    print("-" * 60)

    with client.beta.sessions.events.stream(session.id, betas=BETAS) as stream:
        client.beta.sessions.events.send(
            session.id,
            events=[{
                "type": "user.message",
                "content": [{"type": "text", "text": initial_message}],
            }],
            betas=BETAS,
        )
        for event in stream:
            etype = event.type
            if etype == "agent.message":
                for block in event.content:
                    if hasattr(block, "text"):
                        print(block.text, end="", flush=True)
            elif etype == "agent.tool_use":
                print(f"\n[Tool: {event.name}]", flush=True)
            elif etype == "agent.mcp_tool_use":
                print(f"\n[MCP Tool: {event.mcp_server_name}/{event.name}]", flush=True)
            elif etype == "session.status_idle":
                print("\n\n[Session idle — agent finished.]")
                break
            elif etype == "session.status_terminated":
                print("\n\n[Session terminated.]")
                break

    print("-" * 60)
    print(f"\nSession complete. ID: {session.id}")


if __name__ == "__main__":
    main()
