import { query } from "../config/database.js";

class Loan {
  static async create(data) {
    const {
      loanType, // 'we_owe' or 'owe_us'
      personName,
      personPhone,
      personEmail,
      personType, // 'customer', 'supplier', 'staff', 'other'
      amount,
      currency = "TZS",
      description,
      dueDate,
      interestRate,
      createdBy,
      status = "active",
      notes,
    } = data;

    const sql = `
      INSERT INTO loans (
        loan_type, person_name, person_phone, person_email, person_type,
        amount, currency, description, due_date, interest_rate,
        created_by, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(sql, [
      loanType,
      personName,
      personPhone,
      personEmail,
      personType,
      amount,
      currency,
      description,
      dueDate,
      interestRate || 0,
      createdBy,
      status,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT l.*,
             u.full_name as "createdByName", u.username as "createdByUsername"
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT l.*,
             u.full_name as "createdByName", u.username as "createdByUsername"
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.loanType) {
      sql += ` AND l.loan_type = $${paramCount++}`;
      params.push(filters.loanType);
    }

    if (filters.status) {
      sql += ` AND l.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.personType) {
      sql += ` AND l.person_type = $${paramCount++}`;
      params.push(filters.personType);
    }

    if (filters.search) {
      sql += ` AND (
        l.person_name ILIKE $${paramCount} OR
        l.person_phone ILIKE $${paramCount} OR
        l.description ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ` ORDER BY l.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async update(id, data) {
    const allowedFields = [
      "personName",
      "personPhone",
      "personEmail",
      "amount",
      "description",
      "dueDate",
      "interestRate",
      "status",
      "notes",
    ];

    const updates = [];
    const params = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const dbField = field
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");
        updates.push(`${dbField} = $${paramCount++}`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    const sql = `
      UPDATE loans
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, params);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async addPayment(loanId, amount, paymentDate, notes, createdBy) {
    const loan = await this.findById(loanId);
    if (!loan) {
      return null;
    }

    // Add payment record
    const paymentSql = `
      INSERT INTO loan_payments (loan_id, amount, payment_date, notes, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    await query(paymentSql, [loanId, amount, paymentDate, notes, createdBy]);

    // Update loan amount
    const newAmount = parseFloat(loan.amount) - parseFloat(amount);
    const newStatus = newAmount <= 0 ? "paid" : loan.status;

    return await this.update(loanId, {
      amount: newAmount,
      status: newStatus,
    });
  }

  static async getSummary() {
    const sql = `
      SELECT 
        loan_type,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM loans
      GROUP BY loan_type, status
    `;
    const result = await query(sql);
    return result.rows;
  }

  static transformRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      loanType: row.loan_type,
      personName: row.person_name,
      personPhone: row.person_phone,
      personEmail: row.person_email,
      personType: row.person_type,
      amount: parseFloat(row.amount) || 0,
      currency: row.currency,
      description: row.description,
      dueDate: row.due_date,
      interestRate: parseFloat(row.interest_rate) || 0,
      createdBy: row.created_by,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdByUser: row.createdByName
        ? {
            name: row.createdByName,
            username: row.createdByUsername,
          }
        : null,
    };
  }
}

export default Loan;






