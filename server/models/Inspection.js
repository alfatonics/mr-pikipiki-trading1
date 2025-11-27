import { query } from "../config/database.js";

class Inspection {
  static async create(data) {
    const {
      motorcycleId,
      contractId,
      customerId,
      inspectionDate,
      staffName,
      staffSignature,
      mechanicName,
      mechanicSignature,
      externalAppearance = {},
      electricalSystem = {},
      engineSystem = {},
      sellerPhone,
      sellerPassportImage,
      sellerIdType,
      sellerIdNumber,
      sellerPhoneCalled = false,
      sellerAccountAccess,
      sellerAccountPassword,
      sellerOtpPhone,
      broughtBy,
      originLocation,
      brokerNumber,
      inspectionType,
      status = "pending",
      workflowStatus = "rama_pending",
      overallResult,
      notes,
    } = data;

    const sql = `
      INSERT INTO inspections (
        motorcycle_id, contract_id, customer_id, inspection_date,
        staff_name, staff_signature, mechanic_name, mechanic_signature,
        external_appearance, electrical_system, engine_system,
        seller_phone, seller_passport_image, seller_id_type, seller_id_number,
        seller_phone_called, seller_account_access, seller_account_password,
        seller_otp_phone, brought_by, origin_location, broker_number,
        inspection_type, status, workflow_status, overall_result, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING id, motorcycle_id as "motorcycleId", contract_id as "contractId", 
                customer_id as "customerId", inspection_date as "inspectionDate",
                staff_name as "staffName", staff_signature as "staffSignature",
                mechanic_name as "mechanicName", mechanic_signature as "mechanicSignature",
                external_appearance as "externalAppearance",
                electrical_system as "electricalSystem",
                engine_system as "engineSystem",
                seller_phone as "sellerPhone", seller_passport_image as "sellerPassportImage",
                seller_id_type as "sellerIdType", seller_id_number as "sellerIdNumber",
                seller_phone_called as "sellerPhoneCalled",
                seller_account_access as "sellerAccountAccess",
                seller_account_password as "sellerAccountPassword",
                seller_otp_phone as "sellerOtpPhone",
                brought_by as "broughtBy", origin_location as "originLocation",
                broker_number as "brokerNumber", inspection_type as "inspectionType",
                status, overall_result as "overallResult",
                notes, created_at as "createdAt", updated_at as "updatedAt"
    `;

    // Ensure all values are properly set, handle null/undefined
    const result = await query(sql, [
      motorcycleId || null,
      contractId || null,
      customerId || null, // Can be null for purchase contracts
      inspectionDate || new Date().toISOString().split("T")[0],
      staffName || null,
      staffSignature || null,
      mechanicName || null,
      mechanicSignature || null,
      JSON.stringify(externalAppearance || {}),
      JSON.stringify(electricalSystem || {}),
      JSON.stringify(engineSystem || {}),
      sellerPhone || null,
      sellerPassportImage || null,
      sellerIdType || null,
      sellerIdNumber || null,
      sellerPhoneCalled || false,
      sellerAccountAccess || null,
      sellerAccountPassword || null,
      sellerOtpPhone || null,
      broughtBy || null,
      originLocation || null,
      brokerNumber || null,
      inspectionType || null,
      status || "pending",
      workflowStatus || "rama_pending",
      overallResult || null,
      notes || null,
    ]);

    // Parse JSONB fields
    const row = result.rows[0];
    if (row.externalAppearance) {
      row.externalAppearance =
        typeof row.externalAppearance === "string"
          ? JSON.parse(row.externalAppearance)
          : row.externalAppearance;
    }
    if (row.electricalSystem) {
      row.electricalSystem =
        typeof row.electricalSystem === "string"
          ? JSON.parse(row.electricalSystem)
          : row.electricalSystem;
    }
    if (row.engineSystem) {
      row.engineSystem =
        typeof row.engineSystem === "string"
          ? JSON.parse(row.engineSystem)
          : row.engineSystem;
    }

    return row;
  }

  static async findById(id) {
    // Check if workflow_status column exists, if not use default
    const sql = `
      SELECT i.id, i.motorcycle_id, i.contract_id, i.customer_id, i.inspection_date,
             i.staff_name, i.staff_signature, i.mechanic_name, i.mechanic_signature,
             i.external_appearance, i.electrical_system, i.engine_system,
             i.seller_phone, i.seller_passport_image, i.seller_id_type, i.seller_id_number,
             i.seller_phone_called, i.seller_account_access, i.seller_account_password,
             i.seller_otp_phone, i.brought_by, i.origin_location, i.broker_number,
             i.inspection_type, i.status, 
             COALESCE(i.workflow_status, 'rama_pending') as "workflowStatus",
             i.overall_result, i.notes, i.created_at, i.updated_at,
             m.chassis_number as "motorcycleChassisNumber",
             m.engine_number as "motorcycleEngineNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel",
             m.year as "motorcycleYear",
             m.color as "motorcycleColor",
             m.registration_number as "motorcycleRegistrationNumber",
             c.full_name as "customerName",
             c.phone as "customerPhone",
             c.id_number as "customerIdNumber",
             c.id_type as "customerIdType",
             c.address as "customerAddress"
      FROM inspections i
      LEFT JOIN motorcycles m ON i.motorcycle_id = m.id
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1
    `;

    const result = await query(sql, [id]);
    if (result.rows[0]) {
      const row = result.rows[0];
      // Parse JSONB fields
      let externalAppearance = {};
      let electricalSystem = {};
      let engineSystem = {};

      if (row.external_appearance) {
        try {
          externalAppearance =
            typeof row.external_appearance === "string"
              ? JSON.parse(row.external_appearance)
              : row.external_appearance;
        } catch (e) {
          console.error("Error parsing external_appearance:", e);
          externalAppearance = {};
        }
      }

      if (row.electrical_system) {
        try {
          electricalSystem =
            typeof row.electrical_system === "string"
              ? JSON.parse(row.electrical_system)
              : row.electrical_system;
        } catch (e) {
          console.error("Error parsing electrical_system:", e);
          electricalSystem = {};
        }
      }

      if (row.engine_system) {
        try {
          engineSystem =
            typeof row.engine_system === "string"
              ? JSON.parse(row.engine_system)
              : row.engine_system;
        } catch (e) {
          console.error("Error parsing engine_system:", e);
          engineSystem = {};
        }
      }
      return {
        id: row.id,
        motorcycleId: row.motorcycle_id,
        contractId: row.contract_id,
        customerId: row.customer_id,
        inspectionDate: row.inspection_date,
        staffName: row.staff_name,
        staffSignature: row.staff_signature,
        mechanicName: row.mechanic_name,
        mechanicSignature: row.mechanic_signature,
        externalAppearance: externalAppearance,
        electricalSystem: electricalSystem,
        engineSystem: engineSystem,
        sellerPhone: row.seller_phone,
        sellerPassportImage: row.seller_passport_image,
        sellerIdType: row.seller_id_type,
        sellerIdNumber: row.seller_id_number,
        sellerPhoneCalled: row.seller_phone_called || false,
        sellerAccountAccess: row.seller_account_access,
        sellerAccountPassword: row.seller_account_password,
        sellerOtpPhone: row.seller_otp_phone,
        broughtBy: row.brought_by,
        originLocation: row.origin_location,
        brokerNumber: row.broker_number,
        inspectionType: row.inspection_type,
        status: row.status,
        workflowStatus:
          row.workflowStatus || row.workflow_status || "rama_pending",
        overallResult: row.overall_result,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        motorcycle: {
          chassisNumber: row.motorcycleChassisNumber,
          engineNumber: row.motorcycleEngineNumber,
          brand: row.motorcycleBrand,
          model: row.motorcycleModel,
          year: row.motorcycleYear,
          color: row.motorcycleColor,
          registrationNumber: row.motorcycleRegistrationNumber,
        },
        customer: row.customerName
          ? {
              name: row.customerName,
              phone: row.customerPhone,
              idNumber: row.customerIdNumber,
              idType: row.customerIdType,
              address: row.customerAddress,
            }
          : null,
      };
    }
    return null;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT i.id, i.motorcycle_id as "motorcycleId", i.contract_id as "contractId",
             i.customer_id as "customerId", i.inspection_date as "inspectionDate",
             i.staff_name as "staffName", i.mechanic_name as "mechanicName",
             i.status, COALESCE(i.workflow_status, 'rama_pending') as "workflowStatus", 
             i.overall_result as "overallResult",
             i.created_at as "createdAt", i.updated_at as "updatedAt",
             m.chassis_number as "motorcycleChassisNumber",
             m.brand as "motorcycleBrand",
             m.model as "motorcycleModel",
             c.full_name as "customerName"
      FROM inspections i
      LEFT JOIN motorcycles m ON i.motorcycle_id = m.id
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.motorcycleId) {
      sql += ` AND i.motorcycle_id = $${paramCount}`;
      params.push(filters.motorcycleId);
      paramCount++;
    }

    if (filters.contractId) {
      sql += ` AND i.contract_id = $${paramCount}`;
      params.push(filters.contractId);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.workflowStatus) {
      // Check if workflow_status column exists before filtering
      sql += ` AND COALESCE(i.workflow_status, 'rama_pending') = $${paramCount}`;
      params.push(filters.workflowStatus);
      paramCount++;
    }

    sql += " ORDER BY i.created_at DESC";

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      staffName: "staff_name",
      staffSignature: "staff_signature",
      mechanicName: "mechanic_name",
      mechanicSignature: "mechanic_signature",
      externalAppearance: "external_appearance",
      electricalSystem: "electrical_system",
      engineSystem: "engine_system",
      sellerPhone: "seller_phone",
      sellerPassportImage: "seller_passport_image",
      sellerIdType: "seller_id_type",
      sellerIdNumber: "seller_id_number",
      sellerPhoneCalled: "seller_phone_called",
      sellerAccountAccess: "seller_account_access",
      sellerAccountPassword: "seller_account_password",
      sellerOtpPhone: "seller_otp_phone",
      broughtBy: "brought_by",
      originLocation: "origin_location",
      brokerNumber: "broker_number",
      inspectionType: "inspection_type",
      status: "status",
      workflowStatus: "workflow_status",
      overallResult: "overall_result",
      notes: "notes",
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updateData[jsKey] !== undefined) {
        if (
          jsKey === "externalAppearance" ||
          jsKey === "electricalSystem" ||
          jsKey === "engineSystem"
        ) {
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
      UPDATE inspections
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, motorcycle_id as "motorcycleId", contract_id as "contractId",
                customer_id as "customerId", inspection_date as "inspectionDate",
                status, COALESCE(workflow_status, 'rama_pending') as "workflowStatus",
                overall_result as "overallResult", updated_at as "updatedAt"
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = "DELETE FROM inspections WHERE id = $1 RETURNING id";
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = "SELECT COUNT(*) as count FROM inspections WHERE 1=1";
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

export default Inspection;
