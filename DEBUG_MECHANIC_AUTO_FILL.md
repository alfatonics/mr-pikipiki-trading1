# Debug: Mechanic Field Auto-Fill Not Working

## Issue
Logged in as mechanic, but the mechanic field is not auto-filling with the user's name.

## What I Fixed

### 1. **Added Multiple Auto-Fill Triggers**
- ✅ Auto-fill when form data is initialized
- ✅ Auto-fill when modal opens (via useEffect)
- ✅ Auto-fill during form submission (as fallback)

### 2. **Fixed User ID Detection**
- ✅ Try both `user._id` and `user.id` (depending on auth response)
- ✅ Added logging to see what user data is available

### 3. **Added Debug Logging**
- ✅ Logs when auto-filling mechanic field
- ✅ Logs user object during submission
- ✅ Logs if mechanic field is empty

---

## How to Debug

### Step 1: Check Browser Console
1. **Login as mechanic** (username: `dito`, password: `mech123`)
2. **Open browser console** (Press F12 → Console tab)
3. **Go to Repairs page**
4. **Click "Add Repair"**

### Step 2: Look for These Log Messages

**When modal opens, you should see:**
```
Modal opened - auto-filling mechanic field with: <user_id>
```

**When you click Create, you should see:**
```
Auto-populating mechanic field with: <user_id>
Submitting repair data: { mechanic: '<user_id>', ... }
Current user: { id: '<user_id>', role: 'mechanic', ... }
```

### Step 3: Check User Object

In browser console, type:
```javascript
// Check what the auth context returns
console.log('Current user:', JSON.parse(localStorage.getItem('user')))

// Or if user is in context
// This shows what user data the app has
```

---

## Expected Behavior

### For Mechanic Users:
1. **Login as mechanic**
2. **Go to Repairs page**
3. **Click "Add Repair"**
4. **Mechanic dropdown should:**
   - ✅ Show the mechanic's name selected
   - ✅ Be disabled (grayed out)
   - ✅ Show message: "✓ Auto-filled with your name"
5. **Fill other fields (motorcycle, description)**
6. **Click Create**
7. **Should work without "Please select a mechanic" error**

---

## Common Issues

### Issue 1: User object doesn't have `_id` or `id`

**Check in console:**
```javascript
// See what's in the user object
fetch('/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(console.log)
```

**Expected response:**
```javascript
{
  user: {
    _id: "...",  // or id: "..."
    username: "dito",
    fullName: "Dito",
    role: "mechanic",
    email: "..."
  }
}
```

**If `_id` or `id` is missing**, check `server/routes/auth.js` - the `/me` endpoint.

---

### Issue 2: Mechanic not in the mechanics list

**Check in console:**
```javascript
fetch('/api/users/by-role/mechanic', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(console.log)
```

**Should return:**
```javascript
[
  {
    _id: "...",
    fullName: "Dito",
    username: "dito",
    role: "mechanic"
  }
]
```

**If empty array `[]`**, run:
```bash
node server/seed.js --add-missing
```

---

### Issue 3: Dropdown shows mechanic but is not selected

This means the auto-fill is not matching the mechanic's ID.

**Check in console when modal opens:**
```
Modal opened - auto-filling mechanic field with: 507f1f77bcf86cd799439011
```

**Then check if this ID matches the mechanic in the dropdown.**

**Fix:** The `user._id` from auth should match the mechanic's `_id` in the database.

---

## Files Modified

### `client/src/pages/Repairs.jsx`

**Changes:**
1. Added useEffect to auto-fill when modal opens
2. Fixed user ID detection (try both `user._id` and `user.id`)
3. Added fallback auto-fill during submission
4. Added extensive debug logging

**Key code:**
```javascript
// Auto-populate when modal opens
useEffect(() => {
  if (modalOpen && !editingRepair && user && user.role === 'mechanic') {
    const mechanicId = user._id || user.id;
    if (mechanicId && !formData.mechanic) {
      setFormData(prev => ({ ...prev, mechanic: mechanicId }));
    }
  }
}, [modalOpen, editingRepair, user]);

// Fallback during submission
if (!formData.mechanic && user?.role === 'mechanic') {
  formData.mechanic = user._id || user.id;
}
```

---

## Test Procedure

### Test 1: Visual Check
1. **Login as `dito` / `mech123`**
2. **Go to Repairs**
3. **Click "Add Repair"**
4. **Look at mechanic dropdown**
   - Should show "Dito" selected
   - Should be grayed out (disabled)
   - Should show "✓ Auto-filled with your name" below

### Test 2: Submission Check
1. **Continue from Test 1**
2. **Open browser console (F12)**
3. **Select a motorcycle**
4. **Enter description: "Test repair"**
5. **Click "Create"**
6. **Check console logs:**
   - Should show mechanic ID
   - Should NOT show "Please select a mechanic" alert
   - Should show "Repair created successfully!"

### Test 3: Backend Check
1. **Check server terminal**
2. **Should see:**
   ```
   Creating repair with data: { mechanic: '...', ... }
   Repair created successfully: <id>
   ```

---

## Quick Fixes

### If still not working after refresh:

**1. Clear browser cache and localStorage:**
```javascript
// In browser console
localStorage.clear()
// Then logout and login again
```

**2. Check auth token is valid:**
```javascript
// In browser console
console.log(localStorage.getItem('token'))
// Should show a long JWT token
```

**3. Re-login:**
- Logout
- Clear browser cache
- Login again as mechanic
- Try again

**4. Verify user role:**
```javascript
// After logging in, check in console
fetch('/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(data => {
  console.log('My role:', data.user.role)
  console.log('My ID:', data.user._id || data.user.id)
})
```

---

## Expected Console Output

### When modal opens:
```
Modal opened - auto-filling mechanic field with: 507f1f77bcf86cd799439011
Auto-populating mechanic field with: 507f1f77bcf86cd799439011 for user: { id: '...', role: 'mechanic', ... }
```

### When submitting:
```
Submitting repair data: {
  motorcycle: "...",
  mechanic: "507f1f77bcf86cd799439011",
  description: "Test repair",
  ...
}
Current user: { id: "507f1f77bcf86cd799439011", role: "mechanic", ... }
```

### Server response:
```
Creating repair with data: { mechanic: '507f1f77bcf86cd799439011', ... }
Repair created successfully: <repair_id>
```

---

## Still Not Working?

Share these details:

1. **Browser console output** when you open "Add Repair" modal
2. **User object** from console:
   ```javascript
   fetch('/api/auth/me', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(console.log)
   ```
3. **Mechanics list** from console:
   ```javascript
   fetch('/api/users/by-role/mechanic', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(console.log)
   ```
4. **Screenshot** of the "Add Repair" modal showing the mechanic dropdown

---

**The auto-fill should now work with multiple fallback mechanisms!** 🚀

