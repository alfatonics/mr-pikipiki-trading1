import { query } from "../config/database.js";

class Repair {
  static async create(data) {
    const {
      motorcycleId,
      mechanicId,
      inspectionId,
      description,
      repairType,
      startDate = new Date(),
      completionDate,
      status = "pending",
      laborCost = 0,
      laborHours = 0,
      totalCost = 0,
      notes,
      detailsRegistered = false,
      detailsApprovalId,
      workDescription,
      issuesFound,
      recommendations,
      inspectionItemCosts = [],
    } = data;

    const sql = `
      INSERT INTO repairs (motorcycle_id, mechanic_id, inspection_id, description, repair_type, start_date,
                          completion_date, status, labor_cost, labor_hours, total_cost, notes,
                          details_registered, details_approval_id, work_description, issues_found, recommendations, inspection_item_costs)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, motorcycle_id as "motorcycleId", mechanic_id as "mechanicId", inspection_id as "inspectionId",
                description, repair_type as "repairType", start_date as "startDate", completion_date as "completionDate",
                status, labor_cost as "laborCost", labor_hours as "laborHours", total_cost as "totalCost",
                notes, details_registered as "detailsRegistered", details_approval_id as "detailsApprovalId",
                work_description as "workDescription", issues_found as "issuesFound", recommendations,
                inspection_item_costs as "inspectionItemCosts",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      motorcycleId,
      mechanicId,
      inspectionId || null,
      description,
      repairType,
      startDate,
      completionDate,
      status,
      laborCost,
      laborHours,
      totalCost,
      notes,
      detailsRegistered,
      detailsApprovalId,
      workDescription,
      issuesFound,
      recommendations,
      JSON.stringify(inspectionItemCosts || []),
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT r.*,
             m.chassis_number as "motorcycleChassisNumber",
             u.full_name as "mechanicName"
      FROM repairs r
      LEFT JOIN motorcycles m ON r.motorcycle_id = m.id
      LEFT JOIN users u ON r.mechanic_id = u.id
      WHERE r.id = $1
    `;

    const result = await query(sql, [id]);
    if (result.rows[0]) {
      const row = result.rows[0];

      // Parse inspection_item_costs if it's a string
      let inspectionItemCosts = [];
      if (row.inspection_item_costs) {
        inspectionItemCosts =
          typeof row.inspection_item_costs === "string"
            ? JSON.parse(row.inspection_item_costs)
            : row.inspection_item_costs;
      }

      return {
        id: row.id,
        motorcycleId: row.motorcycle_id,
        mechanicId: row.mechanic_id,
        inspectionId: row.inspection_id,
        description: row.description,
        repairType: row.repair_type,
        startDate: row.start_date,
        completionDate: row.completion_date,
        status: row.status,
        laborCost: row.labor_cost,
        laborHours: row.labor_hours,
        totalCost: row.total_cost,
        notes: row.notes,
        detailsRegistered: row.details_registered,
        detailsApprovalId: row.details_approval_id,
        workDescription: row.work_description,
        issuesFound: row.issues_found,
        recommendations: row.recommendations,
        inspectionItemCosts: inspectionItemCosts,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        motorcycleChassisNumber: row.motorcycleChassisNumber,
        mechanicName: row.mechanicName,
      };
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT r.id, r.motorcycle_id as "motorcycleId", r.mechanic_id as "mechanicId",
             r.inspection_id as "inspectionId", r.description, r.repair_type as "repairType", 
             r.start_date as "startDate", r.completion_date as "completionDate", r.status, 
             r.labor_cost as "laborCost", r.labor_hours as "laborHours", r.total_cost as "totalCost",
             r.notes, r.created_at as "createdAt", r.updated_at as "updatedAt",
             m.chassis_number as "motorcycleChassisNumber", m.brand as "motorcycleBrand",
             m.model as "motorcycleModel",
             u.full_name as "mechanicName"
      FROM repairs r
      LEFT JOIN motorcycles m ON r.motorcycle_id = m.id
      LEFT JOIN users u ON r.mechanic_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND r.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.mechanicId) {
      sql += ` AND r.mechanic_id = $${paramCount}`;
      params.push(filters.mechanicId);
      paramCount++;
    }

    if (filters.motorcycleId) {
      sql += ` AND r.motorcycle_id = $${paramCount}`;
      params.push(filters.motorcycleId);
      paramCount++;
    }

    sql += " ORDER BY r.start_date DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      status: "status",
      completionDate: "completion_date",
      laborCost: "labor_cost",
      laborHours: "labor_hours",
      totalCost: "total_cost",
      notes: "notes",
      detailsRegistered: "details_registered",
      detailsApprovalId: "details_approval_id",
      workDescription: "work_description",
      issuesFound: "issues_found",
      recommendations: "recommendations",
      proofOfWork: "proof_of_work",
      inspectionItemCosts: "inspection_item_costs",
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updateData[jsKey] !== undefined) {
        // JSON stringify for JSONB fields
        if (jsKey === "inspectionItemCosts") {
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(JSON.stringify(updateData[jsKey]));
        } else {
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(updateData[jsKey]);
        }
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const sql = `
      UPDATE repairs
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, status, total_cost as "totalCost", updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM repairs WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM repairs WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  // Spare parts methods
  static async addSparePart(repairId, sparePart) {
    const { name, quantity, cost } = sparePart;
    const sql = `
      INSERT INTO repair_spare_parts (repair_id, name, quantity, cost)
      VALUES ($1, $2, $3, $4)
      RETURNING id, repair_id as "repairId", name, quantity, cost, created_at as "createdAt"
    `;
    const result = await query(sql, [repairId, name, quantity, cost]);
    return result.rows[0];
  }

  static async getSpareParts(repairId) {
    const sql = `
      SELECT id, repair_id as "repairId", name, quantity, cost, created_at as "createdAt"
      FROM repair_spare_parts
      WHERE repair_id = $1
    `;
    const result = await query(sql, [repairId]);
    return result.rows;
  }

  static async clearSpareParts(repairId) {
    const sql = `DELETE FROM repair_spare_parts WHERE repair_id = $1`;
    await query(sql, [repairId]);
  }
}

export default Repair;
