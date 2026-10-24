# Ahad Animates AI Assistant

This is a separate FastAPI service for the public website assistant. It reads
published portfolio data from Spring Boot's `GET /api/public/projects`
endpoint; it never calls administrator endpoints or reads drafts. Verified
service, founder, location, and navigation answers are handled locally.
Gemini-generated answers are used only when the Python service has both
`GEMINI_API_KEY` and `GEMINI_MODEL` configured.

The public assistant's verified context also includes curated studio facts
from the supplied `Ahad Animates - Complete Data Collection` PDF, such as the
founder's story, studio vision and values, creative workflow, and educational
topics. A few common questions use this verified information locally, so they
remain answerable without Gemini credentials. The PDF is a snapshot with an
unclear July year; current website content and the live published-project
catalog take precedence. Social-media counts from the PDF are excluded because
the extracted figures are unreliable and may be stale.

The Gemini key belongs only in this service's local environment. It is not a
Next.js `NEXT_PUBLIC_` variable and must never be added to browser code.

## Local setup (PowerShell)

From the project root, start the existing backend and frontend in separate
terminals:

```powershell
Set-Location 'C:\Users\Ahmed CM\Desktop\ahad-animates\backend'
mvn spring-boot:run
```

```powershell
Set-Location 'C:\Users\Ahmed CM\Desktop\ahad-animates'
npm run dev
```

Then create and run the Python service in another terminal:

```powershell
Set-Location 'C:\Users\Ahmed CM\Desktop\ahad-animates\ai-assistant'
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Set `GEMINI_API_KEY` to a key you provide and select a supported model through
`GEMINI_MODEL` in `ai-assistant\.env` to enable provider-generated answers.
Without credentials, the service still answers verified FAQs and performs
published-project search and recommendations; other questions return an
explicit configuration error instead of a fabricated answer.

The frontend assistant URL is configured by
`NEXT_PUBLIC_AI_ASSISTANT_URL` in the project root `.env.local`; it defaults to
`http://localhost:8000`. Restart Next.js after changing this variable. The
Python service loads its own `ai-assistant\.env` and allows only the origin(s)
listed in `FRONTEND_ORIGINS` (default `http://localhost:3000`). For a
production configuration, set the exact trusted browser origins explicitly;
do not use `*`.

The service exposes `GET /health` and `POST /api/chat`. The health response
reports readiness/configuration booleans only. Chat requests are limited to
2,000 characters, 10 history messages, and 12,000 history characters. The
in-memory per-IP rate limit defaults to 30 requests per minute and is intended
for a single local service process.

## Production container deployment

The `Dockerfile` packages only the FastAPI application and its curated knowledge
module, runs as a non-root user, binds to the hosting platform's `PORT` (default
`8000`), and checks `GET /health`. Build with `ai-assistant/` as the Docker
build context; do not copy a local `.env` into the image or build context.

Configure these variables in the backend host's secure environment settings:

| Variable | Production value / purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required server-side Gemini credential. Never expose it to the browser or include it in the image. |
| `GEMINI_MODEL` | Supported Gemini model identifier. |
| `FRONTEND_ORIGINS` | Exact trusted browser origin, currently `https://ahadanimates.com`; use comma-separated origins only if additional production sites are explicitly required. |
| `PORTFOLIO_API_URL` | Public, network-reachable Spring Boot published-project endpoint. Do not use localhost unless both services share the same host network. |
| `RATE_LIMIT_PER_MINUTE` | Optional; defaults to `30`. |
| `PORT` | Supplied by the hosting platform; defaults to `8000` when running locally in the container. |

The frontend must be built with `NEXT_PUBLIC_AI_ASSISTANT_URL` set to the
deployed assistant's HTTPS base URL (no `/api/chat` suffix). This is a public
URL, not a credential. Rebuild and redeploy the frontend after changing it.
Keep local development settings in `.env.local`; do not replace them with
production values.

No production host is assumed by this project. Before deployment, select or
identify the existing backend hosting service, configure its environment
variables, and verify that it can reach the public portfolio API. Do not create
a second hosting project or change website DNS as part of packaging.

## Tests

```powershell
Set-Location 'C:\Users\Ahmed CM\Desktop\ahad-animates\ai-assistant'
python -m pip install -r requirements.txt
python -m pytest
```

All provider tests mock Gemini calls. Running tests does not make paid API
requests.
