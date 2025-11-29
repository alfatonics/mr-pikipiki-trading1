# Feature: Sales Contract Approval Workflow

## Maelezo ya Feature

Baada ya sales contract kuandikwa, inaenda moja kwa moja kwa admin kwa ajili ya approval. Baada ya approval:

1. Pikipiki inakuwa "sold" kwenye stock
2. Faida inahesabika automatically kutoka bei ya stock na bei ya mauzo
3. Kama kuna deni, inaenda moja kwa moja kwa cashier (Loan record inatengenezwa)
4. Taarifa za mnunuzi (customer) zinatunzwa kwa ajili ya "top buyer" analytics

## Workflow

### 1. Sales Contract Inatengenezwa

- Secretary/Sales/Admin anaandika sales contract
- Contract ina taarifa za:
  - Customer (mnunuzi)
  - Motorcycle (kutoka stock)
  - Bei ya mauzo
  - Kiasi kilicholipwa
  - Deni lililob remain (kama lipo)

### 2. Admin Anaapprove Sales Contract

- Admin anaona sales contracts kwenye Contracts page
- Button ya **"Approve Sales Contract"** inaonekana kwa sales contracts
- Admin anabofya button

### 3. Automatic Actions Baada ya Approval

#### a) **Motorcycle Status → "Sold"**

```sql
UPDATE motorcycles
SET status = 'sold',
    customer_id = [customer_id],
    sale_date = CURRENT_DATE,
    selling_price = [sale_price],
    price_out = [sale_price],
    profit = [sale_price - cost]
WHERE id = [motorcycle_id];
```

#### b) **Profit Calculation**

```javascript
const motorcycleCost = motorcycle.priceIn || motorcycle.totalCost;
const salePrice = contract.amount;
const profit = salePrice - motorcycleCost;
```

#### c) **Customer Purchase History**

```sql
UPDATE customers
SET total_purchases = total_purchases + 1,
    total_spent = total_spent + [sale_price],
    last_purchase_date = CURRENT_DATE
WHERE id = [customer_id];
```

#### d) **Loan Record (Kama Kuna Deni)**

```javascript
if (remainingBalance > 0) {
  await Loan.create({
    customerId: customer_id,
    motorcycleId: motorcycle_id,
    contractId: contract_id,
    totalAmount: salePrice,
    amountPaid: amountPaid,
    remainingBalance: remainingBalance,
    status: "active",
    notes: "Deni kutoka mauzo ya pikipiki",
  });
}
```

#### e) **Finance Transaction**

```javascript
await FinanceTransaction.create({
  type: "income",
  category: "motorcycle_sale",
  amount: amountPaid, // Only what was paid
  description: `Mauzo ya pikipiki ${motorcycle.brand} ${motorcycle.model}`,
  paymentMethod: contract.paymentMethod,
  motorcycleId: motorcycle_id,
  customerId: customer_id,
  contractId: contract_id,
});
```

#### f) **Contract Status → "Completed"**

```sql
UPDATE contracts
SET status = 'completed'
WHERE id = [contract_id];
```

## Database Changes

### 1. Customer Tracking Fields

```sql
-- Migration: migrate-add-customer-purchase-tracking.js
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_purchase_date DATE;

-- Indexes
CREATE INDEX idx_customers_total_spent ON customers(total_spent DESC);
CREATE INDEX idx_customers_total_purchases ON customers(total_purchases DESC);
CREATE INDEX idx_customers_last_purchase_date ON customers(last_purchase_date DESC);
```

## Code Changes

### Backend Changes

1. **server/routes/contracts.js**

   - Imeongezwa endpoint: `POST /api/contracts/:id/approve-sales-contract`
   - Endpoint inafanya:
     - Validation (contract type, motorcycle status, customer info)
     - Calculate profit
     - Update motorcycle status to "sold"
     - Update customer purchase history
     - Create loan record (if balance exists)
     - Create finance transaction
     - Update contract status to "completed"

2. **server/models/Customer.js**
   - Imeongezwa fields: `totalSpent`, `lastPurchaseDate`
   - Zinasomwa kwenye `findById()` na `findAll()` methods

### Frontend Changes

1. **client/src/pages/Contracts.jsx**
   - Imeongezwa button ya **"Approve Sales Contract"** kwa sales contracts
   - Imeongezwa function `handleApproveSalesContract()`
   - Button inaonekana tu kwa:
     - Admin users
     - Sales contracts
     - Contracts ambazo status si "completed"

## API Endpoint

### Approve Sales Contract

```http
POST /api/contracts/:id/approve-sales-contract
Authorization: Bearer [admin_token]
```

**Response:**

```json
{
  "message": "Sales contract approved successfully",
  "contract": { ... },
  "motorcycle": { ... },
  "loan": { ... } | null,
  "profit": 1500000,
  "amountPaid": 3000000,
  "remainingBalance": 0 | 500000
}
```

## Top Buyer Analytics

### Query za Kuona Top Buyers

#### 1. Top Buyers by Total Spent

```sql
SELECT
  id,
  full_name as "fullName",
  phone,
  total_purchases as "totalPurchases",
  total_spent as "totalSpent",
  last_purchase_date as "lastPurchaseDate"
FROM customers
WHERE total_purchases > 0
ORDER BY total_spent DESC
LIMIT 10;
```

#### 2. Top Buyers by Number of Purchases

```sql
SELECT
  id,
  full_name as "fullName",
  phone,
  total_purchases as "totalPurchases",
  total_spent as "totalSpent",
  last_purchase_date as "lastPurchaseDate"
FROM customers
WHERE total_purchases > 0
ORDER BY total_purchases DESC, total_spent DESC
LIMIT 10;
```

#### 3. Recent Buyers

```sql
SELECT
  id,
  full_name as "fullName",
  phone,
  total_purchases as "totalPurchases",
  total_spent as "totalSpent",
  last_purchase_date as "lastPurchaseDate"
FROM customers
WHERE last_purchase_date IS NOT NULL
ORDER BY last_purchase_date DESC
LIMIT 10;
```

## Mfano wa Matumizi

### Scenario: Mnunuzi Ananunua Pikipiki

**1. Contract Details:**

- Customer: John Doe
- Motorcycle: Honda CB 150R (Stock Price: TZS 3,000,000)
- Sale Price: TZS 3,500,000
- Amount Paid: TZS 2,500,000
- Remaining Balance: TZS 1,000,000

**2. Admin Anaapprove:**

- Admin anabofya "Approve Sales Contract"
- System inafanya:

**3. Results:**

```
✅ Motorcycle Status: SOLD
✅ Profit: TZS 500,000 (3,500,000 - 3,000,000)
✅ Customer Records Updated:
   - Total Purchases: 1
   - Total Spent: TZS 3,500,000
   - Last Purchase: 2025-11-29
✅ Loan Created: TZS 1,000,000 (Sent to cashier)
✅ Finance Transaction: TZS 2,500,000 (Income)
✅ Contract Status: COMPLETED
```

## Cashier Interface

Cashier anaweza kuona loans kwenye `Loans` page:

- Loans with status "active" zinaonekana
- Cashier anaweza kutrack payments
- Kila payment inaongeza `amountPaid` na kupunguza `remainingBalance`

## Faida (Benefits)

1. **Automated Process**: Hakuna manual updates za motorcycle status
2. **Accurate Profit Calculation**: Faida inahesabika moja kwa moja
3. **Debt Management**: Loans zinaenda automatic kwa cashier
4. **Customer Analytics**: Top buyers wanaonekana wazi
5. **Audit Trail**: Kila transaction ina record
6. **Finance Tracking**: Income zinaandikwa automatic

## Testing

Ili kutest feature hii:

1. Login kama Sales/Secretary
2. Unda sales contract kwa pikipiki iliyoko kwenye stock
3. Jaza taarifa zote (customer, bei, kilicholipwa, deni)
4. Login kama Admin
5. Nenda Contracts page
6. Bofya "Approve Sales Contract"
7. Angalia:
   - Motorcycle status = "sold"
   - Customer purchase history updated
   - Loan record created (if balance > 0)
   - Contract status = "completed"
8. Nenda Loans page
9. Angalia loan record inaonekana
10. Nenda Customers page
11. Angalia customer stats updated

## Future Enhancements

1. **Sales Dashboard**: Ongeza dashboard ya sales statistics
2. **Customer Loyalty Program**: Bonus kwa top buyers
3. **Payment Reminders**: Notifications kwa customers wenye deni
4. **Sales Reports**: Detailed reports by period, customer, etc.
5. **Multi-currency Support**: Bei kwa currency tofauti
