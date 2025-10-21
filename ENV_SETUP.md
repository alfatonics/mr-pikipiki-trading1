# 🔧 Environment Variables Setup

## Your MongoDB Atlas Connection String

Your production MongoDB Atlas connection string is:

```
mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki
```

---

## 📝 **Update Your Local .env File**

### **Open your .env file:**
```
C:\Users\Administrator\Desktop\projects\mr pikipiki\.env
```

### **Update it with these values:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection (Production Database)
MONGODB_URI=mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki

# JWT Secret for Authentication
JWT_SECRET=MrPikipiki_Secret_Key_2024_Please_Change_In_Production
```

---

## ✅ **What This Does:**

**When you run locally:**
- Now uses MongoDB Atlas (cloud) instead of local MongoDB
- Same database as production
- Data syncs between local and deployed app
- No need for local MongoDB server

---

## 🎯 **For Vercel Deployment:**

**Use these exact environment variables in Vercel:**

### **1. MONGODB_URI**
```
mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki
```

### **2. JWT_SECRET**
```
MrPikipiki_Vercel_Production_Secret_2024
```

### **3. PORT**
```
5000
```

### **4. NODE_ENV**
```
production
```

---

## 🔐 **Security Notes:**

**Important:**
- ✅ .env file is in .gitignore (secure)
- ✅ Never commit .env to Git
- ✅ Never share your MongoDB password
- ✅ Change JWT_SECRET to random string in production

**Your MongoDB Password:** `bp2kOzatPLUW5RfG`
- Keep this secure
- Don't share publicly
- Use environment variables only

---

## 📋 **Quick Copy:**

**For your .env file (local development):**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki
JWT_SECRET=MrPikipiki_Secret_Key_2024_Please_Change_In_Production
```

---

## ✅ **Summary:**

**Your MongoDB Atlas:**
- Username: mrpikipiki
- Password: bp2kOzatPLUW5RfG
- Cluster: mrpikipiki.zqt65e1.mongodb.net
- Database: mr-pikipiki-trading

**Connection String:**
```
mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki
```

mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki

**Use this in:**
- Local .env file (for development)
- Vercel environment variables (for deployment)

---

**Update your .env file now, then restart your local server to use MongoDB Atlas!** 🔄

**Also add these same variables to Vercel and deploy!** 🚀

