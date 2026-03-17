# GP-PriceWise

Graduation Project - PriceWise (Smart Pricing Platform)

## Forgot Password Setup

### Frontend `.env`
Use `frontend/.env.example` as a template:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_FRONTEND_URL` (for reset redirect, e.g. `http://localhost:3000`)

`ForgotPassword` sends users to:
`<REACT_APP_FRONTEND_URL>/reset-password`

### Backend `.env`
Use `backend/.env.example` as a template:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for Admin API link generation)
- `FRONTEND_URL` (fallback redirect target)

Security warning: never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or public repos.

## Auth Password Reset Endpoints

- `POST /api/auth/forgot-password`
  - Body: `{ "email": "user@example.com", "redirectTo": "http://localhost:3000/reset-password" }`
  - Uses Admin API link generation if `SUPABASE_SERVICE_ROLE_KEY` exists, otherwise Supabase hosted reset email.

- `POST /api/auth/reset-password`
  - Informational endpoint.
  - Actual password update is done on frontend `/reset-password` route via recovery session and:
    `supabase.auth.updateUser({ password: newPassword })`
