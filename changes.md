# Changes Log

## 2026-02-13

### Feature: Edit Profile supports username + avatar updates

Implemented end-to-end support so the frontend "Edit Profile" flow can update both `username` and `avatar`.

### Backend changes

- `srcs/backend/src/controllers/user.controller.ts`
  - `PUT /api/users/me` now accepts `username` in request body.
  - Username is trimmed and validated (rejects empty string).
  - Duplicate username errors are returned as HTTP `409` with `Username already exists`.

- `srcs/backend/src/services/user.service.ts`
  - `updateProfile` signature expanded to accept `username?: string`.
  - Added uniqueness check before updating username.

- `srcs/backend/tests/user.test.ts`
  - Added test: successful username update.
  - Added test: duplicate username update fails with `409`.

### Frontend changes

- `srcs/frontend/src/providers/user.provider.ts`
  - Added `updateCurrentUserAtom`.
  - Calls `userService.updateMe(...)`.
  - Updates both `currentUserAtom` and `userFamilyProvider` cache.

- `srcs/frontend/src/providers/index.ts`
  - Exported `updateCurrentUserAtom`.

- `srcs/frontend/src/pages/profile/me/ProfilePage.tsx`
  - Replaced static "Edit Profile" button flow with editable mode.
  - Added username input in edit mode.
  - Added `AvatarSelector` in edit mode.
  - Added Save/Cancel actions with loading and error handling.
  - Only changed fields are submitted.

### Verification run

- Backend type check: `npx tsc --noEmit` (passed).
- Frontend type checks:
  - `npx tsc --noEmit -p tsconfig.app.json` (passed)
  - `npx tsc --noEmit -p tsconfig.node.json` (passed)
- Backend Jest test run was blocked in this environment by missing runtime library:
  - `libc.musl-x86_64.so.1: cannot open shared object file` (from `bcrypt`).
- Full frontend `npm run build` could not be completed after escalation request was rejected; no-emit TypeScript checks were used instead.
