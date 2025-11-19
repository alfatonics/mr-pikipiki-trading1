# MR PIKIPIKI TRADING – SYSTEM DOCUMENTATION

## Table of Contents

1. Overview
2. Architecture
3. Backend Services
4. Frontend Application
5. Core Modules & Workflows
6. Database Schema
7. API Reference
8. Frontend Routes & Components
9. Deployment & Environment
10. Future Enhancements

---

## 1. Overview

The MR Pikipiki Trading platform is an end-to-end operations system for a motorcycle trading business. It manages:

- Supplier and customer relationships
- Motorcycle inventory, contracts, repairs, inspections
- Task assignments, finance transactions, bills, notifications
- Mechanic workflows and communication

Tech Stack:

- **Frontend:** React + Vite, TailwindCSS, react-router, axios
- **Backend:** Node.js, Express, PostgreSQL (Neon), pg
- **Auth:** JWT (with refresh tokens)
- **File Uploads:** multer (stored under `/server/uploads`)

---

## 2. Architecture

```plaintext
Client (React)
  └── axios -> Express API -> PostgreSQL
                     ├── Task Service
                     ├── Finance Service
                     ├── Repair Service
                     ├── Messaging Service
                     ├── Reporting Service
                     └── Authentication & Authorization
```

Key architectural points:

- RESTful API organized by domain (`/api/tasks`, `/api/finance`, etc.).
- Role-based access (`admin`, `sales`, `mechanic`, `cashier`, `transport`, etc.).
- Modular backend structure: models, routes, middleware.
- Frontend uses context providers for auth and notifications.

---

## 3. Backend Services

### 3.1 Directory Structure

```
server/
├── app.js
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── models/
│   ├── User.js
│   ├── Motorcycle.js
│   ├── Repair.js
│   ├── Task.js
│   ├── RepairBill.js
│   ├── Message.js
│   ├── FinanceTransaction.js
│   └── Inspection.js
├── routes/
│   ├── auth.js
│   ├── tasks.js
│   ├── repairBills.js
│   ├── mechanicReports.js
│   ├── finance.js
│   ├── repairs.js
│   ├── inspections.js
│   ├── messages.js
│   └── ...
└── database/
    ├── schema.sql
    └── migrate-*.js
```

### 3.2 Key Services

| Service      | Responsibility               | Routes                  |
| ------------ | ---------------------------- | ----------------------- |
| Auth         | Login, refresh, user roles   | `/api/auth`             |
| Users        | CRUD & role lookup           | `/api/users`            |
| Motorcycles  | Inventory, costs             | `/api/motorcycles`      |
| Tasks        | Assignments (Gidion -> Dito) | `/api/tasks`            |
| Repairs      | Mechanic jobs & details      | `/api/repairs`          |
| Repair Bills | Mechanic → Cashier bills     | `/api/repair-bills`     |
| Finance      | Cashier transactions         | `/api/finance`          |
| Reports      | Mechanic dashboards & KPIs   | `/api/mechanic-reports` |
| Messages     | Internal messaging           | `/api/messages`         |
| Inspections  | Pre-shipment checks          | `/api/inspections`      |

---

## 4. Frontend Application

### 4.1 Directory Structure

```
client/src/
├── App.jsx
├── components/
│   ├── Layout.jsx
│   ├── QuickActions.jsx
│   ├── Card.jsx, Button.jsx, Modal.jsx, ...
├── context/
│   └── AuthContext.jsx, NotificationContext.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── MechanicDashboard.jsx
│   ├── MechanicReports.jsx
│   ├── Tasks.jsx
│   ├── MyJobs.jsx
│   ├── Cashier.jsx
│   ├── Messages.jsx
│   ├── Contracts.jsx
│   ├── ContractForms.jsx
│   ├── InspectionForm.jsx
│   └── ...
└── utils/, hooks/, assets/
```

### 4.2 Routing & Layout

- `App.jsx` configures routes using `react-router-dom`.
- `Layout.jsx` includes sidebar navigation & top bar.
- Role-based menus defined in `Layout.jsx` → menu items filtered by user role.

---

## 5. Core Modules & Workflows

### 5.1 Task Management (Gidion → Dito)

1. Inspection completed → `/api/inspections/:id/assign-task`
2. Creates repair record + task for mechanic (Dito).
3. Task statuses: `pending`, `in_progress`, `completed` (mirrors repair status).
4. Frontend page: `/tasks` (Admins & transport).

### 5.2 Mechanic Workflow

Steps:

1. View assigned jobs (`/my-jobs`).
2. Start work → status `in_progress`.
3. Register details with spare parts, labor, proof upload.
4. System submits for approval → status `awaiting_details_approval`.
5. Once approved → send bill → cashier.
6. After payment → mark job complete.

### 5.3 Bill Submission & Finance Integration

- Mechanic submits bill (labor + spare parts cost).
- Backend auto-generates bill number, stores proof.
- Send to cashier → cashier sees under `/cashier`.
- When paid, motorcycle `maintenance_cost` & `total_cost` updates.

### 5.4 Messaging

- 1-to-1 internal messaging.
- Inbox / Sent view, mark-as-read, priorities.

### 5.5 Reporting & Dashboards

- Mechanic metrics: pending/in-progress/completed, bills, payments, avg repair time.
- MechanicReports page for daily jobs, spare usage, payment status.
- Admin dashboard (default) shows global KPIs.

---

## 6. Database Schema (Key Tables)

### 6.1 Tasks

| Column                    | Type                                             | Notes                                   |
| ------------------------- | ------------------------------------------------ | --------------------------------------- |
| id                        | UUID (PK)                                        |                                         |
| task_number               | VARCHAR                                          | `TSK-2025-001`                          |
| task_type                 | ENUM                                             | `inspection`, `repair`, `delivery`, ... |
| assigned_by / assigned_to | UUID (FK)                                        | Users                                   |
| motorcycle_id             | UUID (FK)                                        | Motorcycles                             |
| inspection_id / repair_id | UUID (FK)                                        | Link back                               |
| status                    | `pending`, `in_progress`, `completed`, `overdue` |
| priority                  | `low`, `medium`, `high`, `urgent`                |

### 6.2 Repair Bills

| Column                                     | Type                                                     | Notes         |
| ------------------------------------------ | -------------------------------------------------------- | ------------- |
| bill_number                                | VARCHAR                                                  | `RB-2025-004` |
| repair_id, motorcycle_id, mechanic_id      | UUID                                                     | FK            |
| labor_cost, spare_parts_cost, total_amount | DECIMAL                                                  |               |
| proof_of_work                              | TEXT                                                     | File path     |
| status                                     | `pending`, `sent_to_cashier`, `payment_approved`, `paid` |

### 6.3 Messages

| Column                 | Type                              |
| ---------------------- | --------------------------------- |
| sender_id, receiver_id | UUID                              |
| subject, message       | TEXT                              |
| related_entity_type/id | Optional linking                  |
| is_read, read_at       | Status                            |
| priority               | `low`, `normal`, `high`, `urgent` |

### 6.4 Motorcycles (extra columns)

| Column           | Type    |
| ---------------- | ------- |
| maintenance_cost | DECIMAL |
| total_cost       | DECIMAL |

---

## 7. API Reference (Highlights)

### 7.1 Tasks

```
GET    /api/tasks?assignedTo=<userId>
POST   /api/tasks               { taskType, title, description, ... }
PUT    /api/tasks/:id           { status, assignedTo, ... }
DELETE /api/tasks/:id
```

### 7.2 Repairs

```
POST /api/repairs/:id/register-details   (multipart form-data with proofOfWork)
POST /api/repairs/:id/complete
POST /api/repairs/:id/spare-parts
```

### 7.3 Repair Bills

```
POST /api/repair-bills                  (multipart, optional proof)
POST /api/repair-bills/:id/send
POST /api/repair-bills/:id/approve
POST /api/repair-bills/:id/reject
POST /api/repair-bills/:id/paid
```

### 7.4 Mechanic Reports

```
GET /api/mechanic-reports/daily-jobs?date=YYYY-MM-DD
GET /api/mechanic-reports/pending-jobs
GET /api/mechanic-reports/completed-jobs?dateFrom&dateTo
GET /api/mechanic-reports/bills-sent?dateFrom&dateTo
GET /api/mechanic-reports/payment-status
GET /api/mechanic-reports/spare-usage?dateFrom&dateTo
```

### 7.5 Messages

```
GET  /api/messages?type=inbox|sent
POST /api/messages                  { receiverId, subject, message, priority }
POST /api/messages/:id/read
DELETE /api/messages/:id
```

---

## 8. Frontend Routes & Components

| Route                 | Component                          | Description            |
| --------------------- | ---------------------------------- | ---------------------- |
| `/`                   | `Dashboard` or `MechanicDashboard` | Role-based             |
| `/tasks`              | `Tasks`                            | Task assignment board  |
| `/my-jobs`            | `MyJobs`                           | Mechanic workflow      |
| `/mechanic-reports`   | `MechanicReports`                  | Detailed reports       |
| `/messages`           | `Messages`                         | Communication          |
| `/cashier`            | `Cashier`                          | Finance transactions   |
| `/contract-forms`     | `ContractForms`                    | Printable forms        |
| `/inspection-form`    | `InspectionForm`                   | Pre-shipment checklist |
| `/crm`                | `CRM`                              | Contacts dashboard     |
| `/mechanic-dashboard` | `MechanicDashboard`                | Mechanic KPIs          |

Shared components:

- `Card`, `Button`, `Modal`, `Input`, `Select`
- `QuickActions` (for mechanics)
- `TableWithSearch`, `StatCard`, `InventoryWidget`

---

## 9. Deployment & Environment

### 9.1 Environment Variables

Backend `.env`:

```
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=https://...
DB_SSL=true
```

Frontend `.env`:

```
VITE_API_URL=https://your-backend-url
```

### 9.2 Scripts

Backend:

```
npm install
npm run dev
npm run db:init        # applies schema.sql
node server/database/migrate-*.js  # run extra migrations
```

Frontend:

```
npm install
npm run dev
npm run build
npm run preview
```

### 9.3 Deployment Notes

- Ensure `/server/uploads` folder exists and is writable.
- Serve `/uploads` statically (already configured in `app.js`).
- For production, consider S3 or cloud storage for uploads.

---

## 10. Future Enhancements

1. **Notifications Service:** Real-time notifications (WebSocket / push).
2. **Audit Logs:** Track all critical actions.
3. **Multi-language support:** Swahili/English toggles.
4. **Mobile App:** Mechanic-focused mobile interface.
5. **Advanced Analytics:** Trends, profit margins, predictive maintenance.
6. **Role-based dashboards** for cashier, sales, transport.

---

**Document Version:** 2025-11-19  
**Maintainer:** MR PIKIPIKI TRADING Dev Team
