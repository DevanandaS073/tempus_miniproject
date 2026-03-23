# Supabase Setup Guide (Production)

This guide is for deploying Tempus with **Supabase PostgreSQL** on production servers like EC2.

## Quick Start

### 1. Supabase Project Setup
```bash
# Go to https://supabase.com and create a new PostgreSQL project
# Wait 2-3 minutes for initialization
```

### 2. Get Connection String
- Navigate to **Settings > Database > Connection Pooling**
- Copy the **Session Pooler** URI (looks like):
  ```
  postgresql://postgres.abcd1234:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
  ```

### 3. Configure Backend
In `app/backend/.env`:
```env
DATABASE_URL="postgresql://postgres.abcd1234:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
PORT=3000
JWT_SECRET="your-secret-key-min-32-chars"
TEST_LOGIN_EMAIL="admin@company.com"
TEST_LOGIN_PASSWORD="password123"
```

### 4. Deploy Schema
```bash
cd app/backend
npm install
npx prisma migrate deploy
npm run dev
```

### 5. Verify
```bash
# Test authentication
npm run test:auth

# Full test suite
npm run test:all:auto
```

## Production Best Practices

1. **Rotate credentials**: After initial setup, change Supabase password in project settings
2. **Use environment secrets**: Never commit `.env` to git (already in `.gitignore`)
3. **Monitor connections**: Use Supabase **Monitoring > Connections** tab
4. **Backup**: Set up Supabase automated backups in project settings
5. **Update regularly**: Keep Prisma and dependencies current

## Troubleshooting

**"Can't reach database server"**
- Ensure using **Session Pooler** URI, not direct connection
- Check firewall allows outbound HTTPS (port 443)
- Verify project is "Ready" in Supabase dashboard

**"Invalid password"**
- Copy exact password from Supabase settings
- Ensure special characters are URL-encoded in URI

**Schema errors**
- Run: `npx prisma migrate status`
- Then: `npx prisma migrate deploy`

## Local Testing Before Production

Test locally using the same Supabase URI before EC2 deployment:
```bash
cd app/backend
$env:DATABASE_URL="<your-supabase-uri>"
npm run test:all:auto
```

Once all tests pass locally, deploy to EC2 with confidence.
