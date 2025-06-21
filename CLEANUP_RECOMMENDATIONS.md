# Codebase Cleanup Recommendations

## Overview
This audit identified multiple areas where the codebase can be made leaner by removing unused files, dependencies, and redundant documentation.

## Files to Remove (30+ files)

### 1. Redundant Documentation
- `UPDATE_ENV.md` - Redundant with ENV_VARIABLES.md
- `FIX_AUTH.md` - One-time fix already applied
- `RUN_MIGRATION_INSTRUCTIONS.md` - Covered in MIGRATION_STEP_BY_STEP.md
- `CONSOLIDATION_SUMMARY.md` - Historical progress report
- `PROGRESS.md` - Historical progress tracking
- `DEPLOYMENT_CHECKLIST.md` - Redundant with DEPLOYMENT_NOTES.md
- `TEST_RAG_DEPLOYMENT.md` - Testing docs for completed feature

### 2. Duplicate Files
- `apps/web/tailwind.config.js` - Keep tailwind.config.ts
- `apps/api/src/routes/ai.routes.ts` - Duplicate with ai/ai.routes.ts
- `.eslintrc.json` - Using eslint.config.mjs
- `vercel.json` - Each app has its own

### 3. Test/Demo Files
- `apps/scraper/test-scrapedo.js`
- `apps/api/test-db-connection.js`
- `apps/web/src/app/test/page.tsx`
- `apps/web/src/app/test-layout/page.tsx`

### 4. One-Time Scripts
- `CHECK_EMBEDDINGS.sql`
- `CHECK_USER.sql`
- `CREATE_ADMIN_USER.sql`
- `apps/api/scripts/fix-admin-password.sql`
- `setup-database.sh`
- `setup-mcp.sh`

### 5. Unused Assets
- `apps/web/public/file.svg`
- `apps/web/public/globe.svg`
- `apps/web/public/window.svg`
- `apps/web/public/vercel.svg`

## Unused Dependencies

### Root Package
- `@sentry/node` - Used in apps, not root
- `eslint` - Each app has its own
- `prettier` - Each app has its own
- `typescript` - Each app has its own

### API Package
- `@modelcontextprotocol/server-postgres` - Run via npx, not imported
- `@upstash/context7-mcp` - Run via npx, not imported
- `@types/jest` - If not using Jest

### Web Package
- `@auth/prisma-adapter` - Not using Prisma
- `@radix-ui/*` UI components - Review if actually used
- `class-variance-authority` - Review usage
- `@types/jest` - If not using Jest
- **Missing**: `openai` - Add to dependencies

## Migration Strategy

### Option 1: Archive Migrations
Move applied migrations to an archive folder:
```bash
mkdir migration-archive
mv apps/api/src/db/migrations/* migration-archive/
```

### Option 2: Consolidate Migrations
Create a single consolidated migration file with the current schema.

## Cleanup Process

1. **Run the cleanup script**:
   ```bash
   ./cleanup-codebase.sh
   ```

2. **Update dependencies**:
   ```bash
   # Remove unused dependencies
   npm uninstall -D @sentry/node eslint prettier typescript

   # In apps/api
   npm uninstall @modelcontextprotocol/server-postgres @upstash/context7-mcp
   npm uninstall -D @types/jest

   # In apps/web
   npm install openai
   npm uninstall @auth/prisma-adapter class-variance-authority
   npm uninstall -D @types/jest
   ```

3. **Test everything**:
   ```bash
   npm run dev
   npm test
   npm run build
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Clean up unused files and dependencies"
   ```

## Benefits

- **Reduced complexity**: ~30 fewer files to maintain
- **Clearer documentation**: No redundant or outdated docs
- **Smaller bundle size**: Removed unused dependencies
- **Easier navigation**: Less clutter in the project
- **Faster CI/CD**: Less to process and build

## Important Notes

- The cleanup script creates a backup before removing files
- Archive migrations instead of deleting if you need the history
- Test thoroughly after cleanup
- Some Radix UI components might be used - verify before removing