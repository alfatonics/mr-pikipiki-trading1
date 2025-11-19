import { query } from "../config/database.js";

class Transport {
  static async create(data) {
    const {
      motorcycleId,
      customerId,
      driverId,
      pickupLocation,
      deliveryLocation,
      scheduledDate,
      actualDeliveryDate,
      status = "pending",
      transportCost = 0,
      notes,
      customerSignature,
    } = data;

    const sql = `
      INSERT INTO transport (motorcycle_id, customer_id, driver_id, pickup_location, delivery_location,
                            scheduled_date, actual_delivery_date, status, transport_cost, notes, customer_signature)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, motorcycle_id as "motorcycleId", customer_id as "customerId", driver_id as "driverId",
                pickup_location as "pickupLocation", delivery_location as "deliveryLocation",
                scheduled_date as "scheduledDate", actual_delivery_date as "actualDeliveryDate",
                status, transport_cost as "transportCost", notes, customer_signature as "customerSignature",
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await query(sql, [
      motorcycleId,
      customerId,
      driverId,
      pickupLocation,
      deliveryLocation,
      scheduledDate,
      actualDeliveryDate,
      status,
      transportCost,
      notes,
      customerSignature,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const sql = `
      SELECT t.*,
             m.chassis_number as "motorcycleChassisNumber",
             c.full_name as "customerName",
             u.full_name as "driverName"
      FROM transport t
      LEFT JOIN motorcycles m ON t.motorcycle_id = m.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.driver_id = u.id
      WHERE t.id = $1
    `;

    const result = await query(sql, [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id,
        motorcycleId: row.motorcycle_id,
        customerId: row.customer_id,
        driverId: row.driver_id,
        pickupLocation: row.pickup_location,
        deliveryLocation: row.delivery_location,
        scheduledDate: row.scheduled_date,
        actualDeliveryDate: row.actual_delivery_date,
        status: row.status,
        transportCost: row.transport_cost,
        notes: row.notes,
        customerSignature: row.customer_signature,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        motorcycleChassisNumber: row.motorcycleChassisNumber,
        customerName: row.customerName,
        driverName: row.driverName,
      };
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT t.id, t.motorcycle_id as "motorcycleId", t.customer_id as "customerId", t.driver_id as "driverId",
             t.pickup_location as "pickupLocation", t.delivery_location as "deliveryLocation",
             t.scheduled_date as "scheduledDate", t.actual_delivery_date as "actualDeliveryDate",
             t.status, t.transport_cost as "transportCost", t.notes,
             t.created_at as "createdAt", t.updated_at as "updatedAt",
             m.chassis_number as "motorcycleChassisNumber",
             c.full_name as "customerName",
             u.full_name as "driverName"
      FROM transport t
      LEFT JOIN motorcycles m ON t.motorcycle_id = m.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.driver_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND t.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.driverId) {
      sql += ` AND t.driver_id = $${paramCount}`;
      params.push(filters.driverId);
      paramCount++;
    }

    sql += " ORDER BY t.scheduled_date DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      status: "status",
      actualDeliveryDate: "actual_delivery_date",
      notes: "notes",
      customerSignature: "customer_signature",
      transportCost: "transport_cost",
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
      UPDATE transport
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, status, updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM transport WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM transport WHERE 1=1";
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

export default Transport;
