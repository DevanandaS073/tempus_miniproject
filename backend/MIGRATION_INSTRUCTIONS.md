# Role Field Migration Instructions

## What Was Changed

The `schema.prisma` file has been updated:

### Before:
```prisma
enum Role {
  admin
  manager
  user
}

model users {
  ...
  role Role @default(user)
  ...
}
```

### After:
```prisma
enum Role {
  ADMIN
  WORKER
}

model users {
  ...
  role Role @default(WORKER)
  ...
}
```

## Migration Steps

### 1. Ensure PostgreSQL is Running
Make sure your PostgreSQL database is running and accessible at:
```
postgresql://postgres:password@localhost:5432/tempus_miniproject
```

You can test the connection with:
```bash
psql -h localhost -U postgres -d tempus_miniproject
```

### 2. Run the Migration
Navigate to the backend directory and run:
```bash
cd backend
npx prisma migrate dev --name add_role
```

This will:
- Create a new migration file in `prisma/migrations/`
- Update the database schema to use the new enum values
- Migrate existing data (existing `admin`, `manager`, `user` values will need to be mapped)

> **Important**: The migration will fail if there are existing users with roles that don't map to `ADMIN` or `WORKER`. You may need to manually update existing user roles in the database before running the migration.

### 3. Regenerate Prisma Client
After the migration succeeds, regenerate the Prisma Client:
```bash
npx prisma generate
```

## Troubleshooting

### If Migration Fails Due to Existing Data
If you have existing users with `admin`, `manager`, or `user` roles, you'll need to decide how to map them:

**Option 1: Map in SQL before migration**
```sql
-- Connect to your database
psql -h localhost -U postgres -d tempus_miniproject

-- Update existing roles
UPDATE users SET role = 'ADMIN' WHERE role IN ('admin', 'manager');
UPDATE users SET role = 'WORKER' WHERE role = 'user';
```

**Option 2: Drop and recreate (ONLY for development)**
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_role
npx prisma generate
```

⚠️ **Warning**: `migrate reset` will delete all data in your database!

## Verification

After running the migration, verify the changes:
```bash
npx prisma studio
```

This will open Prisma Studio where you can inspect the `users` table and verify the `role` field uses the new enum values.
