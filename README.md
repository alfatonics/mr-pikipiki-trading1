# MR PIKIPIKI TRADING Management System

A comprehensive web-based management system for motorcycle trading operations, designed for MR PIKIPIKI TRADING in Dar es Salaam, Tanzania.

## Features

### 🏍️ Motorcycle Management
- Complete motorcycle inventory tracking
- Chassis and engine number management
- Status tracking (In Stock, Sold, In Repair, In Transit)
- Purchase and selling price management

### 📋 Contracts Module
- Auto-generated contract numbers
- Purchase and sales contracts
- PDF contract generation
- Contract printing and archiving

### 🤝 Supplier Management
- Supplier database with performance tracking
- Rating system
- Supply history and analytics

### 👥 Customer Management
- Customer information with ID verification
- Purchase history
- Customer search functionality

### 🚚 Transport & Delivery
- Delivery scheduling and tracking
- Driver assignment
- Transport cost management
- Delivery status updates

### 🔧 Repair & Maintenance
- Repair tracking by mechanic
- Spare parts inventory
- Labor and parts cost tracking
- Repair status management

### 📊 Reports & Analytics
- Sales reports with profit analysis
- Inventory valuation
- Supplier performance reports
- Transport performance tracking
- Repair cost analysis
- Excel export functionality

### 👤 User Management
- Role-based access control
- User activity tracking
- Secure authentication

## User Roles

- **Admin (Owner)**: Full system access
- **Sales (Shedrack & Matrida)**: Sales and contract management
- **Registration (Rama)**: Document and registration management
- **Secretary (Rehema)**: Contract printing and archiving
- **Transport (Gidion & Joshua)**: Delivery tracking
- **Mechanic (Dito)**: Repair and maintenance
- **Staff (Friday)**: Limited access

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- PDFKit for PDF generation
- ExcelJS for Excel reports

### Frontend
- React 18
- Vite
- TailwindCSS
- Recharts for analytics
- Axios for API calls
- React Router for navigation

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   cd "mr pikipiki"
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mr-pikipiki-trading
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # On Windows (if MongoDB is installed as a service)
   net start MongoDB
   
   # Or manually
   mongod --dbpath="C:\data\db"
   ```

6. **Run the application**
   ```bash
   # Development mode (runs both backend and frontend)
   npm run dev
   ```
   
   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Admin Account

After first run, create an admin user through MongoDB:

```javascript
// Connect to MongoDB shell
use mr-pikipiki-trading

// Insert admin user (password: admin123)
db.users.insertOne({
  username: "admin",
  password: "$2a$10$YourHashedPasswordHere",
  fullName: "System Administrator",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or use the API to create the first admin user.

## Production Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set environment to production**
   ```
   NODE_ENV=production
   ```

3. **Use a process manager like PM2**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name mr-pikipiki
   pm2 save
   pm2 startup
   ```

4. **Set up MongoDB backup**
   ```bash
   # Daily backup script
   mongodump --uri="mongodb://localhost:27017/mr-pikipiki-trading" --out="/backup/$(date +%Y%m%d)"
   ```

## API Documentation

### Authentication
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/change-password` - Change password

### Motorcycles
- GET `/api/motorcycles` - List all motorcycles
- POST `/api/motorcycles` - Create motorcycle
- PUT `/api/motorcycles/:id` - Update motorcycle
- DELETE `/api/motorcycles/:id` - Delete motorcycle

### Suppliers
- GET `/api/suppliers` - List all suppliers
- POST `/api/suppliers` - Create supplier
- PUT `/api/suppliers/:id` - Update supplier
- DELETE `/api/suppliers/:id` - Delete supplier

### Customers
- GET `/api/customers` - List all customers
- POST `/api/customers` - Create customer
- PUT `/api/customers/:id` - Update customer
- DELETE `/api/customers/:id` - Delete customer

### Contracts
- GET `/api/contracts` - List all contracts
- POST `/api/contracts` - Create contract
- GET `/api/contracts/:id/pdf` - Download contract PDF

### Transport
- GET `/api/transport` - List transport records
- POST `/api/transport` - Schedule transport
- POST `/api/transport/:id/deliver` - Mark as delivered

### Repairs
- GET `/api/repairs` - List repairs
- POST `/api/repairs` - Create repair
- POST `/api/repairs/:id/complete` - Mark as completed

### Reports
- GET `/api/reports/sales` - Sales report
- GET `/api/reports/inventory` - Inventory report
- GET `/api/reports/suppliers` - Supplier performance
- GET `/api/reports/transport` - Transport report
- GET `/api/reports/repairs` - Repair costs report
- GET `/api/reports/profit` - Profit analysis (Admin only)

## System Requirements

### Minimum Requirements
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Internet connection

### Recommended
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Stable internet connection

## Support

For technical support or issues:
- Location: Dar es Salaam, Ubungo Riverside-Kibangu
- Contact: MR PIKIPIKI TRADING Management

## License

Proprietary - © 2024 MR PIKIPIKI TRADING. All rights reserved.

## Backup & Security

### Automated Backups
The system should be backed up regularly:
- Database: Daily automated backups
- Documents: Weekly backups
- System configuration: Monthly backups

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- HTTPS recommended for production

## Maintenance

### Regular Tasks
- Monitor system logs
- Check database performance
- Update dependencies monthly
- Review user access logs
- Clean old temporary files

### Database Optimization
```bash
# Rebuild indexes
mongo mr-pikipiki-trading --eval "db.motorcycles.reIndex()"

# Check database size
mongo mr-pikipiki-trading --eval "db.stats()"
```

## Future Enhancements

- Mobile app (iOS/Android) [[memory:7665437]]
- SMS notifications
- Email notifications
- Advanced analytics dashboard
- Multi-branch support
- Customer portal
- Online payment integration


