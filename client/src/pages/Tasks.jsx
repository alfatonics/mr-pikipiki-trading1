import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import TableWithSearch from "../components/TableWithSearch";
import {
  FiPlus,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiTruck,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const statusBadges = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
  completed: { color: "bg-green-100 text-green-800", label: "Completed" },
  cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
  overdue: { color: "bg-orange-100 text-orange-800", label: "Overdue" },
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [motorcycles, setMotorcycles] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemDescription: "",
    source: "",
    motorcycleId: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
    location: "",
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [motorcyclesRes, mechanicsRes] = await Promise.all([
        axios.get("/api/motorcycles"),
        axios.get("/api/users/by-role/mechanic"),
      ]);
      setMotorcycles(motorcyclesRes.data || []);
      setMechanics(mechanicsRes.data || []);
    } catch (error) {
      console.error("Failed to load dropdown data", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== "all") {
        params.status = filter;
      }
      const res = await axios.get("/api/tasks", { params });
      setTasks(res.data || []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { pending, inProgress, completed };
  }, [tasks]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!formData.motorcycleId || !formData.assignedTo) {
      alert("Please select a motorcycle and mechanic");
      return;
    }
    try {
      await axios.post("/api/tasks", {
        ...formData,
        taskType: "repair",
      });
      setAssignModalOpen(false);
      setFormData({
        title: "",
        description: "",
        problemDescription: "",
        source: "",
        motorcycleId: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
        location: "",
      });
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to assign task");
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      await axios.put(`/api/tasks/${task.id}`, { status });
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update task");
    }
  };

  const openViewModal = (task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };

  const columns = [
    {
      header: "Task ID",
      accessor: "taskNumber",
    },
    {
      header: "Bike",
      render: (row) => (
        <div>
          <p className="font-semibold">
            {row.motorcycle?.brand} {row.motorcycle?.model}
          </p>
          <p className="text-xs text-gray-500">
            {row.motorcycle?.chassisNumber}
          </p>
        </div>
      ),
    },
    {
      header: "Tatizo",
      render: (row) => row.problemDescription || row.description,
    },
    {
      header: "Chanzo",
      render: (row) => (
        <span className="inline-flex items-center text-sm text-gray-600">
          <FiMapPin className="mr-1" /> {row.source || "System"}
        </span>
      ),
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
      header: "Tarehe",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
    },
    {
      header: "Action",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            className="text-blue-600 hover:text-blue-800"
            title="View task"
            onClick={() => openViewModal(row)}
          >
            <FiEye />
          </button>
          {(user?.role === "admin" || user?.role === "transport") && (
            <button
              className="text-green-600 hover:text-green-800"
              title="Mark in progress"
              onClick={() => handleStatusChange(row, "in_progress")}
            >
              <FiClock />
            </button>
          )}
          {(user?.role === "admin" || user?.role === "transport") && (
            <button
              className="text-emerald-600 hover:text-emerald-800"
              title="Mark complete"
              onClick={() => handleStatusChange(row, "completed")}
            >
              <FiCheckCircle />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Task Management
            </h1>
            <p className="text-gray-600">
              Kazi zinazopelekwa na Gidion kwenda kwa fundi Dito
            </p>
          </div>
          {(user?.role === "admin" || user?.role === "transport") && (
            <Button onClick={() => setAssignModalOpen(true)}>
              <FiPlus className="inline mr-2" />
              Assign Task
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-gray-600">Pending Repairs</p>
            <p className="text-3xl font-bold text-yellow-600">
              {summary.pending}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">
              {summary.inProgress}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {summary.completed}
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap gap-3 mb-4">
            {["all", "pending", "in_progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filter === status
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Loading tasks...
            </div>
          ) : (
            <TableWithSearch
              columns={columns}
              data={tasks}
              searchKeys={[
                "taskNumber",
                "motorcycle.brand",
                "motorcycle.model",
                "description",
                "problemDescription",
              ]}
            />
          )}
        </Card>
      </div>

      {/* Assign Task Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign New Task"
        size="lg"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          <Select
            label="Motorcycle"
            value={formData.motorcycleId}
            onChange={(e) =>
              setFormData({ ...formData, motorcycleId: e.target.value })
            }
            options={[
              { value: "", label: "Select motorcycle" },
              ...motorcycles.map((bike) => ({
                value: bike.id,
                label: `${bike.brand} ${bike.model} (${bike.chassisNumber})`,
              })),
            ]}
            required
          />
          <Select
            label="Assign To"
            value={formData.assignedTo}
            onChange={(e) =>
              setFormData({ ...formData, assignedTo: e.target.value })
            }
            options={[
              { value: "", label: "Select mechanic" },
              ...mechanics.map((mech) => ({
                value: mech.id,
                label: mech.fullName || mech.username,
              })),
            ]}
            required
          />
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
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
          <Input
            label="Tatizo"
            value={formData.problemDescription}
            onChange={(e) =>
              setFormData({ ...formData, problemDescription: e.target.value })
            }
            placeholder="Engine / Brake / Wiring ..."
          />
          <Input
            label="Chanzo"
            value={formData.source}
            onChange={(e) =>
              setFormData({ ...formData, source: e.target.value })
            }
            placeholder="DSM / Mbeya / System"
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
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
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <FiPlus className="inline mr-2" />
              Assign Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Task Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Task Details"
      >
        {selectedTask && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-700">
              <FiTruck />
              <span className="font-semibold">
                {selectedTask.motorcycle?.brand}{" "}
                {selectedTask.motorcycle?.model}
              </span>
            </div>
            <p>
              <strong>Task ID:</strong> {selectedTask.taskNumber}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {selectedTask.assignedToName || "N/A"}
            </p>
            <p>
              <strong>Description:</strong> {selectedTask.description}
            </p>
            <p>
              <strong>Tatizo:</strong>{" "}
              {selectedTask.problemDescription || "N/A"}
            </p>
            <p>
              <strong>Chanzo:</strong> {selectedTask.source || "System"}
            </p>
            <p>
              <strong>Priority:</strong> {selectedTask.priority?.toUpperCase()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {statusBadges[selectedTask.status]?.label || selectedTask.status}
            </p>
            <p>
              <strong>Notes:</strong> {selectedTask.notes || "None"}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;

