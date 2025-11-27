import { query } from "../config/database.js";

class Message {
  static async create(data) {
    const {
      senderId,
      receiverId,
      subject,
      message,
      relatedEntityType,
      relatedEntityId,
      priority = "normal",
    } = data;

    const sql = `
      INSERT INTO messages (
        sender_id, receiver_id, subject, message,
        related_entity_type, related_entity_id, priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await query(sql, [
      senderId,
      receiverId,
      subject,
      message,
      relatedEntityType,
      relatedEntityId,
      priority,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT msg.*,
             u1.full_name as "senderName", u1.username as "senderUsername",
             u2.full_name as "receiverName", u2.username as "receiverUsername"
      FROM messages msg
      LEFT JOIN users u1 ON msg.sender_id = u1.id
      LEFT JOIN users u2 ON msg.receiver_id = u2.id
      WHERE msg.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT msg.*,
             u1.full_name as "senderName", u1.username as "senderUsername",
             u2.full_name as "receiverName", u2.username as "receiverUsername"
      FROM messages msg
      LEFT JOIN users u1 ON msg.sender_id = u1.id
      LEFT JOIN users u2 ON msg.receiver_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.senderId) {
      sql += ` AND msg.sender_id = $${paramCount++}`;
      params.push(filters.senderId);
    }

    if (filters.receiverId) {
      sql += ` AND msg.receiver_id = $${paramCount++}`;
      params.push(filters.receiverId);
    }

    if (filters.isRead !== undefined) {
      sql += ` AND msg.is_read = $${paramCount++}`;
      params.push(filters.isRead);
    }

    if (filters.relatedEntityType && filters.relatedEntityId) {
      sql += ` AND msg.related_entity_type = $${paramCount++}`;
      params.push(filters.relatedEntityType);
      sql += ` AND msg.related_entity_id = $${paramCount++}`;
      params.push(filters.relatedEntityId);
    }

    sql += ` ORDER BY msg.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async markAsRead(id) {
    const sql = `
      UPDATE messages
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id]);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async delete(id) {
    const sql = `DELETE FROM messages WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0] ? this.transformRow(result.rows[0]) : null;
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM messages WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.receiverId) {
      sql += ` AND receiver_id = $${paramCount++}`;
      params.push(filters.receiverId);
    }

    if (filters.isRead !== undefined) {
      sql += ` AND is_read = $${paramCount++}`;
      params.push(filters.isRead);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }

  static transformRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      subject: row.subject,
      message: row.message,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      isRead: row.is_read,
      readAt: row.read_at,
      priority: row.priority,
      createdAt: row.created_at,
      sender: row.senderName
        ? { name: row.senderName, username: row.senderUsername }
        : null,
      receiver: row.receiverName
        ? { name: row.receiverName, username: row.receiverUsername }
        : null,
    };
  }
}

export default Message;



