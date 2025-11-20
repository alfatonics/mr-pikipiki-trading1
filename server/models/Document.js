import { query } from "../config/database.js";

class Document {
  static async generateDocumentNumber() {
    const year = new Date().getFullYear();
    const result = await query(
      `SELECT COUNT(*) as count FROM documents WHERE document_number LIKE $1`,
      [`DOC-${year}-%`]
    );
    const count = parseInt(result.rows[0].count) || 0;
    const nextNumber = String(count + 1).padStart(3, "0");
    return `DOC-${year}-${nextNumber}`;
  }

  static transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      documentNumber: row.document_number,
      title: row.title,
      description: row.description,
      documentType: row.document_type,
      category: row.category,
      filePath: row.file_path,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      uploadedBy: row.uploaded_by,
      isConfidential: row.is_confidential,
      tags: row.tags || [],
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async create(data) {
    const {
      documentNumber,
      title,
      description,
      documentType,
      category,
      filePath,
      fileName,
      fileSize,
      mimeType,
      relatedEntityType,
      relatedEntityId,
      uploadedBy,
      isConfidential = false,
      tags = [],
      status = "active",
      notes,
    } = data;

    const finalDocumentNumber =
      documentNumber || (await this.generateDocumentNumber());

    const sql = `
      INSERT INTO documents (
        document_number, title, description, document_type, category,
        file_path, file_name, file_size, mime_type, related_entity_type,
        related_entity_id, uploaded_by, is_confidential, tags, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await query(sql, [
      finalDocumentNumber,
      title,
      description,
      documentType,
      category,
      filePath,
      fileName,
      fileSize,
      mimeType,
      relatedEntityType,
      relatedEntityId,
      uploadedBy,
      isConfidential,
      tags,
      status,
      notes,
    ]);

    return this.transformRow(result.rows[0]);
  }

  static async findById(id) {
    const sql = `
      SELECT d.*, 
             u.full_name as uploader_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...this.transformRow(row),
      uploaderName: row.uploader_name,
    };
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT d.*, 
             u.full_name as uploader_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.documentType) {
      sql += ` AND d.document_type = $${paramCount}`;
      params.push(filters.documentType);
      paramCount++;
    }

    if (filters.category) {
      sql += ` AND d.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.uploadedBy) {
      sql += ` AND d.uploaded_by = $${paramCount}`;
      params.push(filters.uploadedBy);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND d.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.relatedEntityType && filters.relatedEntityId) {
      sql += ` AND d.related_entity_type = $${paramCount} AND d.related_entity_id = $${
        paramCount + 1
      }`;
      params.push(filters.relatedEntityType, filters.relatedEntityId);
      paramCount += 2;
    }

    sql += ` ORDER BY d.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => ({
      ...this.transformRow(row),
      uploaderName: row.uploader_name,
    }));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      title: "title",
      description: "description",
      documentType: "document_type",
      category: "category",
      tags: "tags",
      status: "status",
      isConfidential: "is_confidential",
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
      UPDATE documents
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return this.transformRow(result.rows[0]);
  }

  static async delete(id) {
    const sql = `DELETE FROM documents WHERE id = $1`;
    await query(sql, [id]);
  }

  static async count(filters = {}) {
    let sql = `SELECT COUNT(*) as count FROM documents WHERE 1=1`;
    const params = [];
    let paramCount = 1;

    if (filters.documentType) {
      sql += ` AND document_type = $${paramCount}`;
      params.push(filters.documentType);
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

export default Document;

