import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import TableWithSearch from "../components/TableWithSearch";
import DocumentPreview from "../components/DocumentPreview";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiEye,
  FiUpload,
  FiFileText,
  FiFolder,
} from "react-icons/fi";

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general",
    tags: "",
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/documents");
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a file to upload");
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", uploadFile);
      uploadFormData.append("name", formData.name);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("category", formData.category);
      if (formData.tags) {
        uploadFormData.append("tags", formData.tags);
      }

      await axios.post("/api/documents", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      fetchDocuments();
      handleCloseUploadModal();
    } catch (error) {
      alert(
        "Failed to upload document: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      fetchDocuments();
    } catch (error) {
      alert(
        "Failed to delete document: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handlePreview = (document) => {
    setSelectedDocument(document);
    setPreviewModalOpen(true);
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(
        `/api/documents/${document.id}/download`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", document.fileName || document.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download document: " + error.message);
    }
  };

  const handleEdit = (document) => {
    setEditingDocument(document);
    setFormData({
      name: document.name || "",
      description: document.description || "",
      category: document.category || "general",
      tags: document.tags
        ? Array.isArray(document.tags)
          ? document.tags.join(", ")
          : document.tags
        : "",
    });
    setModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/documents/${editingDocument.id}`, formData);
      fetchDocuments();
      handleCloseModal();
    } catch (error) {
      alert(
        "Failed to update document: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDocument(null);
    setFormData({
      name: "",
      description: "",
      category: "general",
      tags: "",
    });
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setUploadFile(null);
    setFormData({
      name: "",
      description: "",
      category: "general",
      tags: "",
    });
  };

  const categoryBadges = {
    general: { color: "bg-gray-100 text-gray-800", label: "General" },
    contract: { color: "bg-blue-100 text-blue-800", label: "Contract" },
    invoice: { color: "bg-green-100 text-green-800", label: "Invoice" },
    report: { color: "bg-purple-100 text-purple-800", label: "Report" },
    legal: { color: "bg-red-100 text-red-800", label: "Legal" },
    other: { color: "bg-yellow-100 text-yellow-800", label: "Other" },
  };

  const columns = [
    { header: "Name", accessor: "name" },
    {
      header: "Category",
      render: (row) => {
        const badge = categoryBadges[row.category] || categoryBadges.general;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}
          >
            {badge.label}
          </span>
        );
      },
    },
    {
      header: "File Name",
      render: (row) => row.fileName || row.file_name || "N/A",
    },
    {
      header: "Uploaded",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
    {
      header: "Uploaded By",
      render: (row) => row.uploadedByName || row.uploaded_by_name || "N/A",
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handlePreview(row)}
          >
            <FiEye />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDownload(row)}
          >
            <FiDownload />
          </Button>
          <Button size="sm" onClick={() => handleEdit(row)}>
            <FiEdit />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.id)}
          >
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Documents</h1>
            <p className="text-gray-600">Manage and organize documents</p>
          </div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <FiUpload className="inline mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents found. Upload your first document to get started.
            </div>
          ) : (
            <TableWithSearch columns={columns} data={documents} />
          )}
        </Card>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={handleCloseUploadModal}
        title="Upload Document"
        size="lg"
      >
        <form onSubmit={handleUpload}>
          <Input
            label="File"
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            required
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows="3"
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "general", label: "General" },
              { value: "contract", label: "Contract" },
              { value: "invoice", label: "Invoice" },
              { value: "report", label: "Report" },
              { value: "legal", label: "Legal" },
              { value: "other", label: "Other" },
            ]}
          />
          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., important, contract, 2024"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseUploadModal}
            >
              Cancel
            </Button>
            <Button type="submit">Upload Document</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Document Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Edit Document"
        size="lg"
      >
        <form onSubmit={handleUpdate}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows="3"
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "general", label: "General" },
              { value: "contract", label: "Contract" },
              { value: "invoice", label: "Invoice" },
              { value: "report", label: "Report" },
              { value: "legal", label: "Legal" },
              { value: "other", label: "Other" },
            ]}
          />
          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., important, contract, 2024"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit">Update Document</Button>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedDocument(null);
        }}
        documentUrl={
          selectedDocument?.fileUrl ||
          selectedDocument?.file_url ||
          (selectedDocument?.fileName
            ? `/api/documents/${selectedDocument.id}/download`
            : null)
        }
        documentName={selectedDocument?.name}
        documentType={selectedDocument?.fileType || selectedDocument?.file_type}
      />
    </div>
  );
};

export default Documents;
