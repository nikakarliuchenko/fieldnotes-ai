---
name: digest-test
description: Test the research digest pipeline locally before deploying changes
---

Run a local test of the research digest pipeline. Steps:

1. Check required env vars are set:
   - echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:8}..."
   - echo "RESEND_API_KEY: ${RESEND_API_KEY:0:8}..."
   - If either is missing, stop and tell the user what to set

2. Check scripts/.env.agents exists and has AGENT_ID, ENVIRONMENT_ID, MEMORY_STORE_ID:
   - cat scripts/.env.agents
   - If missing any key, stop and tell the user to run setup-agent.py or setup-memory.py

3. Run the digest:
   - python3 scripts/run-session.py

4. After completion, confirm whether "Digest sent to nika.miami@gmail.com" appeared in output
