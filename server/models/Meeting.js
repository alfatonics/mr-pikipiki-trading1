import { query } from "../config/database.js";

class Meeting {
  static async generateMeetingNumber() {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) as count FROM meetings WHERE meeting_number LIKE $1`,
      [`MTG-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) || 0;
    const nextNumber = String(count + 1).padStart(3, "0");
    return `MTG-${year}-${nextNumber}`;
  }

  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      meetingNumber: row.meeting_number,
      title: row.title,
      agenda: row.agenda,
      scheduledDate: row.scheduled_date,
      actualDate: row.actual_date,
      location: row.location,
      meetingType: row.meeting_type,
      status: row.status,
      minutes: row.minutes,
      decisions: row.decisions,
      actionItems: row.action_items,
      organizedBy: row.organized_by,
      participants: row.participants || [],
      followUpTasks: row.follow_up_tasks || [],
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const {
      meetingNumber,
      title,
      agenda,
      scheduledDate,
      actualDate,
      location,
      meetingType = "regular",
      status = "scheduled",
      minutes,
      decisions,
      actionItems,
      organizedBy,
      participants = [],
      followUpTasks = [],
      notes,
    } = data;

    const finalMeetingNumber =
      meetingNumber || (await this.generateMeetingNumber());

    const sql = `
      INSERT INTO meetings (
        meeting_number, title, agenda, scheduled_date, actual_date,
        location, meeting_type, status, minutes, decisions, action_items,
        organized_by, participants, follow_up_tasks, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await query(sql, [
      finalMeetingNumber,
      title,
      agenda,
      scheduledDate,
      actualDate,
      location,
      meetingType,
      status,
      minutes,
      decisions,
      actionItems,
      organizedBy,
      JSON.stringify(participants),
      JSON.stringify(followUpTasks),
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT m.*, 
             u1.full_name as organizer_name
      FROM meetings m
      LEFT JOIN users u1 ON m.organized_by = u1.id
      WHERE m.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...this.transformRow(row),
      organizerName: row.organizer_name,
    };
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT m.*, 
             u1.full_name as organizer_name
      FROM meetings m
      LEFT JOIN users u1 ON m.organized_by = u1.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND m.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.organizedBy) {
      sql += ` AND m.organized_by = $${paramCount}`;
      params.push(filters.organizedBy);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND m.scheduled_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND m.scheduled_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ` ORDER BY m.scheduled_date DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...this.transformRow(row),
      organizerName: row.organizer_name,
    }));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      title: "title",
      agenda: "agenda",
      scheduledDate: "scheduled_date",
      actualDate: "actual_date",
      location: "location",
      meetingType: "meeting_type",
      status: "status",
      minutes: "minutes",
      decisions: "decisions",
      actionItems: "action_items",
      participants: "participants",
      followUpTasks: "follow_up_tasks",
      notes: "notes",
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updateData[jsKey] !== undefined) {
        if (jsKey === "participants" || jsKey === "followUpTasks") {
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
      UPDATE meetings
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const sql = `DELETE FROM meetings WHERE id = $1`;
    await query(sql, [id]);
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM meetings WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }
}

export default Meeting;


