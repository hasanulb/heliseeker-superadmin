 # Database Migrations

This folder contains SQL migration files for the Burjcon CMS database schema.

## How to Apply Migrations

### Option 0: Drizzle Kit (New)
Drizzle is now configured in this project:
- Config: `drizzle.config.ts`
- Schema: `drizzle/schema.ts`
- DB client: `db/index.ts`

Run:
```bash
npm run db:generate
npm run db:migrate
```

Alternative:
```bash
npm run db:push
```

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from the migration file
4. Click **Run** to execute

### Option 2: Supabase CLI
```bash
# Apply a specific migration
supabase db push

# Or apply directly via psql
psql -h your-db-host -U your-username -d your-database -f migrations/001_create_clientele_tables.sql
```

### Option 3: pgAdmin or Database Client
1. Connect to your Supabase PostgreSQL database
2. Open the migration file in your SQL client
3. Execute the SQL statements

## Migration Files

### 001_create_clientele_tables.sql
Creates the clientele management system tables:

**Tables Created:**
- `clientele_groups` - Groups for organizing client logos
- `client_logos` - Individual client logos with references to groups

**Features:**
- UUID primary keys for better security
- Automatic timestamps (created_at, updated_at)
- Foreign key constraints with CASCADE delete
- Ordering support via order_index columns
- Performance indexes
- Row Level Security (RLS) policies
- Automatic updated_at triggers

**Columns:**

**clientele_groups:**
- `group_id` (UUID, Primary Key)
- `group_name` (VARCHAR(255), Required)
- `order_index` (INTEGER, Default: 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 002_create_admins_table.sql
Creates admin profile storage for CMS authentication/authorization:

**Tables Created:**
- `admins` - Admin users mapped to Supabase auth users

**Columns:**
- `admin_id` (UUID, Primary Key)
- `auth_user_id` (UUID, Unique, FK -> `auth.users.id`)
- `name` (VARCHAR(255), Required)
- `email` (VARCHAR(255), Required, Unique)
- `role` (VARCHAR(50), Default: `super_admin`)
- `img` (TEXT, Optional)
- `is_active` (BOOLEAN, Default: `true`)
- `last_login_at` (TIMESTAMP, Optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**How to initialize first super admin:**
1. Apply migration `002_create_admins_table.sql`.
2. Add `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
3. (Optional but recommended) Set `SUPER_ADMIN_SETUP_TOKEN`.
4. Run `POST /api/auth/setup-super-admin` once.
   - If token is set, include header: `x-setup-token: <SUPER_ADMIN_SETUP_TOKEN>`
5. Use returned credential to sign in.

**client_logos:**
- `client_logo_id` (UUID, Primary Key)
- `name` (VARCHAR(255), Optional)
- `img_url` (TEXT, Required)
- `group_id` (UUID, Foreign Key → clientele_groups)
- `order_index` (INTEGER, Default: 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Important Notes

1. **Row Level Security**: The migration enables RLS and creates policies for authenticated users. Adjust the policies based on your specific authentication setup.

2. **Permissions**: The migration grants permissions to the `authenticated` role. Make sure this aligns with your Supabase setup.

3. **Cascading Deletes**: When a group is deleted, all its associated logos are automatically deleted.

4. **Ordering**: The `order_index` columns support drag-and-drop reordering functionality in the UI.

5. **Image Storage**: The `img_url` column stores the URL/path to uploaded images. Make sure your image upload system is configured properly.

## Verification

After running the migration, verify the tables were created correctly:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('clientele_groups', 'client_logos');

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('clientele_groups', 'client_logos');

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('clientele_groups', 'client_logos');
```
