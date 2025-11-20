import { query } from "../config/database.js";

class StaffAttendance {
  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      status: row.status,
      leaveType: row.leave_type,
      leaveReason: row.leave_reason,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const {
      userId,
      date,
      checkInTime,
      checkOutTime,
      status = "present",
      leaveType,
      leaveReason,
      approvedBy,
      approvedAt,
      notes,
    } = data;

    const sql = `
      INSERT INTO staff_attendance (
        user_id, date, check_in_time, check_out_time, status,
        leave_type, leave_reason, approved_by, approved_at, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, date) 
      DO UPDATE SET
        check_in_time = EXCLUDED.check_in_time,
        check_out_time = EXCLUDED.check_out_time,
        status = EXCLUDED.status,
        leave_type = EXCLUDED.leave_type,
        leave_reason = EXCLUDED.leave_reason,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      date,
      checkInTime,
      checkOutTime,
      status,
      leaveType,
      leaveReason,
      approvedBy,
      approvedAt,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT a.*, 
             u.full_name as user_name,
             u.role as user_role,
             approver.full_name as approver_name
      FROM staff_attendance a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approved_by = approver.id
      WHERE a.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...this.transformRow(row),
      userName: row.user_name,
      userRole: row.user_role,
      approverName: row.approver_name,
    };
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT a.*, 
             u.full_name as user_name,
             u.role as user_role,
             approver.full_name as approver_name
      FROM staff_attendance a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users approver ON a.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.userId) {
      sql += ` AND a.user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    if (filters.date) {
      sql += ` AND a.date = $${paramCount}`;
      params.push(filters.date);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND a.date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND a.date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND a.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    sql += ` ORDER BY a.date DESC, u.full_name ASC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...this.transformRow(row),
      userName: row.user_name,
      userRole: row.user_role,
      approverName: row.approver_name,
    }));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      checkInTime: "check_in_time",
      checkOutTime: "check_out_time",
      status: "status",
      leaveType: "leave_type",
      leaveReason: "leave_reason",
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
      UPDATE staff_attendance
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const sql = `DELETE FROM staff_attendance WHERE id = $1`;
    await query(sql, [id]);
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM staff_attendance WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.userId) {
      sql += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.date) {
      sql += ` AND date = $${paramCount}`;
      params.push(filters.date);
      paramCount++;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }
}

export default StaffAttendance;


