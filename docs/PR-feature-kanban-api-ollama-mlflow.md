# PR: Kanban API + Ollama + MLflow integration, AI provider support, and docs

## Summary
This PR introduces a FastAPI-based Kanban backend (`kanban_api/`) with Postgres, initial data seeding, and AI endpoints powered by LangChain. It adds provider-selectable AI (Ollama or OpenAI-compatible), aligns Docker Compose services, and documents end-to-end setup, including a connectivity test script.

## Key changes
- FastAPI service `kanban_api/` with SQLAlchemy 2.0 models and Pydantic schemas.
- AI endpoints using LangChain with provider switch:
  - `AI_PROVIDER=ollama|openai`
  - Default model set to `gemma3:1b`.
- Docker Compose improvements:
  - Postgres healthcheck + dependency gating.
  - `extra_hosts` so API can reach host Ollama via `host.docker.internal`.
- README updated with detailed run instructions and provider configuration.
- Connectivity test script `scripts/connectivity_test.sh` to validate services and AI endpoints.

## Environment variables
- `kanban_api/` (FastAPI):
  - `DATABASE_URL=postgresql+psycopg2://appuser:apppass@postgres:5432/app_db`
  - `CORS_ORIGIN=http://localhost:8080`
  - `AI_PROVIDER=ollama|openai`
  - `MODEL_NAME=gemma3:1b`
  - `OLLAMA_BASE_URL=http://host.docker.internal:11434` (for Ollama)
  - `OPENAI_BASE_URL`, `OPENAI_API_KEY` (for OpenAI-compatible)
- `backend/` (Node):
  - `LLM=ollamaService|openaiService`
  - `LLM_URL` to either `http://host.docker.internal:11434/api/generate` or `https://api.openai.com/v1/chat/completions`
  - `MODEL_NAME` (defaults to `gemma3:1b` for Ollama), `OPENAI_API_KEY` when using OpenAI-compatible

## Data contracts (Pydantic schemas)
Defined in `kanban_api/app/schemas.py`.

- BoardRead:
  - `{ id: int, name: str, created_at: datetime }`
- ColumnRead:
  - `{ id: int, board_id: int, name: str, position: int }`
- ApplicationRead:
  - `{ id: int, board_id: int, column_id: int, title: str, company: str, description: str|None, status: str|None, tags: List[str], created_at: datetime, updated_at: datetime }`
- ResumeRead:
  - `{ id: int, application_id: int, content: str, created_at: datetime }`

AI contracts in `kanban_api/app/routes_ai.py`:
- SummarizeBoardRequest `{ board_id: int, focus?: str }` -> SummarizeBoardResponse `{ summary: str }`
- TagApplicationRequest `{ application_id: int, max_tags?: int }` -> TagApplicationResponse `{ tags: List[str] }`
- NextStepsRequest `{ application_id: int }` -> NextStepsResponse `{ steps: List[str] }`

## API routes
- Kanban (`kanban_api/app/routes_kanban.py`):
  - `GET /kanban/boards` -> `List[BoardRead]`
  - `GET /kanban/boards/{board_id}/columns` -> `List[ColumnRead]`
  - `GET /kanban/boards/{board_id}/applications` -> `List[ApplicationRead]`
  - `POST /kanban/boards/{board_id}/applications` -> `ApplicationRead`
- AI (`kanban_api/app/routes_ai.py`):
  - `POST /ai/summarize-board` -> `SummarizeBoardResponse`
  - `POST /ai/tag-application` -> `TagApplicationResponse`
  - `POST /ai/next-steps` -> `NextStepsResponse`
- Resumes (`kanban_api/app/routes_resumes.py`):
  - `POST /resumes` -> `ResumeRead`
  - `GET /resumes/applications/{application_id}` -> `List[ResumeRead]`

## How to run
```bash
docker compose up -d --build
# Start Ollama on host and pull model
o llama serve &
ollama pull gemma3:1b
# Validate connectivity
./scripts/connectivity_test.sh
```

## Tests performed
- CRUD tested for boards/columns/applications.
- AI endpoints tested against Ollama `gemma3:1b` via host mapping.
- `scripts/connectivity_test.sh` consolidates health checks and AI calls.

## Frontend unification (WIP)
- Plan to unify into a single CRA app with `react-router-dom` and shared navbar.
- Routes: `/kanban` (drag-and-drop board with CRUD) and `/resume` (resume builder), with consistent Kanban styling.
- Integrate AI actions (summarize, tag, next steps) on application cards.

## Next steps
- Add Alembic migrations and a formal seed script.
- Implement frontend unification pages and shared styles; wire to FastAPI.
- Optional: Add Ollama as a Compose service and point `AI_PROVIDER=ollama` with `OLLAMA_BASE_URL=http://ollama:11434`.
- Configure MLflow tracking in `llm-experiments` to use Postgres backend.

## Notes
- `kanban_api` includes retry and DB health gating to ensure reliable startup.
- OpenAI-compatible support added via `langchain-openai` and `ChatOpenAI`, gated by envs.
