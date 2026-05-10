#!/usr/bin/env python3
"""
Run the FieldNotes Research Digest agent and email the result via Resend.

Usage:
    ANTHROPIC_API_KEY=<key> RESEND_API_KEY=<key> python3 scripts/run-session.py
"""
import anthropic
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

BETAS = ["managed-agents-2026-04-01"]
DIGEST_FROM = "digest@fieldnotes-ai.com"
DIGEST_TO = "nika.miami@gmail.com"
RESEND_URL = "https://api.resend.com/emails"


def load_env_agents() -> dict:
    env_path = Path("scripts/.env.agents")
    if not env_path.exists():
        print("Error: scripts/.env.agents not found. Run scripts/setup-agent.py first.")
        sys.exit(1)
    env = {}
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def markdown_to_html(text: str) -> str:
    """Minimal markdown -> HTML: ##/#, **, [t](u), ---, blank lines, line breaks."""
    lines = []
    for line in text.split("\n"):
        if line.startswith("## "):
            lines.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("# "):
            lines.append(f"<h1>{line[2:]}</h1>")
        elif line.strip() == "---":
            lines.append("<hr>")
        else:
            lines.append(line)
    html = "\n".join(lines)
    html = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", html)
    html = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', html)
    out_lines = []
    for line in html.split("\n"):
        stripped = line.strip()
        if not stripped:
            out_lines.append("<br>")
        elif stripped.startswith("<h") or stripped.startswith("<hr"):
            out_lines.append(line)
        else:
            out_lines.append(line + "<br>")
    return "\n".join(out_lines)


def send_via_resend(api_key: str, subject: str, html: str, text: str) -> None:
    payload = json.dumps({
        "from": DIGEST_FROM,
        "to": [DIGEST_TO],
        "subject": subject,
        "html": html,
        "text": text,
    }).encode("utf-8")
    request = urllib.request.Request(
        RESEND_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "fieldnotes-digest/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        response.read()


def main() -> None:
    if "ANTHROPIC_API_KEY" not in os.environ:
        print("Error: ANTHROPIC_API_KEY not set.")
        sys.exit(1)
    if "RESEND_API_KEY" not in os.environ:
        print("Error: RESEND_API_KEY not set.")
        sys.exit(1)

    env = load_env_agents()
    agent_id = env["AGENT_ID"]
    environment_id = env["ENVIRONMENT_ID"]
    resend_key = os.environ["RESEND_API_KEY"]

    today = datetime.date.today()
    today_iso = today.isoformat()
    today_friendly = f"{today.strftime('%B')} {today.day}, {today.year}"
    initial_message = (
        "Run the research digest. Cover all six sources: Anthropic, OpenAI, "
        "Google DeepMind, xAI/Grok, Perplexity, and Andrej Karpathy. "
        f"Today's date is {today_iso}. "
        "Only surface items published or updated in the last 72 hours."
    )
    title = f"AI Digest — {today_friendly}"[:500]

    client = anthropic.Anthropic()

    print(f"Creating session: {title}")
    session = client.beta.sessions.create(
        agent=agent_id,
        environment_id=environment_id,
        title=title,
        betas=BETAS,
    )
    print(f"Session ID: {session.id}")
    print()
    print("-" * 60)

    digest_chunks = []

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
                        digest_chunks.append(block.text)
                        print(block.text, end="", flush=True)
            elif etype == "agent.tool_use":
                print(f"\n[Tool: {event.name}]", flush=True)
            elif etype == "session.error":
                error = event.error
                print(f"\n[SESSION ERROR: {error.type}] {error.message}", flush=True)
            elif etype == "session.status_idle":
                print("\n\n[Session idle — agent finished.]")
                break
            elif etype == "session.status_terminated":
                print("\n\n[Session terminated.]")
                break

    print("-" * 60)

    digest_text = "".join(digest_chunks).strip()
    if not digest_text:
        print("No agent output captured. Aborting email send.")
        sys.exit(1)

    subject = f"AI Digest — {today_friendly}"
    html_body = markdown_to_html(digest_text)

    try:
        send_via_resend(resend_key, subject, html_body, digest_text)
        print(f"Digest sent to {DIGEST_TO}")
    except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError) as e:
        print(f"\nERROR: Resend send failed — {e}")
        print("\n--- AGENT OUTPUT ---")
        print(digest_text)
        print("--- END ---")
        sys.exit(1)


if __name__ == "__main__":
    main()
