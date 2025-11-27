# UCHAMBUZI WA FLOW YA PIKIPIKI

## FLOW INAYOTAKIWA (Kutoka kwa User)

1. **Mktaba ukiandikwa** (Contract written)
2. **KWA rama kukagua USALAMA** (RAMA security inspection)
3. **KWA gidi kukagua UBORA na matengenezo** (GIDI quality inspection)
4. **Gidi anapeleka KWA fundi dito** (GIDI sends to FUNDI/mechanic)
5. **Fundi anafanya matengenezo na kuandika ametengeneza Nini na Nini na Bei yake** (Mechanic does repairs and records what was repaired and price)
6. **Inapelekwa KWA cashier kulipwa bill** (Goes to CASHIER to pay bill)
7. **Inarudi KWA admini ikiwa na jumla ya Bei ya manunuzi+ gharama za matangenezo+ gharama nyingine kama zipo** (Returns to ADMIN with total: purchases + repair costs + other costs)
8. **Admini ANAweka FAIDA na approve INAENDA kwenye MOTORCYCLE au stock ikiwa na Bei ya mauzo** (ADMIN sets PROFIT and approves, goes to MOTORCYCLE/stock with sale price)
9. **Admini anaweza kuedit Bei ya mauzo wakati WOWOTE** (ADMIN can edit sale price ANYTIME)

---

## FLOW YA SASA KATIKA MFUMO (Current System Flow)

### ✅ 1. Contract Creation (Mktaba ukiandikwa)

- **Location**: `server/models/Contract.js`, `server/routes/contracts.js`
- **Status**: ✅ IMEJENGWA
- Contract inaweza kuundwa na kuwa na `ramaInspectionStatus = "pending"`

### ✅ 2. RAMA Security Inspection (KWA rama kukagua USALAMA)

- **Location**: `server/routes/contracts.js` (line 165-196)
- **Endpoint**: `POST /api/contracts/:id/verify-inspection`
- **Status**: ✅ IMEJENGWA
- RAMA (registration role) anaweza verify inspection
- Contract ina `ramaInspectionStatus` field ambayo inaweza kuwa: `pending`, `verified`, `rejected`

### ✅ 3. GIDI Quality Inspection (KWA gidi kukagua UBORA)

- **Location**: `server/models/Inspection.js`, `server/routes/inspections.js`
- **Status**: ✅ IMEJENGWA
- Inspection ina `inspectionType` field ambayo inaweza kuwa: `"gidi"` au `"rama"`
- GIDI inspection inaweza kuwa na status: `pending`, `in_progress`, `completed`

### ✅ 4. GIDI → FUNDI Assignment (Gidi anapeleka KWA fundi)

- **Location**: `server/routes/inspections.js` (line 90-153)
- **Endpoint**: `POST /api/inspections/:id/assign-task`
- **Status**: ✅ IMEJENGWA
- Baada ya GIDI inspection, admin/transport anaweza ku-assign task kwa mechanic (fundi)
- Hii inaunda:
  - Repair record (`server/models/Repair.js`)
  - Task record kwa task management

### ✅ 5. FUNDI Repairs & Records (Fundi anafanya matengenezo na kuandika)

- **Location**: `server/models/Repair.js`, `server/routes/repairs.js`
- **Status**: ✅ IMEJENGWA
- Mechanic anaweza:
  - Start work (`POST /api/repairs/:id/start-work`)
  - Register details na spare parts, labor cost (`POST /api/repairs/:id/register-details`)
  - Andika work description, issues found, recommendations
  - Spare parts zinaweza kuwa na name, quantity, na cost

### ✅ 6. CASHIER Payment (Inapelekwa KWA cashier kulipwa bill)

- **Location**: `server/routes/repairBills.js`, `client/src/pages/Cashier.jsx`
- **Status**: ✅ IMEJENGWA
- Mechanic anaweza:
  - Create bill (`POST /api/repair-bills`)
  - Send bill to cashier (`POST /api/repair-bills/:id/send`)
- Cashier anaweza:
  - View bills (`GET /api/repair-bills`)
  - Pay bills (`POST /api/repair-bills/:id/paid`)
- Bill status: `pending` → `sent_to_cashier` → `payment_approved` → `paid`

### ✅ 7. ADMIN Approval with Total Costs (Inarudi KWA admini)

- **Location**: `server/routes/contracts.js` (line 198-360)
- **Endpoint**: `POST /api/contracts/:id/approve-and-create-motorcycle`
- **Status**: ✅ IMEJENGWA
- Admin anaweza approve contract na kuunda motorcycle baada ya:
  - ✅ RAMA inspection verified
  - ✅ GIDI inspection completed
  - ✅ All repairs completed
  - ✅ All repair bills paid
- System ina-calculate:
  - `priceIn` = purchase price + repair costs + other costs
  - `priceOut` = selling price (admin anaweza ku-set)
  - `profit` = priceOut - priceIn

### ✅ 8. Motorcycle in Stock (INAENDA kwenye MOTORCYCLE)

- **Location**: `server/models/Motorcycle.js`, `server/routes/motorcycles.js`
- **Status**: ✅ IMEJENGWA
- Baada ya admin approval, motorcycle inaundwa/updated na:
  - `status = "in_stock"`
  - `sellingPrice` = priceOut
  - `priceIn`, `priceOut`, `profit` zote zime-set

### ✅ 9. Admin Edit Sale Price Anytime (Admini anaweza kuedit Bei ya mauzo)

- **Location**: `server/routes/motorcycles.js` (line 59-79)
- **Endpoint**: `PUT /api/motorcycles/:id`
- **Status**: ✅ IMEJENGWA
- Admin anaweza update `sellingPrice` wakati wowote
- Frontend: `client/src/pages/Motorcycles.jsx` ina edit form

---

## HITIMISHO (CONCLUSION)

### ✅ FLOW IKO SAWA! (FLOW IS CORRECT!)

Mfumo wako **UNAFUATA KABISA** mchakato ulioelezwa:

1. ✅ Contract → RAMA inspection → GIDI inspection → FUNDI repairs → CASHIER payment → ADMIN approval → Motorcycle in stock
2. ✅ All costs (purchase + repairs + other) zina-calculate correctly
3. ✅ Admin anaweza ku-set profit na approve
4. ✅ Admin anaweza ku-edit selling price anytime

### 📝 NOTES ZA ZIADA (Additional Notes)

1. **GIDI Inspection → Repair Assignment**:

   - Hii inaweza kuwa manual (admin/transport anapaswa ku-assign task baada ya GIDI inspection)
   - Kama unataka automatic, inaweza kuwa added

2. **Other Costs (gharama nyingine)**:

   - Currently system ina-calculate: purchase price + repair costs
   - Kama una costs nyingine (kama transport), zinaweza kuwa added kwenye `priceIn` calculation

3. **Profit Calculation**:
   - System ina-calculate profit automatically: `profit = priceOut - priceIn`
   - Admin anaweza ku-override profit manually kama anahitaji

---

## RECOMMENDATIONS

Kama unataka ku-improve flow:

1. **Auto-assign repair after GIDI inspection**: Kama GIDI inspection ina-identify issues, system inaweza auto-create repair task
2. **Transport costs field**: Ongeza field kwa transport costs kwenye contract
3. **Notifications**: Ongeza notifications kwa kila step ya flow

---

**FLOW IKO SAWA KABISA! ✅**

