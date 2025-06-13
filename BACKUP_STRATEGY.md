# Real Estate Aggregator MX - Backup Strategy

## 🛡️ Comprehensive Backup Plan

### 1. **Code Repository Backup**

#### Primary: GitHub
```bash
# Push to GitHub (main backup)
git remote add origin https://github.com/yourusername/real-estate-aggregator-mx.git
git push -u origin main

# Enable GitHub features:
# - Branch protection on main
# - Require PR reviews
# - Enable GitHub Actions for CI/CD
```

#### Secondary: Automated Mirrors
```bash
# Mirror to GitLab
git remote add gitlab https://gitlab.com/yourusername/real-estate-aggregator-mx.git

# Mirror to Bitbucket  
git remote add bitbucket https://bitbucket.org/yourusername/real-estate-aggregator-mx.git

# Push to all remotes
git remote | xargs -L1 git push --all
```

### 2. **Database Backup Strategy**

#### Automated Daily Backups
```bash
# Create backup script
cat > infrastructure/scripts/backup-database.sh << 'EOF'
#!/bin/bash
# Database Backup Script

# Configuration
DB_NAME="${DB_NAME:-real_estate_db}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER -d $DB_NAME -f "$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql.gz" \
  s3://your-backup-bucket/postgres/

# Clean old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
EOF

chmod +x infrastructure/scripts/backup-database.sh
```

#### Cron Job Setup
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/infrastructure/scripts/backup-database.sh
```

### 3. **Application Data Backup**

#### Environment Files
```bash
# Create secure backup of env files
cat > infrastructure/scripts/backup-env.sh << 'EOF'
#!/bin/bash
# Backup environment files

BACKUP_DIR="/backups/env"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Encrypt and backup .env files
tar -czf - .env* | openssl enc -aes-256-cbc -salt -out "$BACKUP_DIR/env_backup_${TIMESTAMP}.tar.gz.enc"

# Store encryption password separately!
EOF

chmod +x infrastructure/scripts/backup-env.sh
```

#### Scraped Data & Images
```bash
# If storing scraped images locally
cat > infrastructure/scripts/backup-media.sh << 'EOF'
#!/bin/bash
# Backup media files

MEDIA_DIR="/app/media"
BACKUP_DIR="/backups/media"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Sync to backup location
rsync -av --progress $MEDIA_DIR/ $BACKUP_DIR/media_${TIMESTAMP}/

# Or sync to S3
aws s3 sync $MEDIA_DIR s3://your-backup-bucket/media/ --delete
EOF
```

### 4. **Docker Volume Backup**

```bash
# Backup Docker volumes
cat > infrastructure/scripts/backup-volumes.sh << 'EOF'
#!/bin/bash
# Docker Volume Backup

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL volume
docker run --rm \
  -v real-estate-aggregator-mx_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_volume_${TIMESTAMP}.tar.gz -C /data .

# Backup Redis volume
docker run --rm \
  -v real-estate-aggregator-mx_redis_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis_volume_${TIMESTAMP}.tar.gz -C /data .
EOF

chmod +x infrastructure/scripts/backup-volumes.sh
```

### 5. **Full System Backup Script**

```bash
# Create master backup script
cat > infrastructure/scripts/backup-all.sh << 'EOF'
#!/bin/bash
# Complete System Backup

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/backups"
LOG_FILE="$BACKUP_ROOT/logs/backup_${TIMESTAMP}.log"

# Create directories
mkdir -p $BACKUP_ROOT/{database,env,media,volumes,logs}

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "Starting full system backup..."

# 1. Database backup
log "Backing up database..."
./backup-database.sh >> $LOG_FILE 2>&1

# 2. Environment backup
log "Backing up environment files..."
./backup-env.sh >> $LOG_FILE 2>&1

# 3. Media backup
log "Backing up media files..."
./backup-media.sh >> $LOG_FILE 2>&1

# 4. Docker volumes
log "Backing up Docker volumes..."
./backup-volumes.sh >> $LOG_FILE 2>&1

# 5. Git repository state
log "Saving git state..."
git bundle create "$BACKUP_ROOT/git/repo_bundle_${TIMESTAMP}.bundle" --all

log "Backup completed successfully!"

# Send notification (optional)
# curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
#   -H 'Content-type: application/json' \
#   --data '{"text":"Backup completed successfully!"}'
EOF

chmod +x infrastructure/scripts/backup-all.sh
```

### 6. **Backup Storage Locations**

#### Local Backups
```
/backups/
├── database/      # PostgreSQL dumps
├── env/           # Encrypted environment files
├── media/         # Scraped images/files
├── volumes/       # Docker volume backups
├── git/           # Git bundles
└── logs/          # Backup logs
```

#### Cloud Storage (Recommended)
```bash
# AWS S3 Bucket Structure
s3://your-backup-bucket/
├── daily/
├── weekly/
├── monthly/
└── critical/      # Immediate post-deployment

# Setup AWS CLI
aws configure

# Sync backups to S3
aws s3 sync /backups s3://your-backup-bucket/ --exclude "*.log"
```

### 7. **Restoration Procedures**

#### Database Restoration
```bash
# From SQL dump
gunzip < backup_real_estate_db_20240112_020000.sql.gz | psql -U postgres real_estate_db

# From Docker volume
docker run --rm \
  -v real-estate-aggregator-mx_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres_volume_20240112.tar.gz -C /data
```

#### Full System Restoration
```bash
# 1. Clone repository
git clone repo-bundle.bundle real-estate-aggregator-mx

# 2. Restore environment
openssl enc -aes-256-cbc -d -in env_backup.tar.gz.enc | tar -xzf -

# 3. Restore database
./restore-database.sh backup_real_estate_db_latest.sql.gz

# 4. Restore Docker volumes
docker-compose down
./restore-volumes.sh
docker-compose up -d
```

### 8. **Backup Monitoring**

```bash
# Create monitoring script
cat > infrastructure/scripts/check-backups.sh << 'EOF'
#!/bin/bash
# Check if backups are current

BACKUP_DIR="/backups"
MAX_AGE_HOURS=26  # Alert if backup older than 26 hours

# Check latest database backup
LATEST_DB=$(find $BACKUP_DIR/database -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")
if [ -z "$LATEST_DB" ]; then
  echo "ERROR: No database backup found!"
  exit 1
fi

# Check age
AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_DB")) / 3600 ))
if [ $AGE -gt $MAX_AGE_HOURS ]; then
  echo "WARNING: Latest backup is $AGE hours old!"
  # Send alert
fi
EOF
```

### 9. **Disaster Recovery Plan**

#### Recovery Time Objectives (RTO)
- **Code**: < 5 minutes (from Git)
- **Database**: < 30 minutes (from backup)
- **Full System**: < 2 hours

#### Recovery Point Objectives (RPO)
- **Database**: Maximum 24 hours data loss
- **Scraped Data**: Maximum 1 hour data loss
- **Configuration**: No data loss (version controlled)

### 10. **Best Practices**

1. **3-2-1 Rule**:
   - 3 copies of data
   - 2 different storage types
   - 1 offsite backup

2. **Test Restorations**:
   ```bash
   # Monthly restoration test
   ./test-restoration.sh
   ```

3. **Encryption**:
   - Encrypt all backups containing sensitive data
   - Store encryption keys separately

4. **Automation**:
   - Automate all backup processes
   - Monitor backup success/failure
   - Alert on failures

5. **Documentation**:
   - Document all procedures
   - Keep restoration guides updated
   - Train team members

## 🚨 Emergency Contacts

```
# Backup Failure Escalation
1. Check logs: /backups/logs/
2. Slack: #alerts-backup
3. On-call: +1-XXX-XXX-XXXX
4. Cloud provider support
```

## 📅 Backup Schedule Summary

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Daily | 30 days | S3 + Local |
| Code | On commit | Forever | GitHub + Mirror |
| Env files | On change | 90 days | Encrypted S3 |
| Docker volumes | Weekly | 4 weeks | S3 |
| Full backup | Weekly | 12 weeks | S3 + Offsite |

Remember: **A backup is only as good as its last successful restoration test!**