# MR PIKIPIKI TRADING - Deployment Checklist

## Pre-Deployment Checklist

### Development Environment
- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] Database connections working
- [ ] All dependencies installed
- [ ] Code reviewed and optimized

### Security
- [ ] Changed default admin password
- [ ] Updated JWT_SECRET in .env
- [ ] MongoDB authentication enabled
- [ ] Removed development credentials
- [ ] API endpoints secured
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Configuration
- [ ] .env file configured for production
- [ ] NODE_ENV set to 'production'
- [ ] Database backup schedule configured
- [ ] Error logging configured
- [ ] Performance monitoring set up

---

## Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
# Follow: https://docs.mongodb.com/manual/administration/install-on-linux/

# Install PM2
sudo npm install -g pm2
```

### 2. Application Deployment

```bash
# Clone/upload project to server
cd /var/www/mr-pikipiki

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
cd client
npm run build
cd ..

# Configure environment
cp .env.example .env
nano .env
# Update all production values

# Create logs directory
mkdir -p logs

# Test the application
npm start
```

### 3. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Check status
pm2 status
pm2 logs mr-pikipiki-backend
```

### 4. Configure Nginx (Optional but Recommended)

```nginx
# /etc/nginx/sites-available/mr-pikipiki
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/mr-pikipiki/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mr-pikipiki /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. MongoDB Configuration

```bash
# Enable authentication
sudo nano /etc/mongod.conf

# Add:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Create admin user
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password_here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create app user
use mr-pikipiki-trading
db.createUser({
  user: "pikipiki_app",
  pwd: "another_secure_password",
  roles: [ { role: "readWrite", db: "mr-pikipiki-trading" } ]
})

# Update .env with new credentials
```

### 7. Setup Database Backup

Create `/etc/cron.daily/backup-mr-pikipiki`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/mr-pikipiki"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://pikipiki_app:password@localhost:27017/mr-pikipiki-trading" \
  --out="$BACKUP_DIR/backup_$DATE" \
  --gzip

# Keep only last 30 days
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $DATE" >> /var/log/mr-pikipiki-backup.log
```

Make executable:
```bash
sudo chmod +x /etc/cron.daily/backup-mr-pikipiki
```

### 8. Setup Firewall

```bash
# UFW Firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Post-Deployment Checklist

### Verification
- [ ] Application accessible at production URL
- [ ] Login functionality working
- [ ] All pages loading correctly
- [ ] Database operations working
- [ ] PDF generation working
- [ ] Excel export working
- [ ] File uploads working (if any)
- [ ] Mobile responsiveness verified

### Monitoring
- [ ] PM2 monitoring active
- [ ] Error logs being generated
- [ ] Disk space monitoring configured
- [ ] Database size monitoring
- [ ] Backup verification completed
- [ ] SSL certificate auto-renewal working

### User Setup
- [ ] Admin account created and tested
- [ ] Default password changed
- [ ] All staff users created
- [ ] User permissions verified
- [ ] Training materials provided

### Documentation
- [ ] Production URL documented
- [ ] Admin credentials stored securely
- [ ] Database credentials stored securely
- [ ] Backup location documented
- [ ] Recovery procedures documented

### Performance
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] API response times good
- [ ] Concurrent user handling tested

---

## Maintenance Schedule

### Daily
- [ ] Check application status: `pm2 status`
- [ ] Review error logs: `pm2 logs`
- [ ] Verify backups completed
- [ ] Monitor disk space: `df -h`

### Weekly
- [ ] Test database backup restoration
- [ ] Review system performance
- [ ] Check for security updates
- [ ] Clear old logs if needed

### Monthly
- [ ] Update Node.js packages: `npm update`
- [ ] Review user access
- [ ] Performance optimization
- [ ] Security audit

### Quarterly
- [ ] Full system backup
- [ ] Update Node.js and MongoDB
- [ ] Review and update documentation
- [ ] Disaster recovery test

---

## Rollback Plan

If deployment fails:

```bash
# Stop application
pm2 stop mr-pikipiki-backend

# Restore previous version
cd /var/www/mr-pikipiki
git checkout previous-version
# or restore from backup

# Restore database (if needed)
mongorestore --uri="mongodb://..." /path/to/backup

# Restart application
pm2 restart mr-pikipiki-backend

# Verify
pm2 logs
```

---

## Emergency Contacts

**System Administrator:**  
Name: ________________  
Phone: ________________  
Email: ________________  

**Database Administrator:**  
Name: ________________  
Phone: ________________  
Email: ________________  

**Hosting Provider:**  
Name: ________________  
Phone: ________________  
Support: ________________  

---

## Production Environment Details

**Server:**
- IP Address: ________________
- OS: ________________
- Node.js Version: ________________
- MongoDB Version: ________________

**Domains:**
- Production URL: ________________
- SSL Certificate: ________________
- Expiry Date: ________________

**Database:**
- Host: ________________
- Port: ________________
- Database Name: mr-pikipiki-trading
- Backup Location: ________________

**Monitoring:**
- Monitoring Tool: ________________
- Alert Email: ________________
- Status Page: ________________

---

## Sign-off

**Deployed By:** ________________  
**Date:** ________________  
**Version:** 1.0.0  

**Approved By:** ________________  
**Date:** ________________  

---

**System Status:** ✅ Production Ready

**MR PIKIPIKI TRADING Management System**


