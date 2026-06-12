# Deployment Guide — Car Market V2 Hybrid Stack

This guide covers stable, production-safe deployment of the hybrid Vite + Next.js + Laravel stack.
No Docker or enterprise tooling is required. A standard VPS or shared hosting with Node.js and PHP is sufficient.

---

## Architecture Overview

```
Browser
  └── Vite Frontend (port 5173 in dev / served as static files in prod)
        ├── /api/v2/* → Next.js API Server (port 3000)  [V2 – Prisma + MySQL]
        └── /api/*    → Laravel Backend    (port 8000)  [V1 – Legacy]
```

Fallback is built into the frontend: if the Next.js server is unreachable, all pages automatically fall back to the Laravel API. **No data loss, no downtime.**

---

## Environment Variables

### Root-Level `.env` (required by Next.js / Prisma)
File: `c:\xampp\htdocs\car-market13\.env`

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@127.0.0.1:3306/automarket"
NODE_ENV="production"
```

> **Never commit `.env` to version control.** Add it to `.gitignore`.

### Laravel Backend `.env`
File: `c:\xampp\htdocs\car-market13\car-market-backend\.env`
Already configured. No changes needed unless credentials change.

---

## First-Time Production Setup

### 1. Install Node.js dependencies
```bash
cd c:\xampp\htdocs\car-market13
npm install --production
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```
This must be re-run any time `prisma/schema.prisma` is modified.

### 3. Build the Next.js API for production
```bash
npx next build
```
Expected output: `✓ Compiled successfully`. If errors appear, fix them before deploying.

### 4. Build the Vite frontend for production
```bash
cd car-market-frontend
npm run build
```
Output goes to `car-market-frontend/dist/`. Serve this folder with Nginx or Apache.

---

## Starting the System

### Development (all three services)
Open three separate terminals:

```bash
# Terminal 1 — Laravel (Legacy API)
cd car-market-backend
php artisan serve --port=8000

# Terminal 2 — Next.js V2 API
cd c:\xampp\htdocs\car-market13
npx next start -p 3000

# Terminal 3 — Vite Frontend
cd car-market-frontend
npm run dev
```

### Production (using PM2)
Install PM2 once: `npm install -g pm2`

```bash
# Start Next.js API with PM2 (auto-restart on crash)
pm2 start "npx next start -p 3000" --name "car-market-v2-api" --cwd "c:\xampp\htdocs\car-market13"

# Save PM2 config to auto-start on server reboot
pm2 save
pm2 startup
```

For Laravel in production, use your server's PHP-FPM + Nginx/Apache config (standard Laravel deployment).

---

## Health Check

Use this endpoint to verify the V2 API and database are live:

```bash
curl http://localhost:3000/api/health
```

**Expected healthy response:**
```json
{
  "status": "healthy",
  "uptime": 1234.56,
  "database": "connected",
  "timestamp": "2026-05-26T13:00:00.000Z"
}
```

**Unhealthy response (DB down):** HTTP `503` with `"status": "unhealthy"`.

Set up a cron job or uptime monitor (e.g. UptimeRobot — free) to ping this URL every 5 minutes.

---

## Database Backup & Restore

### Manual Backup (MySQL / XAMPP)

```bash
# Backup the full automarket database
mysqldump -u root -p automarket > automarket_backup_$(date +%Y%m%d).sql
```

Or on Windows (XAMPP):
```powershell
& "C:\xampp\mysql\bin\mysqldump.exe" -u root automarket > "automarket_backup_$(Get-Date -Format 'yyyyMMdd').sql"
```

### Restore from Backup

```bash
# Restore (WARNING: overwrites existing data)
mysql -u root -p automarket < automarket_backup_20260526.sql
```

Or on Windows:
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root automarket < "automarket_backup_20260526.sql"
```

### Automated Daily Backup (Windows Task Scheduler)
Create a `.ps1` script:
```powershell
# save as: C:\xampp\backup_db.ps1
$date = Get-Date -Format "yyyyMMdd_HHmm"
$dest = "C:\xampp\backups\automarket_$date.sql"
New-Item -ItemType Directory -Force -Path "C:\xampp\backups"
& "C:\xampp\mysql\bin\mysqldump.exe" -u root automarket > $dest
Write-Host "Backup saved to $dest"
```
Then schedule it via Task Scheduler to run daily.

---

## Safe Rollback Procedure

If the V2 system needs to be reverted completely:

1. **Stop the Next.js process:**
   ```bash
   pm2 stop car-market-v2-api
   ```
   Or simply close the terminal running `npx next start`.

2. **Revert frontend pages to legacy-only mode:**
   ```bash
   cd c:\xampp\htdocs\car-market13\car-market-frontend
   git restore src/pages/Home.jsx
   git restore src/pages/Cars.jsx
   git restore src/pages/CarDetails.jsx
   ```

3. The frontend will immediately switch back to calling the Laravel API exclusively. **No database changes are needed.**

> The `v2_*` tables remain intact. Re-enabling V2 is as simple as starting Next.js again.

---

## Verifying Prisma Schema Indexes

The following production-critical indexes are defined in `prisma/schema.prisma` and exist on the `v2_cars` table. Verify them with:

```sql
SHOW INDEX FROM v2_cars;
SHOW INDEX FROM v2_car_images;
```

**Expected indexes on `v2_cars`:**
- `price` — filter/sort by price range
- `year` — filter/sort by year
- `fuel_type` — filter by fuel type
- `brand_id` — join to brands
- `category_id` — join to categories
- `status` — filter active vs. archived
- `is_featured` — fast featured query
- `created_at` — default sort order

**Expected indexes on `v2_car_images`:**
- `(car_id, sort_order)` — gallery image ordering

---

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Reinstall dependencies (only if package.json changed)
npm install

# Regenerate Prisma (only if schema.prisma changed)
npx prisma generate

# Rebuild Next.js
npx next build

# Restart PM2 process gracefully (zero-downtime)
pm2 reload car-market-v2-api
```

---

## V2 API Error Code Reference

All V2 API errors return JSON — never HTML pages.

| HTTP Status | `code` field        | Meaning                              |
|-------------|---------------------|--------------------------------------|
| `400`       | `VALIDATION_ERROR`  | Invalid or out-of-range query params |
| `400`       | `INVALID_PARAM`     | Missing or malformed slug/ID         |
| `404`       | `NOT_FOUND`         | Car with that slug does not exist    |
| `500`       | `INTERNAL_ERROR`    | Unexpected server-side failure       |
| `503`       | `UNHEALTHY`         | Database unreachable (health check)  |
