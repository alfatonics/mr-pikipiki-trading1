import { query } from "../config/database.js";

class Supplier {
  static async create(data) {
    const {
      name,
      company,
      phone,
      email,
      address,
      city = "Dar es Salaam",
      country = "Tanzania",
      taxId,
      bankName,
      accountNumber,
      accountName,
      rating = 5,
      totalSupplied = 0,
      isActive = true,
      notes,
    } = data;

    const sql = `
      INSERT INTO suppliers (name, company, phone, email, address, city, country, tax_id, 
                            bank_name, account_number, account_name, rating, total_supplied, is_active, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, name, company, phone, email, address, city, country, tax_id as "taxId",
                bank_name as "bankName", account_number as "accountNumber", account_name as "accountName",
                rating, total_supplied as "totalSupplied", is_active as "isActive", notes,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      name,
      company,
      phone,
      email,
      address,
      city,
      country,
      taxId,
      bankName,
      accountNumber,
      accountName,
      rating,
      totalSupplied,
      isActive,
      notes,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT id, name, company, phone, email, address, city, country, tax_id as "taxId",
             bank_name as "bankName", account_number as "accountNumber", account_name as "accountName",
             rating, total_supplied as "totalSupplied", is_active as "isActive", notes,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM suppliers
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT id, name, company, phone, email, address, city, country, tax_id as "taxId",
             bank_name as "bankName", account_number as "accountNumber", account_name as "accountName",
             rating, total_supplied as "totalSupplied", is_active as "isActive", notes,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM suppliers
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    sql += " ORDER BY created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      name: "name",
      company: "company",
      phone: "phone",
      email: "email",
      address: "address",
      city: "city",
      country: "country",
      taxId: "tax_id",
      bankName: "bank_name",
      accountNumber: "account_number",
      accountName: "account_name",
      rating: "rating",
      totalSupplied: "total_supplied",
      isActive: "is_active",
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
      UPDATE suppliers
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, company, phone, email, address, city, country, tax_id as "taxId",
                bank_name as "bankName", account_number as "accountNumber", account_name as "accountName",
                rating, total_supplied as "totalSupplied", is_active as "isActive", notes,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM suppliers WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM suppliers WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default Supplier;
