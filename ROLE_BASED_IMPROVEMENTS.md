# Role-Based System Improvements

## Overview
This document outlines improvements to make the system more role-specific and user-friendly.

---

## 1. Repair Workflow Enhancement

### Current Flow:
```
Mechanic creates repair → Approval → Motorcycle status changes
```

### Improved Flow:
```
1. Mechanic creates repair request (no costs yet)
2. Admin assigns repair
3. Mechanic works on repair
4. Mechanic registers repair details (parts used, labor hours, costs)
5. Repair details → Approval (Sales → Admin)
6. After approval → Mechanic marks complete
7. Motorcycle status changes to "In Stock"
```

### New Components Needed:
- **"Add Repair Details" button** in Repairs table for in-progress repairs
- **Repair details registration form** (parts, labor cost, actual work done)
- **"Mark Complete" button** for approved repairs
- **"My Repairs" sidebar** for mechanics to see their assigned repairs

---

## 2. Role-Based Dashboards

### Admin Dashboard:
- Total motorcycles (all statuses)
- Sales statistics
- Purchase statistics
- Revenue & Profit
- Pending approvals count
- Repairs status
- Transport status
- All users activity

### Sales Dashboard:
- In-stock motorcycles count
- Sales this month
- Revenue this month
- Pending contracts
- Customer list
- Pending approvals (their review queue)
- Top selling models

### Mechanic Dashboard:
- **My assigned repairs** (pending, in progress)
- **My completed repairs** this month
- **Parts used** this month
- **Labor hours** logged
- **Pending approval** for repair details
- Motorcycles in repair
- Tools/parts inventory (future)

### Registration Dashboard:
- Motorcycles needing registration
- Pending registrations
- Completed registrations this month
- Documents pending

### Transport Dashboard:
- **My assigned deliveries** (pending, in transit)
- **Completed deliveries** this month
- Motorcycles in transit
- Delivery schedule
- Customer locations

### Secretary Dashboard:
- Contracts to print
- Printed contracts
- Customer inquiries
- Document archive status

### Staff Dashboard:
- General overview
- Tasks assigned
- Notifications

---

## 3. Mechanic-Specific Features

### "My Repairs" Page:
Shows mechanics only their assigned repairs with:
- Repair status
- Motorcycle details
- Customer expectations
- Deadline
- Parts needed
- Actions (Start, Add Details, Mark Complete)

### Repair Detail Registration:
Form to capture:
- Parts used (name, quantity, cost)
- Labor hours
- Labor cost
- Work description
- Issues found
- Recommendations
- Photos (future)

### Completion Workflow:
1. Mechanic clicks "Add Details"
2. Fills in parts, labor, costs
3. Submits for approval
4. After approval, "Mark Complete" button appears
5. Clicks complete
6. Motorcycle status → In Stock
7. Repair marked completed

---

## 4. Implementation Priority

### Phase 1 (High Priority):
✅ Role-based dashboard data filtering
✅ Mechanic dashboard
✅ "My Repairs" view for mechanics

### Phase 2 (Medium Priority):
- Repair details registration
- Mechanic completion workflow
- Sales dashboard customization
- Transport dashboard

### Phase 3 (Low Priority):
- Secretary dashboard
- Registration dashboard
- Staff dashboard
- Advanced analytics

---

## 5. Database Changes Needed

### Repair Model Enhancement:
```javascript
{
  // Existing fields...
  
  // New fields:
  assignedTo: ObjectId (ref: User) // mechanic assigned
  detailsRegistered: Boolean,
  detailsApprovalId: ObjectId (ref: Approval),
  actualLaborHours: Number,
  completedBy: ObjectId (ref: User),
  completedAt: Date,
  customerSignature: String, // future
  mechanicNotes: String
}
```

### Dashboard Settings Model (Future):
```javascript
{
  userId: ObjectId,
  role: String,
  widgets: [String], // which widgets to show
  layout: Object // custom layout
}
```

---

## 6. UI Changes

### Repairs Page for Mechanics:
- Filter: "My Repairs" (default)
- Actions: Start Work, Add Details, Mark Complete
- Status indicators: Assigned, In Progress, Awaiting Approval, Completed

### Dashboard Customization:
- Role-specific cards
- Relevant statistics only
- Quick actions based on role

---

## IMPLEMENTATION NOTES:

Given the scope, I'll implement:
1. **Mechanic-specific dashboard** (most critical)
2. **Role-based dashboard data** (filter by role)
3. **Basic structure** for future enhancements

The full repair details workflow requires more time but the structure will be in place.

---

