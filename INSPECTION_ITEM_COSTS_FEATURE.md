# Feature: Gharama za Kila Kitu Kilichotengenezwa Kutoka Ripoti ya Gideon

## Maelezo ya Feature

Baada ya Gideon kukamilisha ukaguzi wake (inspection), mechanic (Dito) anaweza sasa kujaza gharama za kila kitu kilichotengenezwa kulingana na ripoti ya Gideon. Mfumo umeongezwa na uwezo wa kuhifadhi gharama kwa kila kitu kilichofail kwenye ukaguzi.

## Workflow

### 1. Gideon Anakamilisha Ukaguzi

- Gideon anajaza fomu ya ukaguzi (Sections A, B, C)
- Anamarka vitu vyote vilivyofail
- Anaongeza maelezo ya jumla kwenye "Notes"
- Anabofya "Thibitisha Ukaguzi wa GIDIONI"

### 2. Automatic Task Creation kwa Mechanic

- Mfumo unaunda task automatically kwa mechanic (Dito)
- Task ina inspection ID na repair ID
- Mechanic anaona task kwenye "My Repair Jobs"

### 3. Mechanic Anafungua Repair Details Modal

- Mechanic anabofya "Register Details" kwenye task
- Modal inaonesha:
  - Taarifa za pikipiki
  - **Ripoti ya ukaguzi wa GIDIONI** (vitu vyote vilivyofail)
  - Toggle ya kuchagua njia ya kujaza gharama

### 4. Chagua Njia ya Kujaza Gharama

#### **Njia 1: Gharama kwa Kila Kitu (Itemized - MPYA!)**

Mechanic anachagua njia hii kama anataka kujaza gharama kwa kila kitu kilichofail.

**Maelezo:**

- Mechanic anaona orodha ya vitu vyote vilivyofail
- Kila kitu kina:
  - Checkbox ya kuthibitisha kimetengenezwa
  - Section ambayo kitu kimetoka (A, B, au C)
  - Jina la kitu
- Kwa kila kitu alichokitengeneza:
  1. **Chagua checkbox** ya "Imetengenezwa"
  2. **Ongeza vipuri** (spare parts) vilivyotumika:
     - Jina la kipuri
     - Idadi
     - Bei kwa kipuri
  3. **Jaza gharama ya kazi** (labor cost)
  4. **Ongeza maelezo zaidi** (optional)

**Mfano:**

```
✓ Brake mbele/nyuma (Imetengenezwa)
  Vipuri:
  - Brake pad front: 2 x TZS 35,000 = TZS 70,000
  - Brake pad rear: 2 x TZS 30,000 = TZS 60,000
  Gharama ya Kazi: TZS 50,000
  Jumla kwa Kitu Hiki: TZS 180,000
```

#### **Njia 2: Gharama Jumla Tu (General)**

Mechanic anachagua njia hii kama anataka kujaza gharama jumla bila kutenganisha kwa kila kitu.

**Maelezo:**

- Mechanic anaandika maelezo ya jumla ya kazi
- Anaongeza vipuri vyote vilivyotumika
- Anajaza gharama ya kazi jumla

### 5. Submit for Approval

- Baada ya kujaza gharama, mechanic anabofya "Submit for Approval"
- Gharama zinaenda kwa Sales kisha Admin kwa ajili ya kibali (approval)
- Mechanic anaweza kuona status kwenye "Awaiting Approval" tab

### 6. Baada ya Approval

- Sales na Admin wanakagua gharama
- Wakikubali, mechanic anaweza kumark repair kama "Complete"
- Pikipiki inarudi kwenye stock

## Database Changes

### Migration

- Tumekuwa na migration script: `migrate-add-inspection-item-costs.js`
- Imeongeza column mpya: `inspection_item_costs` (JSONB) kwenye `repairs` table
- Column hii inahifadhi array ya vitu vilivyotengenezwa na gharama zao

### Schema

```sql
ALTER TABLE repairs
ADD COLUMN inspection_item_costs JSONB DEFAULT '[]'::jsonb;

-- Format ya data:
-- [
--   {
--     itemKey: 'q1',
--     section: 'externalAppearance',
--     sectionName: 'A. MUONEKANO WA NJE',
--     itemLabel: 'Mkasi sawa',
--     repaired: true,
--     spareParts: [
--       { name: 'Mkasi mpya', quantity: 1, cost: 45000 }
--     ],
--     laborCost: 30000,
--     notes: 'Mkasi ulikuwa umevunjika'
--   },
--   ...
-- ]
```

## Code Changes

### Backend Changes

1. **server/models/Repair.js**

   - Imeongezwa `inspectionItemCosts` parameter kwenye `create()` method
   - Imeongezwa parsing ya `inspection_item_costs` kwenye `findById()` method
   - Imeongezwa handling ya JSONB kwenye `update()` method

2. **server/routes/repairs.js**
   - Imeongezwa parsing ya `inspectionItemCosts` kwenye `/register-details` endpoint
   - Inakokotoa gharama ya jumla kutoka itemized costs
   - Inahifadhi spare parts zote kwenye `repair_spare_parts` table

### Frontend Changes

1. **client/src/pages/MyJobs.jsx**
   - Imeongezwa state ya `inspectionItemCosts` na `useItemizedCosts`
   - Imeongezwa logic ya kutengeneza itemized costs kutoka inspection data
   - Imeongezwa UI ya kuonyesha vitu vilivyofail na fields za gharama
   - Imeongezwa helper functions kwa ajili ya kuupdate inspection item costs
   - Imeongezwa toggle kati ya itemized na general approach

## Faida za Feature Hii

1. **Transparency**: Wote wanaona gharama za kila kitu kilichotengenezwa
2. **Accuracy**: Hakuna urahisi wa kusahau vitu
3. **Audit Trail**: Kila kitu kinaweza kufuatiliwa vizuri
4. **Better Costing**: Bei sahihi kwa kila kitu kilichotengenezwa
5. **Easy Approval**: Sales na Admin wanaona breakdown kamili

## Mfano wa Matumizi

### Scenario: Pikipiki Imetengenezwa

**Ukaguzi wa Gideon:**

- ❌ Brake mbele/nyuma (failed)
- ❌ Indicators zote zinafanya kazi (failed)
- ❌ Haitoi moshi (failed)

**Mechanic Anajaza Gharama:**

1. **Brake mbele/nyuma** ✓

   - Brake pad front: 2 x TZS 35,000
   - Brake pad rear: 2 x TZS 30,000
   - Labor: TZS 50,000
   - **Subtotal: TZS 180,000**

2. **Indicators zote zinafanya kazi** ✓

   - Indicator bulb: 4 x TZS 5,000
   - Labor: TZS 20,000
   - **Subtotal: TZS 40,000**

3. **Haitoi moshi** ✓
   - Engine oil: 1 x TZS 45,000
   - Oil filter: 1 x TZS 15,000
   - Labor: TZS 30,000
   - **Subtotal: TZS 90,000**

**Jumla ya Gharama Zote: TZS 310,000**

## Testing

Ili kutest feature hii:

1. Login kama Gideon (transport role)
2. Unda inspection mpya na umarka vitu vingi vilivyofail
3. Thibitisha inspection
4. Login kama Mechanic (Dito)
5. Bofya "Register Details" kwenye repair task
6. Toggle "Gharama kwa Kila Kitu"
7. Chagua vitu ulivyovitengeneza na ujaze gharama
8. Submit for approval
9. Angalia data kwenye database kuhakikisha zimehifadhiwa vizuri

## Maintenance Notes

- `inspection_item_costs` ni JSONB, kwa hiyo ni flexible
- Unaweza kuongeza fields nyingine kwenye structure kama unahitaji
- Backward compatible: Repairs za zamani hazina itemized costs, zinabaki na general approach

## Future Enhancements

1. **Reports**: Ongeza ripoti za gharama za kila kitu
2. **Analytics**: Ona vitu gani vinaharibika mara kwa mara
3. **Pricing Suggestions**: Pendekeza bei kulingana na history
4. **Mobile Support**: Optimize UI kwa ajili ya mobile devices
