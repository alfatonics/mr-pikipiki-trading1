import { query } from "../config/database.js";

class StaffTask {
  static async generateTaskNumber() {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) as count FROM staff_tasks WHERE task_number LIKE $1`,
      [`STSK-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) || 0;
    const nextNumber = String(count + 1).padStart(3, "0");
    return `STSK-${year}-${nextNumber}`;
  }

  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      taskNumber: row.task_number,
      title: row.title,
      description: row.description,
      taskCategory: row.task_category,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to,
      assignedBy: row.assigned_by,
      dueDate: row.due_date,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      progressPercentage: row.progress_percentage || 0,
      completionNotes: row.completion_notes,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const {
      taskNumber,
      title,
      description,
      taskCategory = "general",
      priority = "medium",
      status = "pending",
      assignedTo,
      assignedBy,
      dueDate,
      startedAt,
      completedAt,
      progressPercentage = 0,
      completionNotes,
      relatedEntityType,
      relatedEntityId,
      notes,
    } = data;

    const finalTaskNumber = taskNumber || (await this.generateTaskNumber());

    const sql = `
      INSERT INTO staff_tasks (
        task_number, title, description, task_category, priority, status,
        assigned_to, assigned_by, due_date, started_at, completed_at,
        progress_percentage, completion_notes, related_entity_type,
        related_entity_id, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await query(sql, [
      finalTaskNumber,
      title,
      description,
      taskCategory,
      priority,
      status,
      assignedTo,
      assignedBy,
      dueDate,
      startedAt,
      completedAt,
      progressPercentage,
      completionNotes,
      relatedEntityType,
      relatedEntityId,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT t.*, 
             assignee.full_name as assignee_name,
             assignee.role as assignee_role,
             assigner.full_name as assigner_name
      FROM staff_tasks t
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      WHERE t.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...this.transformRow(row),
      assigneeName: row.assignee_name,
      assigneeRole: row.assignee_role,
      assignerName: row.assigner_name,
    };
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT t.*, 
             assignee.full_name as assignee_name,
             assignee.role as assignee_role,
             assigner.full_name as assigner_name
      FROM staff_tasks t
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users assigner ON t.assigned_by = assigner.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.assignedTo) {
      sql += ` AND t.assigned_to = $${paramCount}`;
      params.push(filters.assignedTo);
      paramCount++;
    }

    if (filters.assignedBy) {
      sql += ` AND t.assigned_by = $${paramCount}`;
      params.push(filters.assignedBy);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND t.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.taskCategory) {
      sql += ` AND t.task_category = $${paramCount}`;
      params.push(filters.taskCategory);
      paramCount++;
    }

    if (filters.priority) {
      sql += ` AND t.priority = $${paramCount}`;
      params.push(filters.priority);
      paramCount++;
    }

    sql += ` ORDER BY t.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...this.transformRow(row),
      assigneeName: row.assignee_name,
      assigneeRole: row.assignee_role,
      assignerName: row.assigner_name,
    }));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      title: "title",
      description: "description",
      taskCategory: "task_category",
      priority: "priority",
      status: "status",
      assignedTo: "assigned_to",
      dueDate: "due_date",
      startedAt: "started_at",
      completedAt: "completed_at",
      progressPercentage: "progress_percentage",
      completionNotes: "completion_notes",
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
      UPDATE staff_tasks
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const sql = `DELETE FROM staff_tasks WHERE id = $1`;
    await query(sql, [id]);
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM staff_tasks WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.assignedTo) {
      sql += ` AND assigned_to = $${paramCount}`;
      params.push(filters.assignedTo);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }
}

export default StaffTask;

