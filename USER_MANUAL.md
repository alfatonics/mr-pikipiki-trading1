# MR PIKIPIKI TRADING - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Motorcycle Management](#motorcycle-management)
4. [Supplier Management](#supplier-management)
5. [Customer Management](#customer-management)
6. [Contracts](#contracts)
7. [Transport & Delivery](#transport--delivery)
8. [Repairs & Maintenance](#repairs--maintenance)
9. [Reports](#reports)
10. [User Management](#user-management)

---

## Getting Started

### Logging In
1. Open your web browser
2. Go to: http://localhost:3000 (or your server address)
3. Enter your username and password
4. Click "Login"

### First Time Login
- You will receive a username and temporary password
- After first login, change your password immediately
- Choose a strong password you can remember

### Main Interface
- **Sidebar:** Navigate between different modules
- **Top Bar:** Shows current date and user info
- **Main Area:** Displays the current page content

---

## Dashboard

The Dashboard provides an overview of your business:

### Key Metrics
- **Total Motorcycles:** Total inventory count
- **Monthly Sales:** Sales for current month
- **Monthly Revenue:** Revenue for current month
- **Total Customers:** Number of customers
- **Pending Transports:** Deliveries awaiting completion
- **Active Repairs:** Ongoing repairs

### Charts
- **Monthly Sales Overview:** Bar chart showing sales trends
- **Inventory Status:** Breakdown by status (In Stock, Sold, etc.)

### Quick Views
- **Top Suppliers:** Best performing suppliers
- **Recent Sales:** Latest sales transactions

---

## Motorcycle Management

### Adding a Motorcycle

1. Click **"Motorcycles"** in sidebar
2. Click **"Add Motorcycle"** button
3. Fill in the form:
   - **Chassis Number:** Unique identifier (required)
   - **Engine Number:** Engine identification (required)
   - **Brand:** Manufacturer (e.g., Honda, Yamaha)
   - **Model:** Model name
   - **Year:** Manufacturing year
   - **Color:** Motorcycle color
   - **Purchase Price:** Amount paid to supplier
   - **Selling Price:** Expected selling price
   - **Supplier:** Select from dropdown
   - **Purchase Date:** Date of purchase
   - **Status:** Current status (default: In Stock)
   - **Registration Number:** License plate (if registered)
   - **Notes:** Additional information
4. Click **"Create"**

### Viewing Motorcycles
- All motorcycles are displayed in a table
- Use filters to find specific motorcycles
- Click on a row to view details

### Editing a Motorcycle
1. Find the motorcycle in the list
2. Click the **Edit icon** (pencil)
3. Modify the information
4. Click **"Update"**

### Deleting a Motorcycle
1. Find the motorcycle in the list
2. Click the **Delete icon** (trash)
3. Confirm the deletion
   - ⚠️ **Warning:** This cannot be undone!

### Motorcycle Statuses
- **In Stock:** Available for sale
- **Sold:** Already sold to customer
- **In Repair:** Currently being repaired
- **In Transit:** Being delivered
- **Reserved:** Reserved for a customer

---

## Supplier Management

### Adding a Supplier

1. Click **"Suppliers"** in sidebar
2. Click **"Add Supplier"** button
3. Fill in the form:
   - **Name:** Contact person name
   - **Company:** Company name (if applicable)
   - **Phone:** Contact number
   - **Email:** Email address
   - **Address:** Physical address
   - **City:** City (default: Dar es Salaam)
   - **Country:** Country (default: Tanzania)
   - **Tax ID:** Tax identification number
   - **Rating:** Supplier rating (1-5 stars)
   - **Notes:** Additional information
4. Click **"Create"**

### Viewing Supplier Performance
- Each supplier shows total motorcycles supplied
- Rating system helps track reliability
- View complete history of supplied motorcycles

### Managing Suppliers
- Edit supplier information as needed
- Update ratings based on performance
- Cannot delete suppliers with associated motorcycles

---

## Customer Management

### Adding a Customer

1. Click **"Customers"** in sidebar
2. Click **"Add Customer"** button
3. Fill in the form:
   - **Full Name:** Customer's complete name
   - **Phone:** Contact number
   - **Email:** Email address (optional)
   - **ID Type:** Select type (NIDA, Passport, etc.)
   - **ID Number:** Identification number
   - **Address:** Physical address
   - **City:** City of residence
   - **Region:** Region/State
   - **Occupation:** Customer's occupation
   - **Notes:** Additional information
4. Click **"Create"**

### Customer Records
- View all customer information
- Track purchase history
- Search customers by name, phone, or ID number
- Cannot delete customers with purchase history

### Privacy & Security
- Customer data is confidential
- Only authorized staff can access customer information
- Regular backups protect customer data

---

## Contracts

### Types of Contracts
1. **Purchase Contracts:** Between MR PIKIPIKI and suppliers
2. **Sales Contracts:** Between MR PIKIPIKI and customers

### Viewing Contracts
1. Click **"Contracts"** in sidebar
2. Filter by type: All, Purchase, or Sales
3. View contract details in the table

### Contract Features
- **Auto-generated Contract Numbers:** Unique identifier for each contract
- **Contract Details:** Complete transaction information
- **PDF Generation:** Download printable contracts
- **Print Tracking:** Track who printed each contract

### Downloading a Contract
1. Find the contract in the list
2. Click the **Download icon**
3. PDF will be downloaded to your computer
4. Print the contract for signing

### Contract Status
- **Draft:** Not yet finalized
- **Active:** Currently in effect
- **Completed:** Transaction completed
- **Cancelled:** Contract cancelled

---

## Transport & Delivery

**Access:** Transport team (Gidion & Joshua), Admin

### Scheduling a Delivery

1. Click **"Transport"** in sidebar
2. Click **"Schedule Transport"** button
3. Fill in the form:
   - **Motorcycle:** Select from sold motorcycles
   - **Customer:** Select customer
   - **Driver:** Assign driver (Gidion or Joshua)
   - **Pickup Location:** Where to collect (default: shop)
   - **Delivery Location:** Customer's address
   - **Scheduled Date:** Planned delivery date
   - **Transport Cost:** Delivery fee
   - **Notes:** Special instructions
4. Click **"Schedule"**

### Delivery Status
- **Pending:** Scheduled, not yet started
- **In Transit:** Currently being delivered
- **Delivered:** Successfully delivered
- **Cancelled:** Delivery cancelled

### Completing a Delivery
1. Find the transport record
2. Click **"Mark as Delivered"** icon
3. Confirm completion
4. Motorcycle status automatically updates to "Sold"

### Best Practices
- Schedule deliveries in advance
- Confirm customer availability
- Update status in real-time
- Record any delivery issues in notes

---

## Repairs & Maintenance

**Access:** Mechanic (Dito), Admin

### Adding a Repair Job

1. Click **"Repairs"** in sidebar
2. Click **"Add Repair"** button
3. Fill in the form:
   - **Motorcycle:** Select motorcycle
   - **Mechanic:** Assign mechanic (usually Dito)
   - **Repair Type:** Select category
     - Routine Maintenance
     - Engine Repair
     - Body Repair
     - Electrical
     - Other
   - **Description:** Detailed repair description
   - **Start Date:** When repair begins
   - **Labor Cost:** Cost of labor
   - **Notes:** Additional information
4. Click **"Create"**

### Repair Status
- **Pending:** Scheduled, not started
- **In Progress:** Currently being repaired
- **Completed:** Repair finished
- **Cancelled:** Repair cancelled

### Completing a Repair
1. Find the repair record
2. Click **"Mark as Completed"** icon
3. Confirm completion
4. Motorcycle returns to "In Stock" status

### Tracking Costs
- **Labor Cost:** Mechanic's work charge
- **Spare Parts:** Add parts used and costs
- **Total Cost:** Automatically calculated
- Use Reports module to analyze repair expenses

### Maintenance Schedule
- Keep regular maintenance records
- Track recurring issues
- Monitor repair costs per motorcycle
- Identify high-maintenance units

---

## Reports

**Access:** Admin, Sales team

### Available Reports

#### 1. Sales Report
- Comprehensive sales data
- Revenue and profit analysis
- Customer information
- Date range filtering
- **Export:** Excel or View online

#### 2. Inventory Report
- Current stock status
- Motorcycle details
- Supplier information
- Stock valuation
- **Export:** Excel or View online

#### 3. Supplier Performance
- Supplier statistics
- Supply history
- Performance ratings
- Comparison data

#### 4. Transport Report
- Delivery tracking
- Transport costs
- Driver performance
- On-time delivery rates

#### 5. Repair Costs Report
- Maintenance expenses
- Parts and labor breakdown
- Mechanic workload
- Cost trends

#### 6. Profit Report (Admin Only)
- Detailed profit analysis
- Revenue vs. expenses
- Net profit calculation
- Profit margins
- Comprehensive financial overview

### Generating Reports

1. Click **"Reports"** in sidebar
2. Set date range (Start Date and End Date)
3. Choose a report type
4. Click **"Excel"** to download or **"View"** to see online
5. Save the file to your computer

### Best Practices
- Generate reports monthly for review
- Compare month-to-month performance
- Share relevant reports with management
- Use reports for business decisions

---

## User Management

**Access:** Admin only

### Adding a New User

1. Click **"Users"** in sidebar
2. Click **"Add User"** button
3. Fill in the form:
   - **Username:** Unique login name
   - **Password:** Initial password
   - **Full Name:** User's complete name
   - **Role:** Select appropriate role
   - **Email:** Email address (optional)
   - **Phone:** Contact number (optional)
   - **Active User:** Check to activate
4. Click **"Create"**

### User Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full system access, all modules |
| **Sales** | Motorcycles, Suppliers, Customers, Contracts, Reports |
| **Registration** | Motorcycles (registration info), Documents |
| **Secretary** | Customers, Contracts (viewing and printing) |
| **Transport** | Transport module, delivery tracking |
| **Mechanic** | Repairs module, maintenance tracking |
| **Staff** | Dashboard, limited viewing access |

### Managing Users

**Editing a User:**
1. Find user in the list
2. Click **Edit icon**
3. Modify information (password optional)
4. Click **"Update"**

**Deactivating a User:**
1. Edit the user
2. Uncheck "Active User"
3. User cannot log in but data is preserved

**Deleting a User:**
1. Click **Delete icon**
2. Confirm deletion
3. ⚠️ Use with caution - this cannot be undone!

### Security Tips
- Use strong passwords
- Change passwords regularly
- Deactivate users who leave the company
- Review user access periodically
- Never share passwords

---

## Common Tasks

### Daily Operations

**Sales Staff (Shedrack & Matrida):**
1. Check dashboard for new day
2. Add new motorcycles when they arrive
3. Create customer records for buyers
4. Generate sales contracts
5. Update motorcycle status to "Sold"

**Registration Staff (Rama):**
1. Update registration numbers
2. Track registration progress
3. Update motorcycle documentation

**Secretary (Rehema):**
1. Print contracts for signing
2. Archive signed contracts
3. Maintain customer files

**Transport Team (Gidion & Joshua):**
1. Check scheduled deliveries
2. Update delivery status
3. Complete deliveries
4. Report any issues

**Mechanic (Dito):**
1. Review pending repairs
2. Update repair status
3. Record parts used
4. Complete repairs

### Monthly Tasks

**Admin:**
1. Generate all reports
2. Review performance metrics
3. Check user activity
4. Backup database
5. Review and approve expenses

---

## Troubleshooting

### Cannot Login
- Check username and password (case-sensitive)
- Ensure account is active
- Contact admin if forgotten password

### Page Not Loading
- Check internet connection
- Refresh the browser (F5)
- Clear browser cache
- Contact IT support

### Cannot Save Data
- Check all required fields are filled
- Ensure valid data format
- Check for duplicate entries (chassis numbers, ID numbers)
- Contact admin if persists

### PDF Download Not Working
- Allow pop-ups in your browser
- Check download folder
- Try a different browser
- Contact IT support

---

## Contact & Support

**Business Location:**  
MR PIKIPIKI TRADING  
Dar es Salaam, Ubungo Riverside-Kibangu

**Technical Support:**  
Contact your system administrator

**Training:**  
Request additional training from management if needed

---

## Tips for Success

✅ **Log out** when leaving your workstation  
✅ **Save frequently** when entering data  
✅ **Double-check** important information before saving  
✅ **Use notes fields** to record important details  
✅ **Generate reports** regularly to track performance  
✅ **Keep passwords** secure and confidential  
✅ **Report issues** immediately to IT support  
✅ **Backup important** data regularly  

---

**Version 1.0** - Updated October 2024  
**MR PIKIPIKI TRADING Management System**


