import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import TableWithSearch from "../components/TableWithSearch";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBox,
  FiPackage,
  FiAlertCircle,
} from "react-icons/fi";

const OfficeSupplies = () => {
  const { user } = useAuth();
  const [supplies, setSupplies] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    category: "general",
    quantity: 0,
    unit: "piece",
    unitPrice: 0,
    supplier: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/office-supplies");
      setSupplies(response.data || []);
    } catch (error) {
      console.error("Error fetching office supplies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupply) {
        await axios.put(`/api/office-supplies/${editingSupply.id}`, formData);
      } else {
        await axios.post("/api/office-supplies", formData);
      }
      fetchSupplies();
      handleCloseModal();
    } catch (error) {
      alert(
        "Failed to save office supply: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this office supply?")) return;
    try {
      await axios.delete(`/api/office-supplies/${id}`);
      fetchSupplies();
    } catch (error) {
      alert(
        "Failed to delete office supply: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleEdit = (supply) => {
    setEditingSupply(supply);
    setFormData({
      name: supply.name || "",
      category: supply.category || "general",
      quantity: supply.quantity || 0,
      unit: supply.unit || "piece",
      unitPrice: supply.unitPrice || supply.unit_price || 0,
      supplier: supply.supplier || "",
      location: supply.location || "",
      notes: supply.notes || "",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSupply(null);
    setFormData({
      name: "",
      category: "general",
      quantity: 0,
      unit: "piece",
      unitPrice: 0,
      supplier: "",
      location: "",
      notes: "",
    });
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0)
      return { color: "bg-red-100 text-red-800", label: "Out of Stock" };
    if (quantity < 10)
      return { color: "bg-yellow-100 text-yellow-800", label: "Low Stock" };
    return { color: "bg-green-100 text-green-800", label: "In Stock" };
  };

  const columns = [
    { header: "Name", accessor: "name" },
    {
      header: "Category",
      render: (row) => (
        <span className="capitalize">{row.category || "general"}</span>
      ),
    },
    {
      header: "Quantity",
      render: (row) => `${row.quantity || 0} ${row.unit || "piece"}`,
    },
    {
      header: "Unit Price",
      render: (row) =>
        `TZS ${(row.unitPrice || row.unit_price || 0).toLocaleString()}`,
    },
    {
      header: "Total Value",
      render: (row) => {
        const qty = row.quantity || 0;
        const price = row.unitPrice || row.unit_price || 0;
        return `TZS ${(qty * price).toLocaleString()}`;
      },
    },
    {
      header: "Stock Status",
      render: (row) => {
        const status = getStockStatus(row.quantity);
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
          >
            {status.label}
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Office Supplies
            </h1>
            <p className="text-gray-600">Manage office supplies inventory</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Add Supply
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading supplies...</div>
          ) : supplies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No office supplies found. Add your first supply to get started.
            </div>
          ) : (
            <TableWithSearch columns={columns} data={supplies} />
          )}
        </Card>
      </div>

      {/* Create/Edit Supply Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingSupply ? "Edit Office Supply" : "Add Office Supply"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "general", label: "General" },
              { value: "stationery", label: "Stationery" },
              { value: "cleaning", label: "Cleaning Supplies" },
              { value: "electronics", label: "Electronics" },
              { value: "furniture", label: "Furniture" },
              { value: "other", label: "Other" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              required
              min="0"
            />
            <Select
              label="Unit"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              options={[
                { value: "piece", label: "Piece" },
                { value: "box", label: "Box" },
                { value: "pack", label: "Pack" },
                { value: "roll", label: "Roll" },
                { value: "bottle", label: "Bottle" },
                { value: "kg", label: "Kilogram" },
                { value: "liter", label: "Liter" },
              ]}
            />
          </div>
          <Input
            label="Unit Price (TZS)"
            type="number"
            value={formData.unitPrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                unitPrice: parseFloat(e.target.value) || 0,
              })
            }
            min="0"
            step="0.01"
          />
          <Input
            label="Supplier"
            value={formData.supplier}
            onChange={(e) =>
              setFormData({ ...formData, supplier: e.target.value })
            }
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="e.g., Storage Room A, Shelf 3"
          />
          <Input
            label="Notes"
            type="textarea"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows="3"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingSupply ? "Update" : "Add"} Supply
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OfficeSupplies;
