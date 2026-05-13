#!/usr/bin/env bash
set -euo pipefail

echo "== Connectivity Test: $(date) =="

print_section() {
  echo
  echo "# $1"
}

jq_safe() {
  if command -v jq >/dev/null 2>&1; then
    jq .
  else
    cat
  fi
}

print_section "Docker Services"
docker compose ps || true

print_section "Kanban API Health"
curl -sS http://localhost:8000/health | jq_safe || echo "Health check failed"

print_section "Boards"
curl -sS http://localhost:8000/kanban/boards | jq_safe || true

print_section "Columns (board 1)"
curl -sS http://localhost:8000/kanban/boards/1/columns | jq_safe || true

print_section "Applications (board 1)"
curl -sS http://localhost:8000/kanban/boards/1/applications | jq_safe || true

print_section "Ollama Tags (host)"
curl -sS http://localhost:11434/api/tags | jq_safe || echo "Ollama not reachable"

print_section "AI: Summarize Board"
curl -sS -X POST http://localhost:8000/ai/summarize-board \
  -H 'Content-Type: application/json' -d '{"board_id":1}' | jq_safe || true

print_section "AI: Tag Application (id=1)"
curl -sS -X POST http://localhost:8000/ai/tag-application \
  -H 'Content-Type: application/json' -d '{"application_id":1, "max_tags":5}' | jq_safe || true

print_section "AI: Next Steps (id=1)"
curl -sS -X POST http://localhost:8000/ai/next-steps \
  -H 'Content-Type: application/json' -d '{"application_id":1}' | jq_safe || true

echo
echo "== Connectivity Test Completed =="
