# MR PIKIPIKI TRADING - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- ✅ Node.js installed
- ✅ MongoDB installed and running

### Installation

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Create admin user
node setup-admin.js

# 3. Start the application
npm run dev
```

### Access the System
Open http://localhost:3000

**Login:**
- Username: `admin`
- Password: `admin123`

### First Steps After Login

1. **Change Admin Password**
   - Click on your profile
   - Change password
   - Use a strong password

2. **Create Staff Users**
   - Go to "Users" page
   - Add all staff members with their roles

3. **Add Suppliers**
   - Go to "Suppliers" page
   - Add your motorcycle suppliers

4. **Start Managing Motorcycles**
   - Go to "Motorcycles" page
   - Begin adding your inventory

## 📱 User Roles

| Role | Users | Access |
|------|-------|--------|
| Admin | Owner | Full access |
| Sales | Shedrack, Matrida | Sales, Contracts |
| Registration | Rama | Documents, Registration |
| Secretary | Rehema | Contracts, Printing |
| Transport | Gidion, Joshua | Deliveries |
| Mechanic | Dito | Repairs |
| Staff | Friday | Limited access |

## 🆘 Need Help?

**Common Issues:**

1. **MongoDB not running**
   ```bash
   net start MongoDB
   ```

2. **Port already in use**
   - Change PORT in `.env` file

3. **Dependencies missing**
   ```bash
   npm install
   ```

## 📞 Support

Location: Dar es Salaam, Ubungo Riverside-Kibangu

---

**System ready!** Start managing your motorcycle business efficiently. 🏍️


