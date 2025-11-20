import { query } from "../config/database.js";

class OfficeSupply {
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      itemName: row.item_name,
      category: row.category,
      description: row.description,
      unit: row.unit,
      quantityInStock: parseFloat(row.quantity_in_stock) || 0,
      minimumStockLevel: parseFloat(row.minimum_stock_level) || 0,
      unitCost: parseFloat(row.unit_cost) || 0,
      supplier: row.supplier,
      lastPurchasedDate: row.last_purchased_date,
      lastPurchasedCost: parseFloat(row.last_purchased_cost) || 0,
      location: row.location,
      isActive: row.is_active,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const {
      itemName,
      category,
      description,
      unit = "piece",
      quantityInStock = 0,
      minimumStockLevel = 0,
      unitCost = 0,
      supplier,
      lastPurchasedDate,
      lastPurchasedCost,
      location,
      isActive = true,
      notes,
    } = data;

    const sql = `
      INSERT INTO office_supplies (
        item_name, category, description, unit, quantity_in_stock,
        minimum_stock_level, unit_cost, supplier, last_purchased_date,
        last_purchased_cost, location, is_active, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(sql, [
      itemName,
      category,
      description,
      unit,
      quantityInStock,
      minimumStockLevel,
      unitCost,
      supplier,
      lastPurchasedDate,
      lastPurchasedCost,
      location,
      isActive,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `SELECT * FROM office_supplies WHERE id = $1`;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    return this.transformRow(result.rows[0]);
  }

  static async findAll(filters = {}) {
    let sql = `SELECT * FROM office_supplies WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      sql += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    if (filters.lowStock) {
      sql += ` AND quantity_in_stock <= minimum_stock_level`;
    }

    sql += ` ORDER BY item_name ASC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      itemName: "item_name",
      category: "category",
      description: "description",
      unit: "unit",
      quantityInStock: "quantity_in_stock",
      minimumStockLevel: "minimum_stock_level",
      unitCost: "unit_cost",
      supplier: "supplier",
      lastPurchasedDate: "last_purchased_date",
      lastPurchasedCost: "last_purchased_cost",
      location: "location",
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
      UPDATE office_supplies
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const sql = `DELETE FROM office_supplies WHERE id = $1`;
    await query(sql, [id]);
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM office_supplies WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      sql += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }
}

export default OfficeSupply;

