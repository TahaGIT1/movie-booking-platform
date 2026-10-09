# CineVerse Super Admin portal

The React portal lives in `frontend/`; the Express API lives in `backend/`.

## Start the API

Configure `backend/.env` from `backend/.env.example`, apply the Prisma schema to the database, then run:

```powershell
cd backend
npm install
npm run dev
```

The API listens on port 5000 by default.

## Create the first Super Admin

Run this once after the database is ready. Supply the values as environment variables through your normal secret manager or secure shell session; do not commit them:

```powershell
cd backend
$env:SUPER_ADMIN_NAME = "Platform Administrator"
$env:SUPER_ADMIN_EMAIL = "admin@example.com"
$env:SUPER_ADMIN_PASSWORD = "use-a-unique-password-of-at-least-12-characters"
npm run admin:create-super-admin
Remove-Item Env:SUPER_ADMIN_NAME, Env:SUPER_ADMIN_EMAIL, Env:SUPER_ADMIN_PASSWORD
```

The command will not convert an existing non-admin account into a Super Admin. The portal login uses the account’s email and password.

## Start the portal

```powershell
cd frontend
npm install
npm run dev
```

The portal expects the API at `http://localhost:5000/api/v1`. Set `VITE_API_URL` before starting Vite if the API uses another URL. Set `CORS_ORIGIN` in `backend/.env` to the portal origin (or a comma-separated list of origins) when deploying; the API and Socket.IO gateway use the same allowlist.

The portal includes platform overview metrics, paginated people search, account creation and role/theatre assignment, block/unblock controls, theatre review and suspension controls, and an audit activity viewer. Sensitive admin mutations are recorded in `audit_logs`.
