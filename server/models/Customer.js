import { query } from "../config/database.js";

class Customer {
  static async create(data) {
    const {
      fullName,
      phone,
      email,
      idType,
      idNumber,
      address,
      city = "Dar es Salaam",
      region,
      occupation,
      totalPurchases = 0,
      notes,
      budgetRange,
      preferredCurrency = "TZS",
      creditLimit = 0,
      paymentTerms = "cash",
      salesNotes,
    } = data;

    const sql = `
      INSERT INTO customers (full_name, phone, email, id_type, id_number, address, city, region,
                            occupation, total_purchases, notes, budget_range, preferred_currency,
                            credit_limit, payment_terms, sales_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, full_name as "fullName", phone, email, id_type as "idType", id_number as "idNumber",
                address, city, region, occupation, total_purchases as "totalPurchases", notes,
                budget_range as "budgetRange", preferred_currency as "preferredCurrency",
                credit_limit as "creditLimit", payment_terms as "paymentTerms", sales_notes as "salesNotes",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      fullName,
      phone,
      email,
      idType,
      idNumber,
      address,
      city,
      region,
      occupation,
      totalPurchases,
      notes,
      budgetRange,
      preferredCurrency,
      creditLimit,
      paymentTerms,
      salesNotes,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT id, full_name as "fullName", phone, email, id_type as "idType", id_number as "idNumber",
             address, city, region, occupation, total_purchases as "totalPurchases", notes,
             budget_range as "budgetRange", preferred_currency as "preferredCurrency",
             credit_limit as "creditLimit", payment_terms as "paymentTerms", sales_notes as "salesNotes",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM customers
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT id, full_name as "fullName", phone, email, id_type as "idType", id_number as "idNumber",
             address, city, region, occupation, total_purchases as "totalPurchases", notes,
             budget_range as "budgetRange", preferred_currency as "preferredCurrency",
             credit_limit as "creditLimit", payment_terms as "paymentTerms", sales_notes as "salesNotes",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM customers
      WHERE 1=1
    `;

    const params = [];

    sql += " ORDER BY created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      fullName: "full_name",
      phone: "phone",
      email: "email",
      idType: "id_type",
      idNumber: "id_number",
      address: "address",
      city: "city",
      region: "region",
      occupation: "occupation",
      totalPurchases: "total_purchases",
      notes: "notes",
      budgetRange: "budget_range",
      preferredCurrency: "preferred_currency",
      creditLimit: "credit_limit",
      paymentTerms: "payment_terms",
      salesNotes: "sales_notes",
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
      UPDATE customers
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, full_name as "fullName", phone, email, id_type as "idType", id_number as "idNumber",
                address, city, region, occupation, total_purchases as "totalPurchases", notes,
                budget_range as "budgetRange", preferred_currency as "preferredCurrency",
                credit_limit as "creditLimit", payment_terms as "paymentTerms", sales_notes as "salesNotes",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM customers WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count() {
    const sql = "SELECT COUNT(*) as count FROM customers";
    const result = await query(sql);
    return parseInt(result.rows[0].count);
  }
}

export default Customer;
