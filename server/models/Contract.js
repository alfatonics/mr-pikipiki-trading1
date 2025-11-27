import { query } from "../config/database.js";

class Contract {
  static async create(data) {
    const {
      contractNumber,
      type,
      motorcycleId,
      partyId,
      partyModel,
      amount,
      currency = "TZS",
      date,
      effectiveDate,
      expiryDate,
      paymentMethod,
      terms,
      status = "draft",
      createdBy,
      notes,
      internalNotes,
      priority = "medium",
      // Installment details
      installmentDownPayment,
      installmentMonthlyPayment,
      installmentDuration,
      installmentStartDate,
      installmentInterestRate,
      installmentTotalAmount,
      ramaInspectionStatus = "pending", // Default to pending when contract is created
    } = data;

    const sql = `
      INSERT INTO contracts (
        contract_number, type, motorcycle_id, party_id, party_model, amount, currency,
        date, effective_date, expiry_date, payment_method, terms, status, created_by,
        notes, internal_notes, priority,
        installment_down_payment, installment_monthly_payment, installment_duration,
        installment_start_date, installment_interest_rate, installment_total_amount,
        rama_inspection_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING id, contract_number as "contractNumber", type, motorcycle_id as "motorcycleId",
                party_id as "partyId", party_model as "partyModel", amount, currency,
                date, effective_date as "effectiveDate", expiry_date as "expiryDate",
                payment_method as "paymentMethod", terms, status, created_by as "createdBy",
                notes, internal_notes as "internalNotes", priority,
                rama_inspection_status as "ramaInspectionStatus",
                rama_inspected_by as "ramaInspectedBy", rama_inspected_at as "ramaInspectedAt",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      contractNumber,
      type,
      motorcycleId,
      partyId,
      partyModel,
      amount,
      currency,
      date,
      effectiveDate,
      expiryDate,
      paymentMethod,
      terms,
      status,
      createdBy,
      notes,
      internalNotes,
      priority,
      installmentDownPayment,
      installmentMonthlyPayment,
      installmentDuration,
      installmentStartDate,
      installmentInterestRate,
      installmentTotalAmount,
      ramaInspectionStatus,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT c.*, 
             m.chassis_number as "motorcycleChassisNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel"
      FROM contracts c
      LEFT JOIN motorcycles m ON c.motorcycle_id = m.id
      WHERE c.id = $1
    `;

    const result = await query(sql, [id]);
    if (result.rows[0]) {
      // Convert snake_case to camelCase for the main contract fields
      const row = result.rows[0];
      return {
        id: row.id,
        contractNumber: row.contract_number,
        type: row.type,
        motorcycleId: row.motorcycle_id,
        partyId: row.party_id,
        partyModel: row.party_model,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        effectiveDate: row.effective_date,
        expiryDate: row.expiry_date,
        paymentMethod: row.payment_method,
        terms: row.terms,
        status: row.status,
        createdBy: row.created_by,
        notes: row.notes,
        internalNotes: row.internal_notes,
        priority: row.priority,
        ramaInspectionStatus: row.rama_inspection_status || "pending",
        ramaInspectedBy: row.rama_inspected_by,
        ramaInspectedAt: row.rama_inspected_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        motorcycleChassisNumber: row.motorcycleChassisNumber,
        motorcycleBrand: row.motorcycleBrand,
        motorcycleModel: row.motorcycleModel,
      };
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT c.id, c.contract_number as "contractNumber", c.type, c.motorcycle_id as "motorcycleId",
             c.party_id as "partyId", c.party_model as "partyModel", c.amount, c.currency,
             c.date, c.effective_date as "effectiveDate", c.expiry_date as "expiryDate",
             c.payment_method as "paymentMethod", c.status, c.priority,
             c.rama_inspection_status as "ramaInspectionStatus",
             c.rama_inspected_by as "ramaInspectedBy", c.rama_inspected_at as "ramaInspectedAt",
             c.created_at as "createdAt", c.updated_at as "updatedAt",
             m.chassis_number as "motorcycleChassisNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel"
      FROM contracts c
      LEFT JOIN motorcycles m ON c.motorcycle_id = m.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND c.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.type) {
      sql += ` AND c.type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    if (filters.ramaInspectionStatus) {
      sql += ` AND c.rama_inspection_status = $${paramCount}`;
      params.push(filters.ramaInspectionStatus);
      paramCount++;
    }

    sql += " ORDER BY c.created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      status: "status",
      terms: "terms",
      notes: "notes",
      internalNotes: "internal_notes",
      priority: "priority",
      amount: "amount",
      expiryDate: "expiry_date",
      ramaInspectionStatus: "rama_inspection_status",
      ramaInspectedBy: "rama_inspected_by",
      ramaInspectedAt: "rama_inspected_at",
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updateData[jsKey] !== undefined) {
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(updateData[jsKey]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const sql = `
      UPDATE contracts
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, contract_number as "contractNumber", type, status, created_at as "createdAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM contracts WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM contracts WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.type) {
      sql += ` AND type = $${paramCount}`;
      params.push(filters.type);
      paramCount++;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default Contract;
