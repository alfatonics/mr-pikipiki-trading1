import { query } from "../config/database.js";

class Motorcycle {
  static async create(data) {
    const {
      chassisNumber,
      engineNumber,
      brand,
      model,
      year,
      color,
      purchasePrice,
      sellingPrice,
      supplierId,
      purchaseDate,
      status = "in_stock",
      customerId,
      saleDate,
      registrationNumber,
      notes,
    } = data;

    const maintenanceCost = data.maintenanceCost || 0;
    const totalCost =
      data.totalCost !== undefined
        ? data.totalCost
        : (purchasePrice || 0) + maintenanceCost;

    // Calculate price_in (purchase + maintenance + extras like transport)
    const priceIn =
      data.priceIn !== undefined
        ? data.priceIn
        : (purchasePrice || 0) + maintenanceCost + (data.transportCost || 0);

    // price_out is the selling price
    const priceOut = data.priceOut !== undefined ? data.priceOut : sellingPrice;

    // Calculate profit
    const profit = priceOut && priceIn ? priceOut - priceIn : null;

    const sql = `
      INSERT INTO motorcycles (chassis_number, engine_number, brand, model, year, color, purchase_price,
                              selling_price, supplier_id, purchase_date, status, customer_id, sale_date,
                              registration_number, notes, maintenance_cost, total_cost, price_in, price_out, profit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, chassis_number as "chassisNumber", engine_number as "engineNumber", brand, model, year, color,
                purchase_price as "purchasePrice", selling_price as "sellingPrice", supplier_id as "supplierId",
                purchase_date as "purchaseDate", status, customer_id as "customerId", sale_date as "saleDate",
                registration_number as "registrationNumber", notes,
                maintenance_cost as "maintenanceCost", total_cost as "totalCost",
                price_in as "priceIn", price_out as "priceOut", profit,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      chassisNumber,
      engineNumber,
      brand,
      model,
      year,
      color,
      purchasePrice,
      sellingPrice,
      supplierId,
      purchaseDate,
      status,
      customerId,
      saleDate,
      registrationNumber,
      notes,
      maintenanceCost,
      totalCost,
      priceIn,
      priceOut,
      profit,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT m.id, m.chassis_number as "chassisNumber", m.engine_number as "engineNumber", 
             m.brand, m.model, m.year, m.color,
             m.purchase_price as "purchasePrice", m.selling_price as "sellingPrice",
             m.sale_price as "salePrice", m.profit_margin as "profitMargin",
             m.repair_cost as "repairCost", m.other_costs as "otherCosts",
             m.pricing_status as "pricingStatus", m.approved_by as "approvedBy",
             m.approved_at as "approvedAt",
             m.supplier_id as "supplierId", m.purchase_date as "purchaseDate", 
             m.status, m.customer_id as "customerId", m.sale_date as "saleDate",
             m.registration_number as "registrationNumber", m.notes,
             m.maintenance_cost as "maintenanceCost", m.total_cost as "totalCost",
             m.price_in as "priceIn", m.price_out as "priceOut", m.profit,
             m.created_at as "createdAt", m.updated_at as "updatedAt",
             s.name as "supplierName",
             c.full_name as "customerName"
      FROM motorcycles m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      LEFT JOIN customers c ON m.customer_id = c.id
      WHERE m.id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT m.id, m.chassis_number as "chassisNumber", m.engine_number as "engineNumber", 
             m.brand, m.model, m.year, m.color,
             m.purchase_price as "purchasePrice", m.selling_price as "sellingPrice",
             m.sale_price as "salePrice", m.profit_margin as "profitMargin",
             m.repair_cost as "repairCost", m.other_costs as "otherCosts",
             m.pricing_status as "pricingStatus", m.approved_by as "approvedBy",
             m.approved_at as "approvedAt",
             m.supplier_id as "supplierId", m.purchase_date as "purchaseDate", 
             m.status, m.customer_id as "customerId", m.sale_date as "saleDate",
             m.registration_number as "registrationNumber", m.notes,
             m.maintenance_cost as "maintenanceCost", m.total_cost as "totalCost",
             m.price_in as "priceIn", m.price_out as "priceOut", m.profit,
             m.created_at as "createdAt", m.updated_at as "updatedAt",
             s.name as "supplierName",
             c.full_name as "customerName"
      FROM motorcycles m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      LEFT JOIN customers c ON m.customer_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND m.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.supplierId) {
      sql += ` AND m.supplier_id = $${paramCount}`;
      params.push(filters.supplierId);
      paramCount++;
    }

    if (filters.customerId) {
      sql += ` AND m.customer_id = $${paramCount}`;
      params.push(filters.customerId);
      paramCount++;
    }

    sql += " ORDER BY m.created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      chassisNumber: "chassis_number",
      engineNumber: "engine_number",
      brand: "brand",
      model: "model",
      year: "year",
      color: "color",
      purchasePrice: "purchase_price",
      sellingPrice: "selling_price",
      salePrice: "sale_price",
      supplierId: "supplier_id",
      purchaseDate: "purchase_date",
      status: "status",
      customerId: "customer_id",
      saleDate: "sale_date",
      profitMargin: "profit_margin",
      repairCost: "repair_cost",
      otherCosts: "other_costs",
      totalCost: "total_cost",
      pricingStatus: "pricing_status",
      approvedBy: "approved_by",
      approvedAt: "approved_at",
      registrationNumber: "registration_number",
      notes: "notes",
      maintenanceCost: "maintenance_cost",
      totalCost: "total_cost",
      priceIn: "price_in",
      priceOut: "price_out",
      profit: "profit",
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
      UPDATE motorcycles
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, chassis_number as "chassisNumber", engine_number as "engineNumber", brand, model, year, color,
                purchase_price as "purchasePrice", selling_price as "sellingPrice", supplier_id as "supplierId",
                purchase_date as "purchaseDate", status, customer_id as "customerId", sale_date as "saleDate",
                registration_number as "registrationNumber", notes,
                price_in as "priceIn", price_out as "priceOut", profit,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM motorcycles WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM motorcycles WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  static async countByStatus() {
    const sql = `
      SELECT status, COUNT(*) as count
      FROM motorcycles
      GROUP BY status
    `;
    const result = await query(sql);
    return result.rows;
  }

  static async addMaintenanceCost(id, amount) {
    const sql = `
      WITH updated AS (
        SELECT id, (COALESCE(maintenance_cost, 0) + $2) AS new_mc
        FROM motorcycles
        WHERE id = $1
      )
      UPDATE motorcycles m
      SET maintenance_cost = updated.new_mc,
          total_cost = m.purchase_price + updated.new_mc
      FROM updated
      WHERE m.id = updated.id
      RETURNING m.id, m.maintenance_cost as "maintenanceCost", m.total_cost as "totalCost";
    `;
    const result = await query(sql, [id, amount]);
    return result.rows[0];
  }
}

export default Motorcycle;
