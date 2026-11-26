# Kandi + Pekora unified deployment

## Architecture

- The Kandi static frontend lives in /frontend in this repository.
- The ASP.NET Core Pekora website serves frontend/index.html at / and the other frontend files from the same origin.
- Requests under /apisite/ are handled by Pekora MVC controllers.
- Requests under /auth/ continue to use Pekora Razor Pages. This intentionally preserves the existing application/approval flow, CAPTCHA checks, password validation, rate limits, 2FA, anti-forgery validation and session-cookie creation.
- Pekora's .PEKOSECURITY session cookie remains HttpOnly and same-site. Kandi uses same-origin requests with cookie credentials; it does not store passwords or issue its own session token.
- Pekora's CSRF middleware remains enabled. Kandi's transport reads the x-csrf-token response header after the backend's 403 challenge and retries the write once.

## Docker

The root Dockerfile copies frontend/ into the runtime image. The directory is no longer excluded by .dockerignore. No separate Node frontend server or FRONTEND_PROXY_BASE_URL is required for the Kandi site.

FRONTEND_PROXY_BASE_URL remains an optional compatibility setting for deployments that intentionally keep an older external frontend. If it is unset, unmatched requests continue through ASP.NET routing instead of attempting localhost:3000.

## Connected now

- Static Kandi site is served by the same ASP.NET application.
- Kandi's current-user lookup calls the verified Pekora endpoint GET /apisite/users/v1/users/authenticated and adapts its id/name/displayName/isStaff response.
- The Kandi landing page sends login and account applications to Pekora's existing /auth/accountlogin and /auth/application pages. The frontend does not bypass the backend's signup and approval rules.
- The API base is same-origin /apisite; the CSRF header name is verified against CsrfMiddleware.cs.

## Not yet connected

The other Kandi API modules still contain unconnected method definitions. They must be mapped one by one to real Pekora controller routes and response shapes before those features can be considered operational. Do not enable demo/stub mode in production and do not simulate balances, purchases, trades, inventory, or moderation actions.

The original Pekora auth API controller does not expose JSON login/signup endpoints. Login, signup and applications therefore remain on the existing Razor flow until a carefully reviewed server-side bridge can reuse the exact same validation and security services.

## Deployment requirements

A production deployment still needs real environment values for PostgreSQL, Redis, base URL, JWT session signing key, CAPTCHA, Discord integration (if enabled), storage directories, and any game/RCC/asset-validation services required by the chosen feature set. Put secrets in the VPS environment or secret manager, never in Git. Use HTTPS and persistent volumes for storage/database data.

## Verification status

This branch has not yet been built or run against a configured database/Redis/VPS. Docker compilation, health checks, session round-trip, CSRF retry, and each connected feature must pass before merging to main or calling the deployment production-ready.