# Repair Creation Error - Debugging Guide

## Issue: "Failed to create repair record"

This guide will help you debug and fix the repair creation error.

---

## ✅ What I've Fixed

### 1. **Backend Error Handling** (`server/routes/repairs.js`)
- Added detailed console logging
- Added validation for required fields
- Added check for motorcycle existence
- Better error messages (shows actual error instead of generic message)
- Handles validation errors, cast errors, and other exceptions

### 2. **Frontend Validation** (`client/src/pages/Repairs.jsx`)
- Added client-side validation for motorcycle, mechanic, and description
- Better console logging for debugging
- More detailed error messages
- Success message after creation

### 3. **Auto-Population for Mechanics**
- Mechanic field automatically filled when mechanic user adds repair
- Field is disabled for mechanic users (can't change it)
- Visual indicator showing auto-fill

---

## 🔍 Debugging Steps

### Step 1: Check Server Logs
1. **Look at your terminal** where `npm run dev` is running
2. **Try to create a repair** from the frontend
3. **Look for these log messages:**
   ```
   Creating repair with data: { ... }
   Repair created successfully: <id>
   Motorcycle status updated to in_repair
   Repair populated and ready to send
   ```

4. **If you see an error**, it will show:
   ```
   Error creating repair record: <actual error message>
   ```

### Step 2: Check Browser Console
1. **Press F12** to open Developer Tools
2. **Go to Console tab**
3. **Try to create a repair**
4. **Look for:**
   ```
   Submitting repair data: { ... }
   Repair created successfully: { ... }
   ```
   OR
   ```
   Error saving repair: <error message>
   ```

### Step 3: Run Test Script
Run the test script to verify backend functionality:

```bash
node test-repair-creation.js
```

This will:
- ✓ Connect to MongoDB
- ✓ Find a mechanic user
- ✓ Find a motorcycle
- ✓ Create a test repair
- ✓ Display the result

If this works, the problem is in the frontend. If it fails, the problem is in the backend.

---

## 🚨 Common Issues & Solutions

### Issue 1: "Motorcycle and Mechanic are required"
**Cause:** Form data not properly populated
**Solution:**
- Check that you selected both a motorcycle and mechanic
- Check browser console for form data being submitted
- For mechanics: ensure auto-population is working (should see their name in field)

### Issue 2: "Motorcycle not found"
**Cause:** Selected motorcycle doesn't exist in database
**Solution:**
- Check if motorcycles are loading properly
- Go to Motorcycles page and verify you have motorcycles
- Check MongoDB to ensure motorcycles exist:
  ```bash
  mongosh
  use mr-pikipiki-trading
  db.motorcycles.find()
  ```

### Issue 3: "Invalid ID format"
**Cause:** Motorcycle or Mechanic ID is not a valid ObjectId
**Solution:**
- Check browser console for the data being sent
- Verify the mechanic auto-population is setting a valid ID
- Check that mechanics are loading from `/api/users/by-role/mechanic`

### Issue 4: No mechanic users found
**Cause:** No users with role 'mechanic' exist
**Solution:**
1. **Go to Users page** (admin only)
2. **Create a mechanic user:**
   - Username: dito (or any username)
   - Full Name: Dito
   - Role: Mechanic (Dito)
   - Password: your_password
3. **Or use the terminal:**
   ```bash
   node server/seedUsers.js
   ```

### Issue 5: Authorization error
**Cause:** User doesn't have permission to create repairs
**Solution:**
- Only `admin` and `mechanic` roles can create repairs
- Check your user role:
  - Go to Users page (admin)
  - Or check MongoDB:
    ```bash
    mongosh
    use mr-pikipiki-trading
    db.users.find({ username: "your_username" })
    ```

### Issue 6: Network error / Server not responding
**Cause:** Backend server not running or wrong URL
**Solution:**
1. **Check backend is running:**
   ```bash
   npm run dev
   ```
2. **Check port:** Should be `http://localhost:5000`
3. **Check axios baseURL** in `client/vite.config.js`:
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:5000',
         changeOrigin: true
       }
     }
   }
   ```

---

## 🧪 Manual Testing Checklist

### Test as Admin:
- [ ] Login as admin
- [ ] Go to Repairs page
- [ ] Click "Add Repair"
- [ ] Select motorcycle from dropdown
- [ ] Select mechanic from dropdown (should show all mechanics)
- [ ] Enter description
- [ ] Select repair type
- [ ] Enter labor cost
- [ ] Click Create
- [ ] Check if repair appears in table
- [ ] Check server logs for success messages

### Test as Mechanic:
- [ ] Login as mechanic (e.g., dito)
- [ ] Go to Repairs page
- [ ] Click "Add Repair"
- [ ] Check that mechanic field is auto-filled with your name
- [ ] Check that mechanic field is disabled (grayed out)
- [ ] Check for "✓ Auto-filled with your name" message
- [ ] Select motorcycle
- [ ] Enter description
- [ ] Select repair type
- [ ] Enter labor cost
- [ ] Click Create
- [ ] Check if repair appears in table
- [ ] Check server logs for success messages

---

## 📋 Verify Database Data

### Check Users:
```bash
mongosh
use mr-pikipiki-trading
db.users.find({ role: "mechanic" })
```

Should return at least one mechanic user.

### Check Motorcycles:
```bash
db.motorcycles.find()
```

Should return at least one motorcycle.

### Check Repairs:
```bash
db.repairs.find()
```

Will show all repairs created.

---

## 🔧 Quick Fix Commands

### If you need to create a mechanic user manually:
```javascript
// In mongosh
use mr-pikipiki-trading
db.users.insertOne({
  username: "dito",
  password: "$2a$10$YourHashedPasswordHere",  // Use bcrypt to hash
  fullName: "Dito",
  role: "mechanic",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Or use the test script approach - check `server/seed.js` if it exists.

---

## 📞 Still Not Working?

If none of the above works:

1. **Share the exact error message from:**
   - Server terminal output
   - Browser console (F12 → Console)

2. **Share the data being sent:**
   - Look in browser console for "Submitting repair data: ..."
   - Copy that entire object

3. **Run the test script and share output:**
   ```bash
   node test-repair-creation.js
   ```

4. **Check your user role:**
   - What role are you logged in as?
   - Is it admin or mechanic?

---

## 📝 Summary of Changes

### Files Modified:
1. **`server/routes/repairs.js`**
   - Enhanced error handling
   - Added validation
   - Added detailed logging

2. **`client/src/pages/Repairs.jsx`**
   - Added client-side validation
   - Better error messages
   - Auto-population for mechanic users
   - Improved logging

3. **Created `test-repair-creation.js`**
   - Test script for backend verification

---

**The repair creation should now work with much better error messages to help debug any issues!** 🚀

If you still get "Failed to create repair record", check the server logs - the error message will now tell you exactly what went wrong.

