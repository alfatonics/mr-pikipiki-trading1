# MR PIKIPIKI TRADING - Complete Setup Guide

## Step-by-Step Installation Guide

### Step 1: Install Node.js

1. Download Node.js from https://nodejs.org/ (LTS version recommended)
2. Run the installer
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install MongoDB

#### Option A: MongoDB Community Edition (Local)

1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Service
5. Verify installation:
   ```bash
   mongo --version
   ```

#### Option B: MongoDB Atlas (Cloud) - Recommended for Production

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` file with the connection string

### Step 3: Clone/Download the Project

```bash
cd "C:\Users\Administrator\Desktop\projects"
cd "mr pikipiki"
```

### Step 4: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 5: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mr-pikipiki-trading
   JWT_SECRET=mr_pikipiki_secret_key_2024_change_in_production
   NODE_ENV=development
   ```

### Step 6: Create Initial Admin User

#### Method 1: Using MongoDB Shell

```bash
# Open MongoDB shell
mongo

# Switch to database
use mr-pikipiki-trading

# Create admin user
db.users.insertOne({
  username: "admin",
  password: "$2a$10$rN8YQN/ZqKqKxpZW5ZmHO.5YYZ6RJ6h0KNLv3xKXzXQX8NqJFWaZy", // Password: admin123
  fullName: "System Administrator",
  role: "admin",
  email: "admin@mrpikipiki.co.tz",
  phone: "",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### Method 2: Create Setup Script

Create a file `setup-admin.js`:

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String,
      fullName: String,
      role: String,
      email: String,
      isActive: Boolean
    }));

    await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin',
      email: 'admin@mrpikipiki.co.tz',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
```

Run it:
```bash
node setup-admin.js
```

### Step 7: Start the Application

```bash
# Development mode (both frontend and backend)
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### Step 8: Access the Application

1. Open your browser
2. Go to: http://localhost:3000
3. Login with:
   - Username: `admin`
   - Password: `admin123`

### Step 9: Create Staff Users

After logging in as admin:

1. Go to **Users** page
2. Click **Add User**
3. Create users for each staff member:

**Example Staff:**

| Username | Full Name | Role | Initial Password |
|----------|-----------|------|------------------|
| shedrack | Shedrack | Sales | pikipiki2024 |
| matrida | Matrida | Sales | pikipiki2024 |
| rama | Rama | Registration | pikipiki2024 |
| rehema | Rehema | Secretary | pikipiki2024 |
| gidion | Gidion | Transport | pikipiki2024 |
| joshua | Joshua | Transport | pikipiki2024 |
| dito | Dito | Mechanic | pikipiki2024 |
| friday | Friday | Staff | pikipiki2024 |

### Step 10: Add Initial Suppliers

1. Go to **Suppliers** page
2. Add your motorcycle suppliers
3. Include contact details and ratings

### Step 11: Test the System

1. **Add a Motorcycle**: Go to Motorcycles > Add Motorcycle
2. **Create a Customer**: Go to Customers > Add Customer
3. **Generate a Contract**: Go to Contracts
4. **View Dashboard**: Check the dashboard for statistics

## Common Issues & Solutions

### Issue 1: MongoDB Connection Error

**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Solution**:
```bash
# Start MongoDB service (Windows)
net start MongoDB

# Or check if MongoDB is running
tasklist | findstr mongo
```

### Issue 2: Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**: Change the port in `.env`:
```
PORT=5001
```

### Issue 3: Node Modules Missing

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
# Reinstall dependencies
npm install
cd client
npm install
```

### Issue 4: Cannot Access Frontend

**Error**: Frontend not loading at localhost:3000

**Solution**:
```bash
# Check if Vite is running
cd client
npm run dev
```

## Production Deployment

### Using PM2 Process Manager

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem file** (`ecosystem.config.cjs`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'mr-pikipiki-backend',
       script: './server/index.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       }
     }]
   };
   ```

3. **Build frontend**:
   ```bash
   cd client
   npm run build
   ```

4. **Serve frontend with backend**:
   Add to `server/index.js`:
   ```javascript
   import path from 'path';
   import { fileURLToPath } from 'url';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   
   // Serve static files from React app
   if (process.env.NODE_ENV === 'production') {
     app.use(express.static(path.join(__dirname, '../client/dist')));
     
     app.get('*', (req, res) => {
       res.sendFile(path.join(__dirname, '../client/dist/index.html'));
     });
   }
   ```

5. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

### Database Backup Script

Create `backup-db.bat`:
```batch
@echo off
set BACKUP_DIR=C:\backups\mr-pikipiki
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%

mkdir %BACKUP_DIR%\%DATE%

mongodump --uri="mongodb://localhost:27017/mr-pikipiki-trading" --out=%BACKUP_DIR%\%DATE%

echo Backup completed: %BACKUP_DIR%\%DATE%
```

Schedule it to run daily using Windows Task Scheduler.

## System Maintenance

### Weekly Tasks
- [ ] Check application logs
- [ ] Review user activity
- [ ] Backup database
- [ ] Check disk space

### Monthly Tasks
- [ ] Update dependencies: `npm update`
- [ ] Review and archive old data
- [ ] Performance optimization
- [ ] Security audit

### Quarterly Tasks
- [ ] Full system backup
- [ ] Update Node.js and MongoDB
- [ ] Review user permissions
- [ ] System health check

## Contact & Support

**Location**: Dar es Salaam, Ubungo Riverside-Kibangu  
**Business**: MR PIKIPIKI TRADING

For technical issues, contact your IT administrator.

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET in production
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS in production
- [ ] Regular backups configured
- [ ] Firewall rules configured
- [ ] User access reviewed regularly

## Next Steps

1. ✅ Complete installation
2. ✅ Create users for all staff
3. ✅ Add suppliers to database
4. ✅ Test all modules
5. ✅ Configure automated backups
6. ✅ Train staff on system usage
7. ✅ Go live!

---

**System Ready!** Your MR PIKIPIKI TRADING Management System is now operational. 🏍️✨


