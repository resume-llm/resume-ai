# Resume AI

Resume AI is a local-first resume workspace that helps you:

- track job applications in a Kanban board
- generate and edit resumes for specific roles
- save multiple resume versions to an application card
- export the latest version as PDF or DOCX

The stack runs locally with Docker Compose and can use either Ollama or an OpenAI-compatible provider.

## Quick Start

### Requirements

- Docker
- Docker Compose
- Optional: Ollama, if you want local AI generation

### Start the Stack

```bash
docker compose up -d --build
```

Once the services are running:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:8080` |
| Node backend | `http://localhost:5001` |
| Kanban API | `http://localhost:8000` |
| MLflow UI | `http://localhost:5002` |

Check the Kanban API health:

```bash
curl -s http://localhost:8000/health
```

## Typical Workflow

1. Open the frontend.
2. Create or select an application card.
3. Open the `Details -> Resume` tab.
4. Paste the job description and optional profile notes.
5. Generate a draft, edit it, save it to the card, then export it.

## Core Features

- Resume generation through the classic Node backend
- Kanban application tracking through the FastAPI service
- AI-assisted board summaries, application tags, and next-step suggestions
- Resume version history linked to application cards
- PDF and DOCX export through Pandoc

## Kanban and Resume API

Basic Kanban endpoints:

```bash
curl -s http://localhost:8000/kanban/boards
curl -s http://localhost:8000/kanban/boards/1/columns
curl -s http://localhost:8000/kanban/boards/1/applications
```

Create a resume linked to an application card:

```bash
curl -s -X POST http://localhost:8000/resumes \
  -H 'Content-Type: application/json' \
  -d '{
        "application_id": 1,
        "job_description": "...",
        "input_profile": "...",
        "markdown": "# My Resume..."
      }'
```

List saved resumes for a card:

```bash
curl -s http://localhost:8000/resumes/applications/1
```

Export the latest saved resume:

```bash
curl -L -o resume.pdf  "http://localhost:8000/resumes/applications/1/export?format=pdf"
curl -L -o resume.docx "http://localhost:8000/resumes/applications/1/export?format=docx"
```

## AI Provider Setup

### Ollama on the Local Host

Start Ollama:

```bash
ollama serve
```

Pull the default model tag used by this repo:

```bash
ollama pull gemma3:1b
```

Verify that Ollama is reachable:

```bash
curl -s http://localhost:11434/api/tags
```

The default Docker configuration expects:

```env
AI_PROVIDER=ollama
MODEL_NAME=gemma3:1b
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

`kanban_api` includes `extra_hosts: host.docker.internal:host-gateway` so the container can reach the host Ollama instance.

### OpenAI-Compatible Provider

The Node backend can use an OpenAI-compatible Chat Completions endpoint:

```env
LLM=openaiService
LLM_URL=https://api.openai.com/v1/chat/completions
OPENAI_API_KEY=...
MODEL_NAME=gpt-4o-mini
```

The Kanban API can be configured separately:

```env
AI_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=...
MODEL_NAME=gpt-4o-mini
```

## Environment Variables

### `backend/`

- `PORT`: port to listen on, default `5001`
- `CORS_ORIGIN`: allowed origin for frontend requests
- `LLM`: `ollamaService` or `openaiService`
- `LLM_URL`: URL for the selected LLM provider
- `MODEL_NAME`: model name
- `OPENAI_API_KEY`: API key when using an OpenAI-compatible provider

### `kanban_api/`

- `DATABASE_URL`: `postgresql+psycopg2://appuser:apppass@postgres:5432/app_db`
- `CORS_ORIGIN`: `http://localhost:8080`
- `AI_PROVIDER`: `ollama` or `openai`
- `MODEL_NAME`: default `gemma3:1b`
- `OLLAMA_BASE_URL`: `http://host.docker.internal:11434`
- `OPENAI_BASE_URL`: OpenAI-compatible base URL such as `https://api.openai.com/v1`
- `OPENAI_API_KEY`: API key when using an OpenAI-compatible provider

## Output Directory

Generated resumes and related files are saved in the local `./output` directory, which is mounted into the backend container.

Pandoc is installed in the `kanban_api` container for PDF and DOCX export.

## Project Status

The frontend is being unified into a single CRA app with `/kanban` and `/resume` routes.

- Resume generation works through the classic Node backend.
- The Kanban API is live with CRUD and AI endpoints.
- Frontend unification is still in progress.
