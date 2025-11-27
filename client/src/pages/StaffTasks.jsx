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
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

const StaffTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    taskCategory: "general",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/staff-tasks");
      setTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching staff tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axios.put(`/api/staff-tasks/${editingTask.id}`, formData);
      } else {
        await axios.post("/api/staff-tasks", formData);
      }
      fetchTasks();
      handleCloseModal();
    } catch (error) {
      alert(
        "Failed to save task: " + (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/api/staff-tasks/${id}`);
      fetchTasks();
    } catch (error) {
      alert(
        "Failed to delete task: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      taskCategory: task.taskCategory || "general",
      priority: task.priority || "medium",
      assignedTo: task.assignedTo,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      taskCategory: "general",
      priority: "medium",
      assignedTo: "",
      dueDate: "",
    });
  };

  const statusBadges = {
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    on_hold: { color: "bg-gray-100 text-gray-800", label: "On Hold" },
  };

  const columns = [
    { header: "Task #", accessor: "taskNumber" },
    { header: "Title", accessor: "title" },
    { header: "Assigned To", render: (row) => row.assigneeName || "N/A" },
    {
      header: "Due Date",
      render: (row) =>
        row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "N/A",
    },
    {
      header: "Status",
      render: (row) => {
        const badge = statusBadges[row.status] || statusBadges.pending;
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
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => handleEdit(row)}>
            <FiEdit />
          </Button>
          {(user?.role === "secretary" || user?.role === "admin") && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.id)}
            >
              <FiTrash2 />
            </Button>
          )}
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
              Staff Tasks
            </h1>
            <p className="text-gray-600">Monitor and manage staff tasks</p>
          </div>
          {(user?.role === "secretary" || user?.role === "admin") && (
            <Button onClick={() => setModalOpen(true)}>
              <FiPlus className="inline mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found.
            </div>
          ) : (
            <TableWithSearch columns={columns} data={tasks} />
          )}
        </Card>
      </div>

      {/* Create/Edit Task Modal */}
      {(user?.role === "secretary" || user?.role === "admin") && (
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={editingTask ? "Edit Task" : "Add New Task"}
          size="md"
        >
          <form onSubmit={handleSubmit}>
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <Input
              label="Description"
              type="textarea"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="4"
              required
            />
            <Select
              label="Category"
              value={formData.taskCategory}
              onChange={(e) =>
                setFormData({ ...formData, taskCategory: e.target.value })
              }
              options={[
                { value: "general", label: "General" },
                { value: "administrative", label: "Administrative" },
                { value: "sales", label: "Sales" },
                { value: "customer_service", label: "Customer Service" },
                { value: "documentation", label: "Documentation" },
                { value: "reporting", label: "Reporting" },
                { value: "other", label: "Other" },
              ]}
            />
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
            />
            <Select
              label="Assign To"
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
              options={[
                { value: "", label: "Select Staff" },
                ...users.map((u) => ({ value: u.id, label: u.fullName })),
              ]}
              required
            />
            <Input
              label="Due Date"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
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
                {editingTask ? "Update" : "Create"} Task
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StaffTasks;



