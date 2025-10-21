# ❌ Fix: "Please select a mechanic"

## Problem
When trying to create a repair, the mechanic dropdown is empty and shows no options.

## Cause
**No mechanic users exist in the database.**

---

## ✅ Quick Fix (Recommended)

### Run the Seed Script

This will create all default users including the mechanic (Dito):

```bash
node server/seed.js --add-missing
```

This creates:
- **Dito** (mechanic) - Username: `dito`, Password: `mech123`
- Plus all other staff (admin, sales, etc.)

---

## ✅ Alternative Fix 1: Create Mechanic via Users Page

### If you're logged in as Admin:

1. **Go to Users page** (sidebar → Users)
2. **Click "Add User"**
3. **Fill in the form:**
   - Username: `dito`
   - Password: `mech123`
   - Full Name: `Dito`
   - Role: **Mechanic (Dito)**
   - Email: `dito@mrpikipiki.com`
   - Phone: `+255 123 456 796`
4. **Click "Create"**
5. **Go back to Repairs page** and try again

---

## ✅ Alternative Fix 2: Create Mechanic via MongoDB

### Using MongoDB Shell:

```bash
mongosh
```

Then run:

```javascript
use mr-pikipiki-trading

// Create mechanic user
db.users.insertOne({
  username: "dito",
  password: "$2a$10$CwTycUXWue0Thq9StjUM0uJ4Zo.gU3WoQ5R3V4M5w3g1TXXKXaGKe", // mech123
  fullName: "Dito",
  role: "mechanic",
  email: "dito@mrpikipiki.com",
  phone: "+255 123 456 796",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Verify
db.users.find({ role: "mechanic" })
```

---

## 🔍 Verify the Fix

### Check if mechanics exist:

**Option 1: Via Browser**
1. Open browser console (F12)
2. Go to Repairs page
3. Open "Add Repair" modal
4. In console, type:
   ```javascript
   // Should show mechanic users
   fetch('/api/users/by-role/mechanic', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(console.log)
   ```

**Option 2: Via MongoDB**
```bash
mongosh
use mr-pikipiki-trading
db.users.find({ role: "mechanic" }).pretty()
```

**Option 3: Via Test Script**
```bash
node test-repair-creation.js
```

---

## 📋 Seed Script Options

### If database is empty:
```bash
node server/seed.js
```
Creates all 9 default users.

### If users already exist:
```bash
# Add only missing users
node server/seed.js --add-missing

# Delete all and recreate
node server/seed.js --reset

# Skip seeding
node server/seed.js --skip
```

---

## 👥 Default Users Created by Seed

| Username | Password | Full Name | Role |
|----------|----------|-----------|------|
| admin | admin123 | Administrator | Admin |
| shedrack | sales123 | Shedrack | Sales |
| matrida | sales123 | Matrida | Sales |
| rama | reg123 | Rama | Registration |
| rehema | sec123 | Rehema | Secretary |
| gidion | trans123 | Gidion | Transport |
| joshua | trans123 | Joshua | Transport |
| **dito** | **mech123** | **Dito** | **Mechanic** ⭐ |
| friday | staff123 | Friday | Staff |

---

## 🔐 After Creating Users

### Change Default Passwords:
1. Login as each user
2. Go to profile/settings (if available)
3. Change password from default

**OR** have admin reset passwords via Users page.

---

## 🧪 Test After Fix

### Test as Admin:
1. **Login as admin** (`admin` / `admin123`)
2. **Go to Repairs page**
3. **Click "Add Repair"**
4. **Check mechanic dropdown** - should show "Dito"
5. **Select Dito**
6. **Fill in other fields**
7. **Create repair** ✅

### Test as Mechanic:
1. **Logout**
2. **Login as mechanic** (`dito` / `mech123`)
3. **Go to Repairs page**
4. **Click "Add Repair"**
5. **Mechanic field should be auto-filled** with "Dito"
6. **Field should be disabled** ✓
7. **Should see: "✓ Auto-filled with your name"**
8. **Fill in other fields**
9. **Create repair** ✅

---

## 🚨 Still Not Working?

### Check Backend Logs:
When you try to load the Repairs page, the backend should log:
```
GET /api/users/by-role/mechanic
```

### Check Network Tab:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Open "Add Repair" modal
4. Look for request to `/api/users/by-role/mechanic`
5. Check response - should return array of mechanic users

### If response is empty `[]`:
- No mechanics exist → Run seed script

### If response is error:
- Check you're logged in
- Check token is valid
- Check server is running

---

## 💡 Quick Summary

**Problem:** No mechanics in dropdown  
**Solution:** Run `node server/seed.js --add-missing`  
**Test:** Login as admin → Repairs → Add Repair → Check dropdown  
**Expected:** Should see "Dito" in mechanic dropdown  

---

**After running the seed script, the mechanic dropdown will be populated!** 🎉

