# Ahad Animates

Ahad Animates is a Next.js portfolio site backed by a Spring Boot API and PostgreSQL database.

## Run locally

Configure PostgreSQL and the administrator credentials using the environment variables in `backend/.env.example`. Run the backend and frontend in separate terminals:

Backend:

```powershell
cd backend
mvn spring-boot:run
```

Frontend:

```powershell
npm run dev
```

## Phase 2: Portfolio management

The administrator portfolio editor is available at `/admin/projects` after signing in. Projects can be filtered, drafted, published, edited, and deleted. Set a thumbnail with an HTTPS URL, an existing local `/images/` path, or an uploaded image from the Media Library.

The backend exposes these endpoints:

- Public: `GET /api/public/projects` and `GET /api/public/projects/{slug}` return published projects only.
- Administrator: `GET /api/admin/projects`, `GET /api/admin/projects/{id}`, `POST /api/admin/projects`, `PUT /api/admin/projects/{id}`, `PATCH /api/admin/projects/{id}/status`, and `DELETE /api/admin/projects/{id}` require `ROLE_ADMIN`.

When the projects table is empty, the backend initializes the original five public portfolio entries. Separate one-time seed markers add verified portfolio entries only when their slugs are missing, including the 3D Products Visualization, Premium Fragrance CGI, and Cinematic Perfume Visualization projects. Existing project records are not replaced or deleted. Project descriptions and video links are not guessed; descriptions are optional.

## Daily work management

Administrators can manage dated studio-work entries at `/admin/daily-work`. Entries support drafts, publishing, editing, removal, date/category/status filters, and paginated administration. Published entries appear on the homepage journal and in the searchable `/daily-work` archive. Public archive requests are paginated and only include published records.

- Public: `GET /api/public/daily-work` accepts `category`, inclusive `fromDate`/`toDate` (`YYYY-MM-DD`), `page`, and `size` query parameters.
- Administrator (`ROLE_ADMIN` required): `GET /api/admin/daily-work` supports the same filters plus `status`; `GET /api/admin/daily-work/{id}`, `POST /api/admin/daily-work`, `PUT /api/admin/daily-work/{id}`, `PATCH /api/admin/daily-work/{id}/status`, and `DELETE /api/admin/daily-work/{id}` manage entries.
- Daily-work persistence follows the existing JPA schema convention (`spring.jpa.hibernate.ddl-auto: update`): the `daily_work_entries` table and indexes are created additively at backend startup. This project does not currently configure Flyway or Liquibase. No daily-work records are seeded.
- Thumbnail references accept HTTPS URLs or existing `/images/` paths. Video playback only renders recognized HTTPS YouTube/Vimeo links or HTTPS direct video files.

Run backend tests with `cd backend; mvn test`. Run frontend checks with `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

## Contact email delivery

The contact form sends inquiries server-to-server through Resend. It requires
`RESEND_API_KEY` and `CONTACT_EMAIL_FROM`; configure these only in the Next.js
server environment (for local development, `.env.local`) and never expose them
with a `NEXT_PUBLIC_` prefix. Create a Resend account, verify the sending
domain, and set `CONTACT_EMAIL_FROM` to an address on that verified domain.
`CONTACT_EMAIL_TO` is optional and defaults to the public contact address
`ahadanimates@gmail.com`. Do not set a receiving address unless it is an inbox
you control.

The form reports success only when Resend confirms it accepted the message for
delivery. Provider acceptance does not prove delivery to the recipient's inbox.
Without the required environment variables, the endpoint returns a
configuration error and the form directs visitors to the public email address.
The route applies a honeypot and in-memory per-client rate limit; because that
limit is local to a server process, multi-instance deployments should also use
a shared rate limiter or provider/edge protection. Validation, spam protection,
and provider response handling tests run with `npm run test:contact`.

## AI assistant

The public site includes an assistant backed by the separate FastAPI service in
`ai-assistant/`. It answers verified studio FAQs and searches/recommends only
published projects from `GET /api/public/projects`. Provider-generated answers
require `GEMINI_API_KEY` and `GEMINI_MODEL` in `ai-assistant/.env`; these
credentials are server-only. Without a key, local FAQs and project matching
remain available and other questions receive an explicit configuration error.

See [the assistant setup guide](./ai-assistant/README.md) for the exact
PowerShell commands to run the Spring Boot backend, Next.js frontend, and
assistant service together. The frontend URL is configured with
`NEXT_PUBLIC_AI_ASSISTANT_URL` (default `http://localhost:8000`); Python CORS
origins are configured with `FRONTEND_ORIGINS`.

## CMS and persistent media storage

Administrators with `ROLE_ADMIN` can manage tutorials, Ads & Videos, and blog
posts from `/admin`. The administrator media library is `/admin/media`.
Public CMS endpoints return published content only. The protected
`GET /api/admin/media` endpoint lists the 100 most recent uploaded assets;
`POST /api/admin/media` uploads new assets, and
`DELETE /api/admin/media/{id}` deletes an unused asset. All three admin
endpoints require `ROLE_ADMIN`. Media binaries are stored on the backend
filesystem; PostgreSQL stores metadata and a relative storage key.
`GET /api/public/media/{id}` serves local assets only when referenced by a
published project or CMS item. Unpublished content and unreferenced uploads
remain private, but administrators can preview them while authenticated.
The new `cms_content` and `media_assets` tables follow the backend's existing
additive Hibernate `ddl-auto: update` convention; no database reset is needed.

Set `MEDIA_STORAGE_DIRECTORY` in the backend environment to the persistent
directory where uploads should live. It defaults to `./data/media`, relative
to the backend working directory. For production, point it to a mounted
persistent volume (for example, an absolute path such as
`/var/lib/ahad-animates/media`), ensure the backend service account can read
and write there, and include the volume in backups. Do not put this directory
under a temporary/cache folder or expose it as a static web root.

Uploads accept JPG, PNG, WebP images up to 15 MB and MP4/M4V or WebM videos up
to 250 MB. Image signatures, MIME type, dimensions, and size are validated.
Opaque photos are resized proportionally to a maximum 1920-pixel edge and
encoded as WebP at 83% quality. Transparent PNGs remain PNG, and video files
are stored unchanged. Optimized image dimensions and stored file size are
recorded with the media metadata.
Legacy media rows and URLs are retained; their old external files are not
copied or modified by this local-storage change.
