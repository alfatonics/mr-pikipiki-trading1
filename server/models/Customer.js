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
             address, city, region, occupation, total_purchases as "totalPurchases", 
             total_spent as "totalSpent", last_purchase_date as "lastPurchaseDate", notes,
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
             address, city, region, occupation, total_purchases as "totalPurchases",
             total_spent as "totalSpent", last_purchase_date as "lastPurchaseDate", notes,
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

  // Get customer purchase history from sale contracts
  static async getPurchaseHistory(customerId, filters = {}) {
    let sql = `
      SELECT 
        c.id as "contractId",
        c.contract_number as "contractNumber",
        c.type,
        c.amount,
        c.currency,
        c.date,
        c.status,
        c.payment_method as "paymentMethod",
        m.brand,
        m.model,
        m.chassis_number as "chassisNumber"
      FROM contracts c
      LEFT JOIN motorcycles m ON c.motorcycle_id = m.id
      WHERE c.party_id = $1 
        AND c.party_model = 'Customer'
        AND c.type = 'sale'
    `;

    const params = [customerId];
    let paramCount = 2;

    if (filters.startDate) {
      sql += ` AND c.date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      sql += ` AND c.date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND c.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    sql += " ORDER BY c.date DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  // Get purchase statistics for a customer
  static async getPurchaseStats(customerId, period = "all") {
    let dateFilter = "";
    const params = [customerId];

    if (period === "week") {
      dateFilter = " AND c.date >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === "month") {
      dateFilter = " AND c.date >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === "year") {
      dateFilter = " AND c.date >= CURRENT_DATE - INTERVAL '365 days'";
    }

    const sql = `
      SELECT 
        COUNT(*) as "totalPurchases",
        COALESCE(SUM(c.amount), 0) as "totalAmount",
        COALESCE(AVG(c.amount), 0) as "averageAmount",
        COALESCE(MIN(c.amount), 0) as "minAmount",
        COALESCE(MAX(c.amount), 0) as "maxAmount"
      FROM contracts c
      WHERE c.party_id = $1 
        AND c.party_model = 'Customer'
        AND c.type = 'sale'
        AND c.status IN ('active', 'completed')
        ${dateFilter}
    `;

    const result = await query(sql, params);
    return result.rows[0];
  }

  // Get all customers with their purchase statistics
  static async findAllWithStats(filters = {}) {
    let sql = `
      SELECT 
        c.id,
        c.full_name as "fullName",
        c.phone,
        c.email,
        c.budget_range as "budgetRange",
        c.preferred_currency as "preferredCurrency",
        c.payment_terms as "paymentTerms",
        c.city,
        c.total_purchases as "totalPurchases",
        COUNT(ct.id) as "contractCount",
        COALESCE(SUM(CASE WHEN ct.type = 'sale' AND ct.status IN ('active', 'completed') THEN ct.amount ELSE 0 END), 0) as "totalPurchaseAmount",
        COALESCE(AVG(CASE WHEN ct.type = 'sale' AND ct.status IN ('active', 'completed') THEN ct.amount ELSE NULL END), 0) as "averagePurchaseAmount",
        MAX(CASE WHEN ct.type = 'sale' AND ct.status IN ('active', 'completed') THEN ct.date ELSE NULL END) as "lastPurchaseDate"
      FROM customers c
      LEFT JOIN contracts ct ON ct.party_id = c.id AND ct.party_model = 'Customer' AND ct.type = 'sale'
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.budgetRange) {
      sql += ` AND c.budget_range = $${paramCount}`;
      params.push(filters.budgetRange);
      paramCount++;
    }

    if (filters.city) {
      sql += ` AND c.city = $${paramCount}`;
      params.push(filters.city);
      paramCount++;
    }

    sql += ` GROUP BY c.id, c.full_name, c.phone, c.email, c.budget_range, c.preferred_currency, c.payment_terms, c.city, c.total_purchases
             ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  // Get budget range analysis for a time period
  static async getBudgetRangeAnalysis(startDate, endDate) {
    const sql = `
      SELECT 
        c.budget_range as "budgetRange",
        COUNT(DISTINCT c.id) as "customerCount",
        COUNT(ct.id) as "purchaseCount",
        COALESCE(SUM(ct.amount), 0) as "totalAmount",
        COALESCE(AVG(ct.amount), 0) as "averageAmount"
      FROM customers c
      LEFT JOIN contracts ct ON ct.party_id = c.id 
        AND ct.party_model = 'Customer' 
        AND ct.type = 'sale'
        AND ct.status IN ('active', 'completed')
        AND ct.date >= $1
        AND ct.date <= $2
      WHERE c.budget_range IS NOT NULL
      GROUP BY c.budget_range
      ORDER BY 
        CASE c.budget_range
          WHEN 'under-500k' THEN 1
          WHEN '500k-1m' THEN 2
          WHEN '1m-2m' THEN 3
          WHEN '2m-5m' THEN 4
          WHEN '5m-10m' THEN 5
          WHEN 'over-10m' THEN 6
          ELSE 7
        END
    `;

    const result = await query(sql, [startDate, endDate]);
    return result.rows;
  }

  // Get average purchase price by period (week/month/year)
  static async getAveragePurchaseByPeriod(period = "week") {
    let dateFilter = "";
    let groupBy = "";

    if (period === "week") {
      dateFilter = "WHERE ct.date >= CURRENT_DATE - INTERVAL '7 days'";
      groupBy = "DATE_TRUNC('day', ct.date::timestamp)";
    } else if (period === "month") {
      dateFilter = "WHERE ct.date >= CURRENT_DATE - INTERVAL '30 days'";
      groupBy = "DATE_TRUNC('week', ct.date::timestamp)";
    } else if (period === "year") {
      dateFilter = "WHERE ct.date >= CURRENT_DATE - INTERVAL '365 days'";
      groupBy = "DATE_TRUNC('month', ct.date::timestamp)";
    }

    const sql = `
      SELECT 
        ${groupBy} as "period",
        COUNT(*) as "purchaseCount",
        COALESCE(AVG(ct.amount), 0) as "averageAmount",
        COALESCE(SUM(ct.amount), 0) as "totalAmount"
      FROM contracts ct
      ${dateFilter}
        AND ct.type = 'sale'
        AND ct.status IN ('active', 'completed')
        AND ct.party_model = 'Customer'
      GROUP BY ${groupBy}
      ORDER BY ${groupBy} DESC
    `;

    const result = await query(sql);
    return result.rows;
  }
}

export default Customer;
