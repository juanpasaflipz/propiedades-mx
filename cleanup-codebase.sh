#!/bin/bash

# Codebase Cleanup Script
# This script removes unused files to make the codebase leaner

echo "🧹 Starting codebase cleanup..."
echo ""
echo "⚠️  WARNING: This will permanently delete files!"
echo "Make sure you have committed all changes or have a backup."
echo ""
echo "Do you want to continue? (y/n)"
read -r CONTINUE

if [ "$CONTINUE" != "y" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Create a backup directory for safety
BACKUP_DIR="cleanup-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup in $BACKUP_DIR..."

# Function to safely remove files
safe_remove() {
    if [ -f "$1" ]; then
        cp "$1" "$BACKUP_DIR/" 2>/dev/null
        rm -f "$1"
        echo "  ✓ Removed: $1"
    fi
}

# Function to safely remove directories
safe_remove_dir() {
    if [ -d "$1" ]; then
        cp -r "$1" "$BACKUP_DIR/" 2>/dev/null
        rm -rf "$1"
        echo "  ✓ Removed directory: $1"
    fi
}

echo ""
echo "📄 Removing redundant documentation files..."
safe_remove "UPDATE_ENV.md"
safe_remove "FIX_AUTH.md"
safe_remove "RUN_MIGRATION_INSTRUCTIONS.md"
safe_remove "CONSOLIDATION_SUMMARY.md"
safe_remove "PROGRESS.md"
safe_remove "DEPLOYMENT_CHECKLIST.md"
safe_remove "TEST_RAG_DEPLOYMENT.md"

echo ""
echo "🔧 Removing duplicate configuration files..."
safe_remove "apps/web/tailwind.config.js"
safe_remove "apps/api/src/routes/ai.routes.ts"
safe_remove ".eslintrc.json"
safe_remove "vercel.json"

echo ""
echo "🧪 Removing test/demo files..."
safe_remove "apps/scraper/test-scrapedo.js"
safe_remove "apps/api/test-db-connection.js"
safe_remove "apps/web/src/app/test/page.tsx"
safe_remove "apps/web/src/app/test-layout/page.tsx"

echo ""
echo "📊 Removing one-time SQL scripts..."
safe_remove "CHECK_EMBEDDINGS.sql"
safe_remove "CHECK_USER.sql"
safe_remove "CREATE_ADMIN_USER.sql"
safe_remove "apps/api/scripts/fix-admin-password.sql"

echo ""
echo "🖼️  Removing unused public assets..."
safe_remove "apps/web/public/file.svg"
safe_remove "apps/web/public/globe.svg"
safe_remove "apps/web/public/window.svg"
safe_remove "apps/web/public/vercel.svg"

echo ""
echo "🔐 Removing backup files..."
safe_remove ".env.backup"

echo ""
echo "🚀 Removing one-time setup scripts..."
safe_remove "setup-database.sh"
safe_remove "setup-mcp.sh"

echo ""
echo "📋 Creating migration archive..."
MIGRATION_ARCHIVE="migration-archive-$(date +%Y%m%d)"
mkdir -p "$MIGRATION_ARCHIVE"
cp -r apps/api/src/db/migrations/* "$MIGRATION_ARCHIVE/" 2>/dev/null
echo "  ✓ Migrations archived in $MIGRATION_ARCHIVE"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "- Backup created in: $BACKUP_DIR"
echo "- Migrations archived in: $MIGRATION_ARCHIVE"
echo ""
echo "🔍 Next steps:"
echo "1. Run 'npm install' to clean up node_modules"
echo "2. Review and remove unused dependencies from package.json files"
echo "3. Test the application to ensure everything still works"
echo "4. Commit the changes"
echo "5. Remove the backup directory once you're confident: rm -rf $BACKUP_DIR"