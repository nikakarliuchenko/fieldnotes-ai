#!/usr/bin/env python3
"""
Creates a Memory Store for the FieldNotes Research Digest agent.
Run once. Appends MEMORY_STORE_ID to scripts/.env.agents.

Usage:
    ANTHROPIC_API_KEY=<key> python3 scripts/setup-memory.py
"""
import anthropic
import os
import sys
from pathlib import Path

BETAS = ["managed-agents-2026-04-01"]
MEMORY_STORE_NAME = "FieldNotes Digest History"
MEMORY_STORE_DESCRIPTION = (
    "Tracks items already surfaced in past research digests so the agent "
    "can dedupe coverage across runs."
)


def load_env_agents() -> dict:
    env_path = Path("scripts/.env.agents")
    if not env_path.exists():
        return {}
    env = {}
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def write_env_agents(env: dict) -> None:
    env_path = Path("scripts/.env.agents")
    lines = [f"{k}={v}" for k, v in env.items()]
    env_path.write_text("\n".join(lines) + "\n")
    print(f"Wrote {env_path}")


def main() -> None:
    if "ANTHROPIC_API_KEY" not in os.environ:
        print("Error: ANTHROPIC_API_KEY not set in environment.")
        sys.exit(1)

    existing = load_env_agents()
    if "MEMORY_STORE_ID" in existing:
        print(
            f"MEMORY_STORE_ID already present in scripts/.env.agents: "
            f"{existing['MEMORY_STORE_ID']}"
        )
        print("Delete the line and re-run if you want a fresh store.")
        sys.exit(0)

    client = anthropic.Anthropic()

    print(f"Creating memory store: {MEMORY_STORE_NAME}")
    store = client.beta.memory_stores.create(
        name=MEMORY_STORE_NAME,
        description=MEMORY_STORE_DESCRIPTION,
        betas=BETAS,
    )
    print(f"  Memory Store ID: {store.id}")

    existing["MEMORY_STORE_ID"] = store.id
    write_env_agents(existing)
    print("Done.")


if __name__ == "__main__":
    main()
