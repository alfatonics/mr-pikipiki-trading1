import bcrypt from "bcryptjs";
import { query } from "../config/database.js";

class User {
  // Create a new user
  static async create(userData) {
    const {
      username,
      password,
      fullName,
      role,
      email,
      phone,
      isActive = true,
    } = userData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (username, password, full_name, role, email, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, full_name as "fullName", role, email, phone, is_active as "isActive", 
                last_login as "lastLogin", created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      username,
      hashedPassword,
      fullName,
      role,
      email,
      phone,
      isActive,
    ]);
    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const sql = `
      SELECT id, username, password, full_name as "fullName", role, email, phone, 
             is_active as "isActive", last_login as "lastLogin", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE username = $1
    `;

    const result = await query(sql, [username]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const sql = `
      SELECT id, username, full_name as "fullName", role, email, phone, 
             is_active as "isActive", last_login as "lastLogin", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Find all users
  static async findAll(filters = {}) {
    let sql = `
      SELECT id, username, full_name as "fullName", role, email, phone, 
             is_active as "isActive", last_login as "lastLogin", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.role) {
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    sql += " ORDER BY created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  // Update user
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.fullName !== undefined) {
      fields.push(`full_name = $${paramCount}`);
      values.push(updateData.fullName);
      paramCount++;
    }

    if (updateData.email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(updateData.email);
      paramCount++;
    }

    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramCount}`);
      values.push(updateData.phone);
      paramCount++;
    }

    if (updateData.role !== undefined) {
      fields.push(`role = $${paramCount}`);
      values.push(updateData.role);
      paramCount++;
    }

    if (updateData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(updateData.isActive);
      paramCount++;
    }

    if (updateData.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      fields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const sql = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, username, full_name as "fullName", role, email, phone, 
                is_active as "isActive", last_login as "lastLogin", 
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update last login
  static async updateLastLogin(id) {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Delete user
  static async delete(id) {
    const sql = "DELETE FROM users WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Count users
  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM users WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.role) {
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
      paramCount++;
    }

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

export default User;
