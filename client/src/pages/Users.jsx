import { useState, useEffect } from "react";
import axios from "axios";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import TableWithSearch from "../components/TableWithSearch";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "staff",
    email: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data);
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Always send password field, even if empty (server will handle it)
        const updateData = { ...formData };
        await axios.put(`/api/users/${editingUser._id}`, updateData);
      } else {
        await axios.post("/api/users", formData);
      }
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to save user";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to delete user");
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "", // Don't populate password for security
      fullName: user.fullName,
      role: user.role,
      email: user.email || "",
      phone: user.phone || "",
      isActive: user.isActive,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      fullName: "",
      role: "staff",
      email: "",
      phone: "",
      isActive: true,
    });
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: "Admin",
      sales: "Sales",
      registration: "Registration",
      secretary: "Secretary",
      transport: "Transport",
      mechanic: "Mechanic",
      staff: "Staff",
    };
    return roleLabels[role] || role;
  };

  const columns = [
    { header: "Username", accessor: "username" },
    { header: "Full Name", accessor: "fullName" },
    {
      header: "Role",
      render: (row) => (
        <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
          {getRoleLabel(row.role)}
        </span>
      ),
    },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
    {
      header: "Last Login",
      render: (row) =>
        row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : "Never",
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 sm:p-0"
            title="Edit"
          >
            <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-800 p-1 sm:p-0"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
              User Management
            </h1>
            <p className="text-gray-600">Manage system users and permissions</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card>
          <TableWithSearch
            columns={columns}
            data={users}
            searchKeys={["username", "fullName", "email", "phone", "role"]}
          />
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingUser ? "Edit User" : "Add New User"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              disabled={!!editingUser}
            />
            <Input
              label={
                editingUser
                  ? "Password (leave blank to keep current)"
                  : "Password"
              }
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!editingUser}
            />
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
            />
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              options={[
                { value: "admin", label: "Admin" },
                { value: "sales", label: "Sales" },
                { value: "registration", label: "Registration" },
                { value: "secretary", label: "Secretary" },
                { value: "transport", label: "Transport" },
                { value: "mechanic", label: "Mechanic" },
                { value: "staff", label: "Staff" },
              ]}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active User
                </span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit">{editingUser ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
