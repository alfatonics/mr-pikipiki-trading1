# MR PIKIPIKI TRADING - Default Credentials

## Default Admin Account

After running `node setup-admin.js`, use these credentials:

**Username:** `admin`  
**Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

## Recommended Staff Accounts

Create these users through the admin panel (Users page):

### Sales Team
- **Username:** shedrack | **Role:** Sales | **Full Name:** Shedrack
- **Username:** matrida | **Role:** Sales | **Full Name:** Matrida

### Registration
- **Username:** rama | **Role:** Registration | **Full Name:** Rama

### Secretary
- **Username:** rehema | **Role:** Secretary | **Full Name:** Rehema

### Transport Team
- **Username:** gidion | **Role:** Transport | **Full Name:** Gidion
- **Username:** joshua | **Role:** Transport | **Full Name:** Joshua

### Mechanic
- **Username:** dito | **Role:** Mechanic | **Full Name:** Dito

### General Staff
- **Username:** friday | **Role:** Staff | **Full Name:** Friday

## Initial Password for All Staff

**Recommended:** `pikipiki2024`

⚠️ Instruct all users to change their password after first login!

## Security Best Practices

1. ✅ Change all default passwords immediately
2. ✅ Use strong passwords (minimum 8 characters with letters, numbers, and symbols)
3. ✅ Never share passwords via email or messaging apps
4. ✅ Review user access regularly
5. ✅ Disable inactive user accounts
6. ✅ Keep the JWT_SECRET in .env file secure
7. ✅ Backup the database regularly

## Database Credentials

**Local MongoDB:**
- **URI:** `mongodb://localhost:27017/mr-pikipiki-trading`
- **Database Name:** `mr-pikipiki-trading`

**For Production:**
- Use MongoDB authentication
- Update MONGODB_URI in .env with credentials
- Restrict database access to application server only

## API Security

**JWT Secret Key:**
- Located in `.env` file
- Change `JWT_SECRET` to a random, secure string
- Never commit `.env` to version control

**Example strong JWT_SECRET:**
```
JWT_SECRET=mR_p1k1p1k1_tr@d1ng_s3cr3t_k3y_2024_ch@ng3_th1s!
```

## Emergency Access

If you forget the admin password:

1. Stop the application
2. Connect to MongoDB:
   ```bash
   mongo mr-pikipiki-trading
   ```
3. Delete the admin user:
   ```javascript
   db.users.deleteOne({ username: "admin" })
   ```
4. Run setup script again:
   ```bash
   node setup-admin.js
   ```

## Password Reset Policy

Users can change their own passwords through the system:
1. Login to the system
2. Click on user profile
3. Select "Change Password"
4. Enter current password and new password

Only admins can reset passwords for other users by editing the user account.

---

**Keep this file secure and update it as you change credentials!**


