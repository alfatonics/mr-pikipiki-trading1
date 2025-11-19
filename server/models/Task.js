import { query } from "../config/database.js";

class Task {
  static async generateTaskNumber() {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) as count FROM tasks WHERE task_number LIKE $1`,
      [`TSK-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) || 0;
    const nextNumber = String(count + 1).padStart(3, "0");
    return `TSK-${year}-${nextNumber}`;
  }

  static async create(data) {
    const {
      taskType,
      title,
      description,
      source,
      motorcycleId,
      inspectionId,
      repairId,
      contractId,
      assignedBy,
      assignedTo,
      priority = "medium",
      dueDate,
      problemDescription,
      location,
      notes,
    } = data;

    const taskNumber = await this.generateTaskNumber();

    const sql = `
      INSERT INTO tasks (
        task_number, task_type, title, description, source,
        motorcycle_id, inspection_id, repair_id, contract_id,
        assigned_by, assigned_to, priority, due_date,
        problem_description, location, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await query(sql, [
      taskNumber,
      taskType,
      title,
      description,
      source,
      motorcycleId,
      inspectionId,
      repairId,
      contractId,
      assignedBy,
      assignedTo,
      priority,
      dueDate,
      problemDescription,
      location,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT t.*,
             m.brand as "motorcycleBrand", m.model as "motorcycleModel", 
             m.chassis_number as "motorcycleChassisNumber",
             u1.full_name as "assignedByName", u1.username as "assignedByUsername",
             u2.full_name as "assignedToName", u2.username as "assignedToUsername"
      FROM tasks t
      LEFT JOIN motorcycles m ON t.motorcycle_id = m.id
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT t.*,
             m.brand as "motorcycleBrand", m.model as "motorcycleModel", 
             m.chassis_number as "motorcycleChassisNumber",
             u1.full_name as "assignedByName", u1.username as "assignedByUsername",
             u2.full_name as "assignedToName", u2.username as "assignedToUsername"
      FROM tasks t
      LEFT JOIN motorcycles m ON t.motorcycle_id = m.id
      LEFT JOIN users u1 ON t.assigned_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.assignedTo) {
      sql += ` AND t.assigned_to = $${paramCount++}`;
      params.push(filters.assignedTo);
    }

    if (filters.assignedBy) {
      sql += ` AND t.assigned_by = $${paramCount++}`;
      params.push(filters.assignedBy);
    }

    if (filters.status) {
      sql += ` AND t.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.taskType) {
      sql += ` AND t.task_type = $${paramCount++}`;
      params.push(filters.taskType);
    }

    if (filters.motorcycleId) {
      sql += ` AND t.motorcycle_id = $${paramCount++}`;
      params.push(filters.motorcycleId);
    }

    sql += ` ORDER BY t.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async update(id, data) {
    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "assignedTo",
      "dueDate",
      "startedAt",
      "completedAt",
      "problemDescription",
      "location",
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

    params.push(id);
    const sql = `
      UPDATE tasks
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

  static async delete(id) {
    const sql = `DELETE FROM tasks WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0] ? this.transformRow(result.rows[0]) : null;
  }

  static async updateStatusByRepairId(repairId, status) {
    const sql = `
      UPDATE tasks
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE repair_id = $2
      RETURNING *
    `;
    const result = await query(sql, [status, repairId]);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM tasks WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.assignedTo) {
      sql += ` AND assigned_to = $${paramCount++}`;
      params.push(filters.assignedTo);
    }

    if (filters.status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }

  static async updateStatusByRepairId(repairId, status) {
    const taskStatusMap = {
      pending: "pending",
      in_progress: "in_progress",
      completed: "completed",
    };

    const newTaskStatus = taskStatusMap[status];
    if (!newTaskStatus) return;

    const sql = `
      UPDATE tasks
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE repair_id = $2
    `;
    await query(sql, [newTaskStatus, repairId]);
  }

  static transformRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      taskNumber: row.task_number,
      taskType: row.task_type,
      title: row.title,
      description: row.description,
      source: row.source,
      motorcycleId: row.motorcycle_id,
      inspectionId: row.inspection_id,
      repairId: row.repair_id,
      contractId: row.contract_id,
      assignedBy: row.assigned_by,
      assignedTo: row.assigned_to,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      problemDescription: row.problem_description,
      location: row.location,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      motorcycle: row.motorcycleBrand
        ? {
            brand: row.motorcycleBrand,
            model: row.motorcycleModel,
            chassisNumber: row.motorcycleChassisNumber,
          }
        : null,
      assignedByName: row.assignedByName,
      assignedByUsername: row.assignedByUsername,
      assignedToName: row.assignedToName,
      assignedToUsername: row.assignedToUsername,
    };
  }
}

export default Task;
