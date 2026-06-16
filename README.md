# Resume AI

Resume AI is a local-first resume workspace that helps you:

- track job applications in a Kanban board
- generate and edit resumes for specific roles
- save multiple resume versions to an application card
- export the latest version as PDF or DOCX

The stack runs entirely in Docker Compose and supports three AI provider modes: local Ollama, Ollama Cloud, or any OpenAI-compatible endpoint.

## Quick Start

### Requirements

- Docker and Docker Compose
- An AI provider (see [AI Provider Setup](#ai-provider-setup) below)

### 1. Configure your environment

Copy `.env.example` to `.env` and fill in your provider details:

```bash
cp .env.example .env
```

Choose one profile in `.env`:

| Profile | When to use |
|---------|------------|
| `ollama_cloud` | Dev-friendly — no local model download, uses Ollama Cloud API |
| `ollama` | Full privacy — runs models locally via `ollama serve` |
| `openai` | Any OpenAI-compatible endpoint |

### 2. Start the stack

```bash
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:8080` |
| Node backend | `http://localhost:5001` |
| Kanban API | `http://localhost:8000` |
| MLflow UI | `http://localhost:5002` |

Check the Kanban API health:

```bash
curl -s http://localhost:8000/health
```

## Typical Workflow

1. Open the frontend at `http://localhost:8080`.
2. Create or select an application card in the Kanban board.
3. Open the **Details → Resume** tab.
4. Paste the job description and optional profile notes.
5. Generate a draft, edit it, save it to the card, then export it.

## Core Features

- Kanban board for job application tracking (CRUD, move cards, inline edit)
- AI-assisted board summaries, application tags, and next-step suggestions
- Resume generation with ATS hidden-content warnings
- Resume version history linked to application cards
- PDF and DOCX export through Pandoc

## AI Provider Setup

### Option A — Ollama Cloud (recommended for development)

No local model download or GPU/RAM budget needed.

1. Create an API key at `https://ollama.com/settings/keys`.
2. In your `.env`:

```env
AI_PROVIDER=ollama_cloud
OLLAMA_API_KEY=your-key-here
MODEL_NAME=gemma3:4b
```

Model tags are listed at `https://ollama.com/library`.

### Option B — Local Ollama (full privacy)

1. Install Ollama and start it:

```bash
ollama serve
ollama pull gemma3:1b
```

2. In your `.env`:

```env
AI_PROVIDER=ollama
MODEL_NAME=gemma3:1b
```

Verify Ollama is reachable from the host:

```bash
curl -s http://localhost:11434/api/tags
```

### Option C — OpenAI-compatible endpoint

```env
AI_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-key-here
MODEL_NAME=gpt-4o-mini
```

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

## Environment Variables

All variables are set in `.env` at the project root. Docker Compose reads it automatically.

### `kanban_api/`

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `ollama` | `ollama` \| `ollama_cloud` \| `openai` |
| `MODEL_NAME` | `gemma3:1b` | Model tag for the selected provider |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Local Ollama URL (provider: `ollama`) |
| `OLLAMA_API_KEY` | — | Ollama Cloud API key (provider: `ollama_cloud`) |
| `OLLAMA_CLOUD_BASE_URL` | `https://ollama.com/v1` | Ollama Cloud base URL |
| `OPENAI_BASE_URL` | — | OpenAI-compatible base URL (provider: `openai`) |
| `OPENAI_API_KEY` | — | API key for OpenAI-compatible provider |
| `DATABASE_URL` | postgres://appuser:apppass@postgres:5432/app_db | PostgreSQL connection string |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed frontend origin |

### `backend/` (Node.js, classic resume generation)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Server port |
| `LLM_URL` | `http://host.docker.internal:11434/api/generate` | LLM endpoint |
| `MODEL_NAME` | `gemma3:1b` | Model name |
| `OPENAI_API_KEY` | — | API key for OpenAI-compatible provider |

## Prompts

AI prompts live in `kanban_api/app/prompts/` as Markdown files. Edit them directly to adjust tone, format, or instructions without touching Python code.

| File | Used by |
|------|---------|
| `summarize_board.md` | `POST /ai/summarize-board` |
| `generate_resume.md` | `POST /ai/generate-resume` |
| `tag_application.md` | `POST /ai/tag-application` |
| `next_steps.md` | `POST /ai/next-steps` |

## Output Directory

Generated resumes and related files are saved in the local `./output` directory, which is mounted into the backend container. Pandoc is installed in the `kanban_api` container for PDF and DOCX export.
