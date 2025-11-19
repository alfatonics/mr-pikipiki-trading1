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
  FiClock,
  FiUserCheck,
  FiCalendar,
} from "react-icons/fi";

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: "",
  });

  useEffect(() => {
    fetchAttendance();
    fetchUsers();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/attendance");
      setAttendance(response.data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
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
      if (editingRecord) {
        await axios.put(`/api/attendance/${editingRecord.id}`, formData);
      } else {
        await axios.post("/api/attendance", formData);
      }
      fetchAttendance();
      handleCloseModal();
    } catch (error) {
      alert(
        "Failed to save attendance: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this attendance record?"))
      return;
    try {
      await axios.delete(`/api/attendance/${id}`);
      fetchAttendance();
    } catch (error) {
      alert(
        "Failed to delete attendance: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      userId: record.userId || record.user_id || "",
      date: record.date
        ? record.date.split("T")[0]
        : new Date().toISOString().split("T")[0],
      checkIn: record.checkIn || record.check_in || "",
      checkOut: record.checkOut || record.check_out || "",
      status: record.status || "present",
      notes: record.notes || "",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    setFormData({
      userId:
        user?.role === "admin" || user?.role === "secretary"
          ? ""
          : user?.id || "",
      date: new Date().toISOString().split("T")[0],
      checkIn: "",
      checkOut: "",
      status: "present",
      notes: "",
    });
  };

  const statusBadges = {
    present: { color: "bg-green-100 text-green-800", label: "Present" },
    absent: { color: "bg-red-100 text-red-800", label: "Absent" },
    late: { color: "bg-yellow-100 text-yellow-800", label: "Late" },
    leave: { color: "bg-blue-100 text-blue-800", label: "On Leave" },
  };

  const columns = [
    {
      header: "Staff Member",
      render: (row) => row.userName || row.user_name || "N/A",
    },
    {
      header: "Date",
      render: (row) =>
        row.date ? new Date(row.date).toLocaleDateString() : "N/A",
    },
    {
      header: "Check In",
      render: (row) => row.checkIn || row.check_in || "N/A",
    },
    {
      header: "Check Out",
      render: (row) => row.checkOut || row.check_out || "N/A",
    },
    {
      header: "Status",
      render: (row) => {
        const badge = statusBadges[row.status] || statusBadges.present;
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
          {(user?.role === "admin" || user?.role === "secretary") && (
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
              Staff Attendance
            </h1>
            <p className="text-gray-600">Manage staff attendance records</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Record Attendance
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading attendance...</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records found.
            </div>
          ) : (
            <TableWithSearch columns={columns} data={attendance} />
          )}
        </Card>
      </div>

      {/* Create/Edit Attendance Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingRecord ? "Edit Attendance" : "Record Attendance"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {(user?.role === "admin" || user?.role === "secretary") && (
            <Select
              label="Staff Member"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              options={users.map((u) => ({
                value: u.id,
                label: u.fullName || u.full_name || u.username,
              }))}
              required
            />
          )}
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Check In Time"
            type="time"
            value={formData.checkIn}
            onChange={(e) =>
              setFormData({ ...formData, checkIn: e.target.value })
            }
          />
          <Input
            label="Check Out Time"
            type="time"
            value={formData.checkOut}
            onChange={(e) =>
              setFormData({ ...formData, checkOut: e.target.value })
            }
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            options={[
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "late", label: "Late" },
              { value: "leave", label: "On Leave" },
            ]}
            required
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
              {editingRecord ? "Update" : "Record"} Attendance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
