# 🧠 Resume Builder App

This project includes:

- A classic Resume Generator (`backend` + `frontend`).
- A new Kanban API (`kanban_api/`) with AI endpoints using LangChain + Ollama.
- Postgres database and MLflow service.

All services are orchestrated using Docker Compose.

## 📦 Requirements

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- Optional (for local AI): [Ollama](https://ollama.com/) installed on the host

## 🚀 Run the Stack (Docker Compose)

Start all services (Postgres, MLflow, Kanban API, backend, frontend):

```bash
docker compose up -d --build
```

- Frontend (CRA): http://localhost:8080
- Node Backend: http://localhost:5001
- Kanban API (FastAPI): http://localhost:8000
- MLflow UI: http://localhost:5002

Check health of the Kanban API:

```bash
curl -s http://localhost:8000/health
```

Basic Kanban endpoints:

```bash
curl -s http://localhost:8000/kanban/boards
curl -s http://localhost:8000/kanban/boards/1/columns
curl -s http://localhost:8000/kanban/boards/1/applications
```

## 🌐 Backend Environment Variables

- `backend/` (Node):
  - `PORT`: port to listen on (default 5001)
  - `CORS_ORIGIN`: allowed origin for frontend requests
  - `LLM_URL`: URL to the LLM API (e.g., Ollama instance)
  - `MODEL_NAME`: model name

- `kanban_api/` (FastAPI):
  - `DATABASE_URL`: `postgresql+psycopg2://appuser:apppass@postgres:5432/app_db`
  - `CORS_ORIGIN`: `http://localhost:8080`
  - `AI_PROVIDER`: `ollama` or `openai`
  - `MODEL_NAME`: `gemma3:1b` (default)
  - `OLLAMA_BASE_URL`: `http://host.docker.internal:11434`
  - `OPENAI_BASE_URL`: OpenAI-compatible base URL (e.g. `https://api.openai.com/v1` or a gateway)
  - `OPENAI_API_KEY`: API key when using the OpenAI-compatible provider

## 📂 Output Directory

All generated resumes and related files are saved in the local ./output directory, which is mounted into the backend container.

## 🤖 AI (Ollama) Setup (Local Host)

The Kanban AI endpoints use Ollama via `OLLAMA_BASE_URL`. To run locally on the host:

1) Start the Ollama server (host):

```bash
ollama serve
```

2) In a separate terminal, pull the model tag used by this repo (smallest):

```bash
ollama pull gemma3:1b
```

3) Verify Ollama is up and reachable:

```bash
curl -s http://localhost:11434/api/tags
```

4) Test AI endpoints (kanban_api):

```bash
curl -s -X POST http://localhost:8000/ai/summarize-board \
  -H 'Content-Type: application/json' -d '{"board_id":1}'

curl -s -X POST http://localhost:8000/ai/tag-application \
  -H 'Content-Type: application/json' -d '{"application_id":1, "max_tags":5}'

curl -s -X POST http://localhost:8000/ai/next-steps \
  -H 'Content-Type: application/json' -d '{"application_id":1}'
```

Note: `kanban_api` includes `extra_hosts: host.docker.internal:host-gateway` so the container can reach the host Ollama.

## 🔌 OpenAI-compatible Provider Configuration

Both the Node `backend/` and the Python `kanban_api/` can be configured to use OpenAI-compatible APIs.

- Backend (Node):
  - Select the provider via `LLM` env: `ollamaService` (default) or `openaiService`.
  - For Ollama (raw API):
    - `LLM=ollamaService`
    - `LLM_URL=http://host.docker.internal:11434/api/generate`
    - `MODEL_NAME=gemma3:1b`
  - For OpenAI-compatible (Chat Completions):
    - `LLM=openaiService`
    - `LLM_URL=https://api.openai.com/v1/chat/completions` (or a compatible gateway)
    - `OPENAI_API_KEY=...`
    - `MODEL_NAME=gpt-4o-mini` (or a compatible model on your provider)

- Kanban API (FastAPI):
  - Select the provider via `AI_PROVIDER=ollama|openai`.
  - For Ollama:
    - `AI_PROVIDER=ollama`
    - `OLLAMA_BASE_URL=http://host.docker.internal:11434`
    - `MODEL_NAME=gemma3:1b`
  - For OpenAI-compatible:
    - `AI_PROVIDER=openai`
    - `OPENAI_BASE_URL=https://api.openai.com/v1`
    - `OPENAI_API_KEY=...`
    - `MODEL_NAME=gpt-4o-mini` (or a compatible model on your provider)

## 📌 Kanban-Board (New Frontend — Under Development)

We are unifying the frontend into a single CRA app with routes `/kanban` and `/resume`, porting the exact Kanban styles.

Current status:

- Resume generation works via the classic Node backend.
- Kanban API is live with CRUD and AI endpoints.
- Frontend unification in progress.

