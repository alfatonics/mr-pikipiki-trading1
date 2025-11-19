import { query } from "../config/database.js";
import Motorcycle from "./Motorcycle.js";

class RepairBill {
  static async generateBillNumber() {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) as count FROM repair_bills WHERE bill_number LIKE $1`,
      [`RB-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) || 0;
    const nextNumber = String(count + 1).padStart(3, "0");
    return `RB-${year}-${nextNumber}`;
  }

  static async create(data) {
    const {
      repairId,
      motorcycleId,
      mechanicId,
      laborCost,
      sparePartsCost,
      totalAmount,
      currency = "TZS",
      description,
      proofOfWork,
      repairDate,
      sentBy,
      notes,
    } = data;

    const computedTotal =
      totalAmount !== undefined
        ? parseFloat(totalAmount)
        : (parseFloat(laborCost) || 0) + (parseFloat(sparePartsCost) || 0);

    const billNumber = await this.generateBillNumber();

    const sql = `
      INSERT INTO repair_bills (
        bill_number, repair_id, motorcycle_id, mechanic_id,
        labor_cost, spare_parts_cost, total_amount, currency,
        description, proof_of_work, repair_date, sent_by, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(sql, [
      billNumber,
      repairId,
      motorcycleId,
      mechanicId,
      laborCost,
      sparePartsCost,
      computedTotal,
      currency,
      description,
      proofOfWork,
      repairDate,
      sentBy,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT rb.*,
             m.brand as "motorcycleBrand", m.model as "motorcycleModel",
             m.chassis_number as "motorcycleChassisNumber",
             u.full_name as "mechanicName", u.username as "mechanicUsername",
             u2.full_name as "sentByName", u2.username as "sentByUsername",
             r.description as "repairDescription", r.repair_type as "repairType"
      FROM repair_bills rb
      LEFT JOIN motorcycles m ON rb.motorcycle_id = m.id
      LEFT JOIN users u ON rb.mechanic_id = u.id
      LEFT JOIN users u2 ON rb.sent_by = u2.id
      LEFT JOIN repairs r ON rb.repair_id = r.id
      WHERE rb.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows[0]) {
      return this.transformRow(result.rows[0]);
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT rb.*,
             m.brand as "motorcycleBrand", m.model as "motorcycleModel",
             m.chassis_number as "motorcycleChassisNumber",
             u.full_name as "mechanicName", u.username as "mechanicUsername",
             u2.full_name as "sentByName", u2.username as "sentByUsername",
             r.description as "repairDescription", r.repair_type as "repairType"
      FROM repair_bills rb
      LEFT JOIN motorcycles m ON rb.motorcycle_id = m.id
      LEFT JOIN users u ON rb.mechanic_id = u.id
      LEFT JOIN users u2 ON rb.sent_by = u2.id
      LEFT JOIN repairs r ON rb.repair_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.mechanicId) {
      sql += ` AND rb.mechanic_id = $${paramCount++}`;
      params.push(filters.mechanicId);
    }

    if (filters.status) {
      sql += ` AND rb.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.repairId) {
      sql += ` AND rb.repair_id = $${paramCount++}`;
      params.push(filters.repairId);
    }

    if (filters.motorcycleId) {
      sql += ` AND rb.motorcycle_id = $${paramCount++}`;
      params.push(filters.motorcycleId);
    }

    if (filters.dateFrom) {
      sql += ` AND rb.repair_date >= $${paramCount++}`;
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      sql += ` AND rb.repair_date <= $${paramCount++}`;
      params.push(filters.dateTo);
    }

    sql += ` ORDER BY rb.created_at DESC`;

    const result = await query(sql, params);
    return result.rows.map((row) => this.transformRow(row));
  }

  static async update(id, data) {
    const allowedFields = [
      "status",
      "sentToCashierAt",
      "paymentApprovedBy",
      "paymentApprovedAt",
      "paymentRejectedBy",
      "paymentRejectedAt",
      "rejectionReason",
      "paidAt",
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
      UPDATE repair_bills
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

  static async sendToCashier(id, sentBy) {
    return await this.update(id, {
      status: "sent_to_cashier",
      sentToCashierAt: new Date(),
      sentBy,
    });
  }

  static async approvePayment(id, approvedBy) {
    return await this.update(id, {
      status: "payment_approved",
      paymentApprovedBy: approvedBy,
      paymentApprovedAt: new Date(),
    });
  }

  static async rejectPayment(id, rejectedBy, rejectionReason) {
    return await this.update(id, {
      status: "payment_rejected",
      paymentRejectedBy: rejectedBy,
      paymentRejectedAt: new Date(),
      rejectionReason,
    });
  }

  static async markAsPaid(id) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    if (existing.status === "paid") {
      return existing;
    }

    const updated = await this.update(id, {
      status: "paid",
      paidAt: new Date(),
    });

    if (updated?.motorcycleId && updated?.totalAmount) {
      await Motorcycle.addMaintenanceCost(
        updated.motorcycleId,
        parseFloat(updated.totalAmount) || 0
      );
    }

    return updated;
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM repair_bills WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.mechanicId) {
      sql += ` AND mechanic_id = $${paramCount++}`;
      params.push(filters.mechanicId);
    }

    if (filters.status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count) || 0;
  }

  static transformRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      billNumber: row.bill_number,
      repairId: row.repair_id,
      motorcycleId: row.motorcycle_id,
      mechanicId: row.mechanic_id,
      laborCost: parseFloat(row.labor_cost) || 0,
      sparePartsCost: parseFloat(row.spare_parts_cost) || 0,
      totalAmount: parseFloat(row.total_amount) || 0,
      currency: row.currency,
      description: row.description,
      proofOfWork: row.proof_of_work,
      repairDate: row.repair_date,
      status: row.status,
      sentToCashierAt: row.sent_to_cashier_at,
      sentBy: row.sent_by,
      paymentApprovedBy: row.payment_approved_by,
      paymentApprovedAt: row.payment_approved_at,
      paymentRejectedBy: row.payment_rejected_by,
      paymentRejectedAt: row.payment_rejected_at,
      rejectionReason: row.rejection_reason,
      paidAt: row.paid_at,
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
      mechanic: row.mechanicName
        ? {
            name: row.mechanicName,
            username: row.mechanicUsername,
          }
        : null,
      sentByUser: row.sentByName
        ? {
            name: row.sentByName,
            username: row.sentByUsername,
          }
        : null,
      repair: row.repairDescription
        ? {
            description: row.repairDescription,
            type: row.repairType,
          }
        : null,
    };
  }
}

export default RepairBill;
