import { query } from "../config/database.js";

class Approval {
  static async create(data) {
    const {
      approvalType,
      entityType,
      entityId,
      proposedData,
      originalData,
      status = "pending_sales",
      requestedBy,
      salesApprovedBy,
      salesApprovedAt,
      salesComments,
      adminApprovedBy,
      adminApprovedAt,
      adminComments,
      rejectedBy,
      rejectedAt,
      rejectionReason,
      priority = "medium",
      description,
      notes,
    } = data;

    const sql = `
      INSERT INTO approvals (
        approval_type, entity_type, entity_id, proposed_data, original_data, status,
        requested_by, sales_approved_by, sales_approved_at, sales_comments,
        admin_approved_by, admin_approved_at, admin_comments, rejected_by, rejected_at,
        rejection_reason, priority, description, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, approval_type as "approvalType", entity_type as "entityType", entity_id as "entityId",
                proposed_data as "proposedData", original_data as "originalData", status,
                requested_by as "requestedBy", sales_approved_by as "salesApprovedBy",
                sales_approved_at as "salesApprovedAt", sales_comments as "salesComments",
                admin_approved_by as "adminApprovedBy", admin_approved_at as "adminApprovedAt",
                admin_comments as "adminComments", rejected_by as "rejectedBy", rejected_at as "rejectedAt",
                rejection_reason as "rejectionReason", priority, description, notes,
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      approvalType,
      entityType,
      entityId,
      JSON.stringify(proposedData),
      JSON.stringify(originalData),
      status,
      requestedBy,
      salesApprovedBy,
      salesApprovedAt,
      salesComments,
      adminApprovedBy,
      adminApprovedAt,
      adminComments,
      rejectedBy,
      rejectedAt,
      rejectionReason,
      priority,
      description,
      notes,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT a.*,
             u1.full_name as "requestedByName",
             u2.full_name as "salesApprovedByName",
             u3.full_name as "adminApprovedByName"
      FROM approvals a
      LEFT JOIN users u1 ON a.requested_by = u1.id
      LEFT JOIN users u2 ON a.sales_approved_by = u2.id
      LEFT JOIN users u3 ON a.admin_approved_by = u3.id
      WHERE a.id = $1
    `;

    const result = await query(sql, [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id,
        approvalType: row.approval_type,
        entityType: row.entity_type,
        entityId: row.entity_id,
        proposedData: row.proposed_data,
        originalData: row.original_data,
        status: row.status,
        requestedBy: row.requested_by,
        requestedByName: row.requestedByName,
        salesApprovedBy: row.sales_approved_by,
        salesApprovedByName: row.salesApprovedByName,
        salesApprovedAt: row.sales_approved_at,
        salesComments: row.sales_comments,
        adminApprovedBy: row.admin_approved_by,
        adminApprovedByName: row.adminApprovedByName,
        adminApprovedAt: row.admin_approved_at,
        adminComments: row.admin_comments,
        rejectedBy: row.rejected_by,
        rejectedAt: row.rejected_at,
        rejectionReason: row.rejection_reason,
        priority: row.priority,
        description: row.description,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT a.id, a.approval_type as "approvalType", a.entity_type as "entityType",
             a.entity_id as "entityId", a.status, a.priority, a.description,
             a.created_at as "createdAt", a.updated_at as "updatedAt",
             u1.full_name as "requestedByName"
      FROM approvals a
      LEFT JOIN users u1 ON a.requested_by = u1.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND a.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.requestedBy) {
      sql += ` AND a.requested_by = $${paramCount}`;
      params.push(filters.requestedBy);
      paramCount++;
    }

    if (filters.approvalType) {
      sql += ` AND a.approval_type = $${paramCount}`;
      params.push(filters.approvalType);
      paramCount++;
    }

    sql += " ORDER BY a.created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      status: "status",
      salesApprovedBy: "sales_approved_by",
      salesApprovedAt: "sales_approved_at",
      salesComments: "sales_comments",
      adminApprovedBy: "admin_approved_by",
      adminApprovedAt: "admin_approved_at",
      adminComments: "admin_comments",
      rejectedBy: "rejected_by",
      rejectedAt: "rejected_at",
      rejectionReason: "rejection_reason",
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
      UPDATE approvals
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, status, updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM approvals WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM approvals WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default Approval;
