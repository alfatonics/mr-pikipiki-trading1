import { query } from "../config/database.js";

class OwnershipTransfer {
  static async generateTransferNumber() {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) as count FROM ownership_transfers WHERE transfer_number LIKE $1`,
      [`TRF-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) || 0;
    const nextNumber = String(count + 1).padStart(4, "0");
    return `TRF-${year}-${nextNumber}`;
  }

  static async create(data) {
    const {
      motorcycleId,
      motorcycleNumber,
      previousOwnerName,
      previousOwnerTin,
      previousOwnerPhone,
      previousOwnerIdType,
      previousOwnerIdNumber,
      previousOwnerPassportImage,
      previousOwnerAccountPassword,
      newOwnerName,
      newOwnerTin,
      newOwnerPhone,
      newOwnerIdType,
      newOwnerIdNumber,
      newOwnerPassportImage,
      transferCost,
      isPaid,
      paymentDate,
      paymentProof,
      status = "pending",
      sourceLocation,
      sourceDescription,
      createdBy,
      notes,
    } = data;

    const transferNumber = await this.generateTransferNumber();

    const sql = `
      INSERT INTO ownership_transfers (
        transfer_number, motorcycle_id, motorcycle_number,
        previous_owner_name, previous_owner_tin, previous_owner_phone,
        previous_owner_id_type, previous_owner_id_number, previous_owner_passport_image,
        previous_owner_account_password,
        new_owner_name, new_owner_tin, new_owner_phone,
        new_owner_id_type, new_owner_id_number, new_owner_passport_image,
        transfer_cost, is_paid, payment_date, payment_proof,
        status, source_location, source_description, created_by, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *
    `;

    const result = await query(sql, [
      transferNumber,
      motorcycleId,
      motorcycleNumber,
      previousOwnerName,
      previousOwnerTin,
      previousOwnerPhone,
      previousOwnerIdType,
      previousOwnerIdNumber,
      previousOwnerPassportImage,
      previousOwnerAccountPassword, // Stored in plain text as requested
      newOwnerName,
      newOwnerTin,
      newOwnerPhone,
      newOwnerIdType,
      newOwnerIdNumber,
      newOwnerPassportImage,
      transferCost || 0,
      isPaid || false,
      paymentDate,
      paymentProof,
      status,
      sourceLocation,
      sourceDescription,
      createdBy,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT ot.*,
             u1.full_name as "createdByName", u1.username as "createdByUsername",
             u2.full_name as "approvedByName", u2.username as "approvedByUsername",
             m.brand as "motorcycleBrand", m.model as "motorcycleModel",
             m.chassis_number as "motorcycleChassisNumber"
      FROM ownership_transfers ot
      LEFT JOIN users u1 ON ot.created_by = u1.id
      LEFT JOIN users u2 ON ot.approved_by = u2.id
      LEFT JOIN motorcycles m ON ot.motorcycle_id = m.id
      WHERE ot.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT ot.*,
             u1.full_name as "createdByName", u1.username as "createdByUsername",
             u2.full_name as "approvedByName", u2.username as "approvedByUsername",
             m.brand as "motorcycleBrand", m.model as "motorcycleModel",
             m.chassis_number as "motorcycleChassisNumber"
      FROM ownership_transfers ot
      LEFT JOIN users u1 ON ot.created_by = u1.id
      LEFT JOIN users u2 ON ot.approved_by = u2.id
      LEFT JOIN motorcycles m ON ot.motorcycle_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND ot.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.createdBy) {
      sql += ` AND ot.created_by = $${paramCount++}`;
      params.push(filters.createdBy);
    }

    if (filters.motorcycleId) {
      sql += ` AND ot.motorcycle_id = $${paramCount++}`;
      params.push(filters.motorcycleId);
    }

    if (filters.search) {
      sql += ` AND (
        ot.transfer_number ILIKE $${paramCount} OR
        ot.motorcycle_number ILIKE $${paramCount} OR
        ot.previous_owner_name ILIKE $${paramCount} OR
        ot.new_owner_name ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ` ORDER BY ot.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async update(id, data) {
    const allowedFields = [
      "motorcycleId",
      "motorcycleNumber",
      "previousOwnerName",
      "previousOwnerTin",
      "previousOwnerPhone",
      "previousOwnerIdType",
      "previousOwnerIdNumber",
      "previousOwnerPassportImage",
      "previousOwnerAccountPassword",
      "newOwnerName",
      "newOwnerTin",
      "newOwnerPhone",
      "newOwnerIdType",
      "newOwnerIdNumber",
      "newOwnerPassportImage",
      "transferCost",
      "isPaid",
      "paymentDate",
      "paymentProof",
      "status",
      "sourceLocation",
      "sourceDescription",
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);
    const sql = `
      UPDATE ownership_transfers
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

  static async approve(id, approvedBy) {
    return await this.update(id, {
      status: "waiting_payment",
      approvedBy,
      approvedAt: new Date(),
    });
  }

  static async delete(id) {
    const sql = "DELETE FROM ownership_transfers WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static transformRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      transferNumber: row.transfer_number,
      motorcycleId: row.motorcycle_id,
      motorcycleNumber: row.motorcycle_number,
      previousOwner: {
        name: row.previous_owner_name,
        tin: row.previous_owner_tin,
        phone: row.previous_owner_phone,
        idType: row.previous_owner_id_type,
        idNumber: row.previous_owner_id_number,
        passportImage: row.previous_owner_passport_image,
        accountPassword: row.previous_owner_account_password, // Plain text
      },
      newOwner: {
        name: row.new_owner_name,
        tin: row.new_owner_tin,
        phone: row.new_owner_phone,
        idType: row.new_owner_id_type,
        idNumber: row.new_owner_id_number,
        passportImage: row.new_owner_passport_image,
      },
      transferCost: parseFloat(row.transfer_cost) || 0,
      isPaid: row.is_paid || false,
      paymentDate: row.payment_date,
      paymentProof: row.payment_proof,
      status: row.status,
      sourceLocation: row.source_location,
      sourceDescription: row.source_description,
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdByUser: row.createdByName
        ? {
            name: row.createdByName,
            username: row.createdByUsername,
          }
        : null,
      approvedByUser: row.approvedByName
        ? {
            name: row.approvedByName,
            username: row.approvedByUsername,
          }
        : null,
      motorcycle: row.motorcycleBrand
        ? {
            brand: row.motorcycleBrand,
            model: row.motorcycleModel,
            chassisNumber: row.motorcycleChassisNumber,
          }
        : null,
    };
  }
}

export default OwnershipTransfer;
