# Repair Workflow Implementation - Complete Guide

## New Repair Workflow

### Old Flow:
```
Create Repair → (Approval) → In Progress → Complete
```

### New Flow:
```
1. Create Repair Request (no costs) → (Approval if costs) → Assigned
2. Mechanic starts work → Status: In Progress
3. Mechanic registers details (parts, labor, costs) → Status: Awaiting Details Approval
4. Details approved (Sales → Admin) → Status: Details Approved
5. Mechanic marks complete → Status: Completed → Motorcycle: In Stock
```

## New Status Values

| Status | Description | Who Can Set | Actions Available |
|--------|-------------|-------------|-------------------|
| `pending` | Initial state | System | Start Work |
| `in_progress` | Mechanic working | Mechanic | Register Details |
| `awaiting_details_approval` | Details submitted | System | View Status |
| `details_approved` | Details approved by admin | System | Mark Complete |
| `completed` | Work finished | Mechanic | View Only |
| `cancelled` | Cancelled | Admin/Mechanic | - |

## New Action Buttons in Repairs Table

### For Status: `pending`
- **▶️ Start Work** (Play button) - Changes status to `in_progress`

### For Status: `in_progress`
- **📝 Register Details** (Clipboard button) - Opens details form

### For Status: `awaiting_details_approval`
- **🕐 Awaiting Approval** (Clock) - Disabled, shows waiting message
- **👁️ View Details** (Eye) - View submitted details

### For Status: `details_approved`
- **✅ Mark Complete** (Check Circle) - Completes the repair

### For Status: `completed`
- **✓ Completed** (Badge) - No actions

## Register Details Form Fields

```javascript
{
  // Parts Used
  spareParts: [{
    name: String,        // e.g., "Engine Oil"
    quantity: Number,    // e.g., 1
    cost: Number        // e.g., 25000
  }],
  
  // Labor Information
  laborHours: Number,    // e.g., 4.5 hours
  laborCost: Number,     // e.g., 50000 TZS
  
  // Work Details
  workDescription: String,   // What was done
  issuesFound: String,       // Problems discovered
  recommendations: String    // Future recommendations
}
```

## API Endpoints Added

### Register Repair Details
```
POST /api/repairs/:id/register-details
Auth: mechanic, admin
Body: {spareParts, laborCost, laborHours, workDescription, issuesFound, recommendations}
Response: {message, approval, repair}
```

Creates approval request for repair details.

## Frontend Components Needed

### 1. Repair Details Modal
Component for registering repair details with:
- Parts table (add/remove rows)
- Labor hours input
- Labor cost input
- Work description textarea
- Issues found textarea
- Recommendations textarea
- Submit for approval button

### 2. Status Change Buttons
- Start Work button
- Register Details button
- Mark Complete button

### 3. Status Badges
Updated to show all new statuses with colors:
- Pending (Yellow)
- In Progress (Blue)
- Awaiting Details Approval (Orange)
- Details Approved (Purple)
- Completed (Green)
- Cancelled (Red)

## Implementation Files

### Backend Complete ✅
- ✅ `server/models/Repair.js` - Updated with new fields
- ✅ `server/routes/repairs.js` - Added register-details endpoint
- ✅ `server/routes/approvals.js` - Updated repair_edit handling

### Frontend Needed
- ⏳ `client/src/pages/Repairs.jsx` - Add new buttons and modal
- ⏳ Status badge updates
- ⏳ Action button logic

## Usage Example

### Mechanic Workflow:

**Step 1: Start Work**
```
1. Go to Repairs page
2. See repair with "Pending" status
3. Click ▶️ "Start Work" button
4. Status changes to "In Progress"
5. Start working on motorcycle
```

**Step 2: Register Details**
```
1. After work is done
2. Click 📝 "Register Details"
3. Fill in form:
   - Add parts used (oil, filter, etc.)
   - Enter labor hours (e.g., 4.5)
   - Enter labor cost (e.g., 50000)
   - Describe work done
   - Note any issues found
   - Add recommendations
4. Click "Submit for Approval"
5. Status changes to "Awaiting Details Approval"
6. Creates approval request
```

**Step 3: Wait for Approval**
```
1. Check "My Requests" page
2. See repair details approval status
3. Wait for Sales → Admin approval
```

**Step 4: Mark Complete**
```
1. After approval, status becomes "Details Approved"
2. Click ✅ "Mark Complete"
3. Status changes to "Completed"
4. Motorcycle status changes to "In Stock"
5. Completion date recorded
```

## Benefits

### For Mechanics:
- ✅ Start work without approval (if no initial costs)
- ✅ Register actual parts used and time spent
- ✅ Document work properly
- ✅ Submit costs for approval after work
- ✅ Clear workflow steps

### For Management:
- ✅ Track actual costs vs estimates
- ✅ Approve actual expenses
- ✅ See detailed work descriptions
- ✅ Better audit trail
- ✅ Know what issues were found

### For Business:
- ✅ Better cost control
- ✅ Detailed repair history
- ✅ Professional documentation
- ✅ Parts inventory tracking (future)
- ✅ Labor time tracking

## Next Implementation Steps

1. ✅ Update Repair model - DONE
2. ✅ Add register-details API endpoint - DONE
3. ✅ Update approval handling - DONE
4. ⏳ Update Repairs.jsx frontend - IN PROGRESS
5. ⏳ Add repair details modal
6. ⏳ Add action buttons
7. ⏳ Update status badges
8. ⏳ Test complete workflow

---

**Backend is ready! Now implementing frontend...**

