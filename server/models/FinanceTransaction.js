import { query } from "../config/database.js";

class FinanceTransaction {
  static async create(data) {
    const {
      transactionType,
      category,
      amount,
      currency = "TZS",
      description,
      date,
      contractId,
      motorcycleId,
      repairId,
      supplierId,
      customerId,
      proofImage,
      proofDocument,
      department,
      createdBy,
      status = "completed",
      notes,
    } = data;

    const sql = `
      INSERT INTO finance_transactions (
        transaction_type, category, amount, currency, description, date,
        contract_id, motorcycle_id, repair_id, supplier_id, customer_id,
        proof_image, proof_document, department, created_by, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, transaction_type as "transactionType", category, amount, currency,
                description, date, contract_id as "contractId", motorcycle_id as "motorcycleId",
                repair_id as "repairId", supplier_id as "supplierId", customer_id as "customerId",
                proof_image as "proofImage", proof_document as "proofDocument", department,
                created_by as "createdBy", status, approved_by as "approvedBy",
                approved_at as "approvedAt", notes,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      transactionType,
      category,
      amount,
      currency,
      description,
      date,
      contractId,
      motorcycleId,
      repairId,
      supplierId,
      customerId,
      proofImage,
      proofDocument,
      department,
      createdBy,
      status,
      notes,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT t.*,
             c.contract_number as "contractNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel",
             s.name as "supplierName",
             cu.full_name as "customerName",
             u.full_name as "createdByName"
      FROM finance_transactions t
      LEFT JOIN contracts c ON t.contract_id = c.id
      LEFT JOIN motorcycles m ON t.motorcycle_id = m.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      LEFT JOIN customers cu ON t.customer_id = cu.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `;

    const result = await query(sql, [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id,
        transactionType: row.transaction_type,
        category: row.category,
        amount: parseFloat(row.amount),
        currency: row.currency,
        description: row.description,
        date: row.date,
        contractId: row.contract_id,
        contractNumber: row.contractNumber,
        motorcycleId: row.motorcycle_id,
        motorcycle: row.motorcycleBrand
          ? `${row.motorcycleBrand} ${row.motorcycleModel}`
          : null,
        repairId: row.repair_id,
        supplierId: row.supplier_id,
        supplierName: row.supplierName,
        customerId: row.customer_id,
        customerName: row.customerName,
        proofImage: row.proof_image,
        proofDocument: row.proof_document,
        department: row.department,
        createdBy: row.created_by,
        createdByName: row.createdByName,
        status: row.status,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT t.id, t.transaction_type as "transactionType", t.category, t.amount, t.currency,
             t.description, t.date, t.status, t.department,
             t.created_at as "createdAt", t.updated_at as "updatedAt",
             c.contract_number as "contractNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel",
             s.name as "supplierName",
             cu.full_name as "customerName",
             u.full_name as "createdByName"
      FROM finance_transactions t
      LEFT JOIN contracts c ON t.contract_id = c.id
      LEFT JOIN motorcycles m ON t.motorcycle_id = m.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      LEFT JOIN customers cu ON t.customer_id = cu.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.transactionType) {
      sql += ` AND t.transaction_type = $${paramCount}`;
      params.push(filters.transactionType);
      paramCount++;
    }

    if (filters.category) {
      sql += ` AND t.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND t.date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND t.date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    if (filters.department) {
      sql += ` AND t.department = $${paramCount}`;
      params.push(filters.department);
      paramCount++;
    }

    sql += " ORDER BY t.date DESC, t.created_at DESC";

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      amount: parseFloat(row.amount),
    }));
  }

  static async getSummary(filters = {}) {
    let sql = `
      SELECT 
        transaction_type as "transactionType",
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM finance_transactions
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.dateFrom) {
      sql += ` AND date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += " GROUP BY transaction_type, category";

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      total: parseFloat(row.total),
      count: parseInt(row.count),
    }));
  }

  static async getCashFlow(filters = {}) {
    let sql = `
      SELECT 
        DATE_TRUNC('day', date) as date,
        transaction_type as "transactionType",
        SUM(amount) as total
      FROM finance_transactions
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.dateFrom) {
      sql += ` AND date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ` GROUP BY DATE_TRUNC('day', date), transaction_type ORDER BY date DESC`;

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      date: row.date,
      transactionType: row.transaction_type,
      total: parseFloat(row.total),
    }));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      transactionType: "transaction_type",
      category: "category",
      amount: "amount",
      currency: "currency",
      description: "description",
      date: "date",
      contractId: "contract_id",
      motorcycleId: "motorcycle_id",
      repairId: "repair_id",
      supplierId: "supplier_id",
      customerId: "customer_id",
      proofImage: "proof_image",
      proofDocument: "proof_document",
      department: "department",
      status: "status",
      approvedBy: "approved_by",
      approvedAt: "approved_at",
      notes: "notes",
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
      UPDATE finance_transactions
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, transaction_type as "transactionType", category, amount, status, updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM finance_transactions WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM finance_transactions WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.transactionType) {
      sql += ` AND transaction_type = $${paramCount}`;
      params.push(filters.transactionType);
    }

    if (filters.category) {
      sql += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default FinanceTransaction;

