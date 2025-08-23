# Changelog

## 2025-08-23

### Backend and Infra
- Added new FastAPI service under `kanban_api/` with SQLAlchemy and Pydantic.
  - `kanban_api/app/main.py`: CORS, startup DB retry, dev seed (Default Board with To Do/Doing/Done), and router includes.
  - `kanban_api/app/models.py`: ORM models `Board`, `Column`, `Application`, `Resume`. Resolved naming collision by aliasing SQLAlchemy `Column` to `SAColumn`.
  - `kanban_api/app/schemas.py`: Pydantic models for serialization/validation.
  - `kanban_api/app/routes_kanban.py`: CRUD endpoints for boards, columns, and applications.
  - `kanban_api/app/routes_resumes.py`: Create/list resumes and link to `application_id`.
  - `kanban_api/app/routes_ai.py`: AI endpoints using LangChain `ChatOllama` (model `gemma3`):
    - `POST /ai/summarize-board`
    - `POST /ai/tag-application`
    - `POST /ai/next-steps`
  - `kanban_api/app/config.py`, `kanban_api/app/db.py`: settings and DB session.
  - `kanban_api/Dockerfile`: production-ready Uvicorn container.
- Docker Compose updates in `docker-compose.yaml`:
  - Services: `postgres`, `mlflow`, `kanban_api`, `backend` (Node), `frontend` (CRA).
  - Postgres healthcheck and `POSTGRES_DB=app_db`. `kanban_api` waits for Postgres health.
  - MLflow switched to local image built from `docker/mlflow/Dockerfile` with `psycopg2-binary`, exposed on host `5002`.
- Postgres init script at `docker/postgres/init.sql`: creates `appuser`, databases `app_db` and `mlflow`.

### Kanban UI and Resume Integration
- Frontend `KanbanPage` moved header outside grid and added `.kanban__page-header` styles for parity with original board.
- Modal UX improved: wider modal, internal scrolling, better resume editor grid.
- Markdown preview uses `react-markdown` with improved typography and spacing.
- Fixed code-fence issue by stripping leading/trailing ``` from AI output to avoid code-block previews.
- Added Save-to-Card workflow:
  - `POST /resumes` persists markdown linked to `application_id`.
  - Save action shows success notice and counts saved versions per card.
- Added Export via Pandoc:
  - `GET /resumes/{resume_id}/export?format=pdf|docx`
  - `GET /resumes/applications/{application_id}/export?format=pdf|docx` (latest resume)
  - Frontend buttons “Export PDF/DOCX” in Resume tab, downloading blobs.

### Developer Notes
- Frontend env: `REACT_APP_API_BASE` should point to `http://localhost:8000` when running via docker-compose.
- If styles seem off, hard refresh (Cmd+Shift+R) to invalidate cached CSS.

### How to run
1. Stop previous stack (if any):
   ```bash
   docker compose down
   ```
2. Start services:
   ```bash
   docker compose up -d --build
   ```
3. Verify:
   - Kanban API health: http://localhost:8000/health
   - Boards list: http://localhost:8000/kanban/boards
   - Columns of board 1: http://localhost:8000/kanban/boards/1/columns
   - MLflow UI: http://localhost:5002
4. Example AI requests:
   ```bash
   curl -s -X POST http://localhost:8000/ai/summarize-board \
     -H 'Content-Type: application/json' -d '{"board_id":1}'

   curl -s -X POST http://localhost:8000/ai/tag-application \
     -H 'Content-Type: application/json' -d '{"application_id":1, "max_tags":5}'

   curl -s -X POST http://localhost:8000/ai/next-steps \
     -H 'Content-Type: application/json' -d '{"application_id":1}'
   ```

### Notes
- Default model: `gemma3` via `OLLAMA_BASE_URL`.
- Dev seed creates a "Default Board" with three columns on first run.
- Next steps: unify frontend (single CRA) with routes `/kanban` and `/resume`, port original Kanban styles, add DnD and CRUD wiring, wire resume generation to persist in Postgres.
