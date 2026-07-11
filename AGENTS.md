# Agent Guide

## Package Manager

This project uses **pnpm**. Do not use `npm` or `yarn` for installing dependencies or running scripts.

- `pnpm install` — install dependencies
- `pnpm run <script>` — run any script from `package.json`

`package-lock.json` has been removed; `pnpm-lock.yaml` is the committed lockfile.

## Project Overview

This is a starter Express + TypeScript + Prisma REST API template. It ships with authentication, file upload, and uploaded-image management out of the box.

- **Runtime:** Node.js (>=22.12.0)
- **Framework:** Express 4
- **Language:** TypeScript 5
- **ORM:** Prisma 7 with PostgreSQL
- **Validation:** Zod
- **Auth:** JWT (access + refresh tokens)

## Folder Structure

```
src/
├── app.ts                    # Express application setup and middleware wiring
├── server.ts                 # Bootstrap: starts HTTP server and error handlers
├── routes.ts                 # Central router registry
├── config/
│   └── index.ts              # Environment configuration
├── constants/                # Constant values (pagination fields, etc.)
├── errors/                   # Error classes and Prisma/Zod error formatters
├── jobs/                     # Scheduled cron jobs (empty by default)
├── lib/                      # Third-party / infrastructure client wrappers
│   ├── prisma.ts
│   ├── redis.ts
│   └── logger.ts
├── middlewares/              # Express middleware
│   ├── auth.ts
│   ├── catch-async.ts
│   ├── global-error-handler.ts
│   ├── send-response.ts
│   ├── upload-image.ts
│   └── validate-request.ts
├── modules/                  # Domain feature modules
│   ├── auth/
│   ├── file-upload/
│   └── uploaded-image/
├── services/                 # Cross-module domain services
│   ├── email.service.ts
│   └── email.templates.ts
├── types/                    # Shared TypeScript types and declarations
│   ├── common.ts
│   ├── error.ts
│   ├── express.d.ts
│   └── pagination.ts
└── utils/                    # Pure, stateless helper functions
    ├── current-time.ts
    ├── generate-id.ts
    ├── generate-otp.ts
    ├── index.ts
    ├── jwt.ts
    ├── pagination.ts
    ├── password.ts
    └── pick.ts
```

## Architecture Rules

1. **Modules are self-contained.** Every feature lives under `src/modules/<feature>/` and contains:
   - `<feature>.route.ts` — Express router
   - `<feature>.controller.ts` — request/response handling
   - `<feature>.service.ts` — business logic + Prisma queries
   - `<feature>.validation.ts` — Zod schemas
   - `<feature>.types.ts` — module-specific TypeScript types
   - `<feature>.constant.ts` — module-specific constants (when needed)

2. **No barrel `index.ts` files inside modules.** Import module files directly.

3. **Routes live in one place.** `src/routes.ts` imports and mounts all module routers. `app.ts` only imports `./routes`.

4. **Use path aliases for cross-module imports.** All imports outside the current module should use `@/`:
   ```ts
   import prisma from '@/lib/prisma';
   import catchAsync from '@/middlewares/catch-async';
   import ApiError from '@/errors/ApiError';
   ```

5. **Relative imports are allowed only inside the same module.** For example, in `src/modules/auth/auth.service.ts`:
   ```ts
   import { AuthController } from './auth.controller'; // OK
   ```

6. **`lib/` holds infrastructure clients.** Prisma, Redis, and the logger live here. Modules should not import `@prisma/client` directly except for types; use `@/lib/prisma` for the client.

7. **`services/` holds cross-cutting domain logic.** Email sending lives here because it is reused across modules.

8. **`utils/` holds pure, stateless helpers.** They must not depend on infrastructure or request context.

9. **`middlewares/` holds Express-specific wrappers.** `catchAsync`, `sendResponse`, `validateRequest`, `auth`, `globalErrorHandler`, and file upload middleware live here.

10. **`types/` holds shared TypeScript types.** `express.d.ts` extends the Express `Request` interface with `req.user`.

## Conventions

### Naming

- Folders: `kebab-case` (e.g., `uploaded-image`, `file-upload`).
- Files: lowercase with dot separators (e.g., `auth.route.ts`, `auth.types.ts`, `email.service.ts`).
- Multi-word base names use kebab-case (e.g., `global-error-handler.ts`, `validate-request.ts`, `catch-async.ts`).
- Exports: use named exports for services and controllers; default exports only for middleware helpers where it improves ergonomics.

#### Type Aliases

- Use `type` aliases, not `interface` (enforced by ESLint).
- Name concrete types with PascalCase and **no prefix**: `LoginResponse`, `JwtPayload`, `PaginationOptions`.
- Do **not** use Hungarian `I`/`T` prefixes (e.g., avoid `ILoginResponse`, `TLoginResponse`). The `T` prefix is reserved for generic type parameters (`<T>`, `<K, V>`).
- Prefer descriptive names for input types: `LoginInput`, `GoogleLoginInput`, `AdminLoginInput`.

### Validation

- Zod schemas live in `<feature>.validation.ts`.
- Routes apply validation via `validateRequest(schema)`.
- Schemas should follow the shape `{ body, query, params, cookies }` when `validateRequest` needs to parse all of them.

### Authentication

- Use the `auth(...roles)` middleware to guard routes.
- Pass roles as string literals: `auth('ADMIN', 'SUPER_ADMIN', 'USER')`.
- The authenticated user is available as `req.user` (typed in `src/types/express.d.ts`).

### Error Handling

- Throw `ApiError` for expected failures.
- Unexpected errors are caught by `catchAsync` and handled by `globalErrorHandler`.
- Do not catch errors silently in controllers; let `catchAsync` forward them.

## Adding a New Module

1. Create `src/modules/<feature>/`.
2. Add the standard files: `route`, `controller`, `service`, `validation`, `types`, `constant` (if needed).
3. Use `@/` aliases for all cross-cutting imports.
4. Register the router in `src/routes.ts`:
   ```ts
   import { FeatureRoutes } from '@/modules/<feature>/<feature>.route';

   const moduleRoutes = [
     // ...existing routes
     { path: '/<feature>', route: FeatureRoutes },
   ];
   ```
5. Run `pnpm run build` and `pnpm run lint:check` before committing.

## Environment Configuration

Configuration is loaded from `.env` in `src/config/index.ts`. Required variables include:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `BCRYPT_SALT_ROUNDS`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- `EMAIL_USER`, `EMAIL_USER_PASS`
- `MAIN_ADMIN_EMAIL`
- `MEDIA_SERVER_URL`
- `REDIS_URL`

Add new environment variables to both `.env.example` and `src/config/index.ts`.

## Scripts

- `pnpm run dev` — run with hot reload via `tsx`
- `pnpm run build` — compile TypeScript to `dist/`
- `pnpm run start` — run compiled output
- `pnpm run lint:check` — run ESLint
- `pnpm run lint:fix` — fix ESLint issues
- `pnpm run prettier:check` — check formatting
- `pnpm run prettier:fix` — fix formatting
- `pnpm run lint-prettier` — run lint + formatting checks

## Notes for Agents

- Do not add barrel `index.ts` files inside modules.
- Keep `src/routes.ts` as the single route registry.
- Do not reintroduce Swagger/OpenAPI auto-generation without explicit approval.
- Security and performance middlewares (helmet, compression, rate limiting) are planned for a future phase; do not add them unless asked.
- `src/jobs/` is intentionally empty. Add scheduled jobs here when needed.
