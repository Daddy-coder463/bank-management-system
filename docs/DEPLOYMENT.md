# Hosting BankDB (free tier)

Architecture: one Render web service runs the Express API **and** serves the
built React app; the database is a free managed MySQL on Aiven.

> Why Aiven for the database? This project depends on real MySQL features —
> stored procedures, triggers, `SIGNAL` — which most "MySQL-compatible" free
> tiers (e.g. TiDB Serverless) do not support.

## 1. Database — Aiven free MySQL

1. Sign up at https://aiven.io (free plan, no card needed)
2. Create service → **MySQL** → **Free plan** → any region near you
3. When it's running, open the service page and copy from the Overview:
   - Host (e.g. `mysql-xxxx.aivencloud.com`)
   - Port (e.g. `12345`)
   - User (`avnadmin`), password, and database (`defaultdb`)
4. Load the schema and seed data from your machine:

```bash
cd server
DB_HOST=<host> DB_PORT=<port> DB_USER=avnadmin DB_PASSWORD=<password> \
DB_NAME=bank_db DB_SSL=true npm run db:setup
DB_HOST=<host> DB_PORT=<port> DB_USER=avnadmin DB_PASSWORD=<password> \
DB_NAME=bank_db DB_SSL=true npm run db:seed
```

## 2. Web service — Render

1. Sign up at https://render.com with your GitHub account
2. New → **Blueprint** → select the `bank-management-system` repo
   (Render reads `render.yaml` automatically), or New → **Web Service**
   with these settings:
   - Build command: `cd client && npm install --include=dev && npm run build && cd ../server && npm install`
   - Start command: `cd server && npm start`
   - Health check path: `/api/health`
3. Set the environment variables when prompted:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DB_SSL` | `true` |
| `DB_HOST` | your Aiven host |
| `DB_PORT` | your Aiven port |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | your Aiven password |
| `DB_NAME` | `bank_db` |
| `JWT_SECRET` | any long random string |

4. Deploy. The app will be live at `https://<service-name>.onrender.com`
   (log in with the seeded admin@bank.com / admin123).

Notes:
- Render's free tier sleeps after ~15 min idle; the first request after a
  sleep takes ~30-60s to wake. Fine for a demo link.
- Aiven's free MySQL pauses after long inactivity too — open the Aiven
  console to resume it if needed.
