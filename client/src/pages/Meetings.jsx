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
  FiCalendar,
  FiUsers,
  FiFileText,
} from "react-icons/fi";

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    agenda: "",
    scheduledDate: "",
    location: "",
    meetingType: "regular",
    participants: [],
  });

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/meetings");
      setMeetings(response.data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
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
      if (editingMeeting) {
        await axios.put(`/api/meetings/${editingMeeting.id}`, formData);
      } else {
        await axios.post("/api/meetings", formData);
      }
      fetchMeetings();
      handleCloseModal();
    } catch (error) {
      alert(
        "Failed to save meeting: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await axios.delete(`/api/meetings/${id}`);
      fetchMeetings();
    } catch (error) {
      alert(
        "Failed to delete meeting: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      agenda: meeting.agenda,
      scheduledDate: meeting.scheduledDate
        ? new Date(meeting.scheduledDate).toISOString().slice(0, 16)
        : "",
      location: meeting.location || "",
      meetingType: meeting.meetingType || "regular",
      participants: meeting.participants || [],
    });
    setModalOpen(true);
  };

  const handleView = (meeting) => {
    setSelectedMeeting(meeting);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMeeting(null);
    setFormData({
      title: "",
      agenda: "",
      scheduledDate: "",
      location: "",
      meetingType: "regular",
      participants: [],
    });
  };

  const statusBadges = {
    scheduled: { color: "bg-blue-100 text-blue-800", label: "Scheduled" },
    in_progress: {
      color: "bg-yellow-100 text-yellow-800",
      label: "In Progress",
    },
    completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    postponed: { color: "bg-gray-100 text-gray-800", label: "Postponed" },
  };

  const columns = [
    { header: "Meeting #", accessor: "meetingNumber" },
    { header: "Title", accessor: "title" },
    {
      header: "Scheduled Date",
      render: (row) =>
        row.scheduledDate
          ? new Date(row.scheduledDate).toLocaleString()
          : "N/A",
    },
    { header: "Location", accessor: "location" },
    {
      header: "Status",
      render: (row) => {
        const badge = statusBadges[row.status] || statusBadges.scheduled;
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
          <Button size="sm" variant="secondary" onClick={() => handleView(row)}>
            <FiFileText />
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Meetings & Minutes
            </h1>
            <p className="text-gray-600">Manage office meetings and minutes</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Add Meeting
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No meetings found.
            </div>
          ) : (
            <TableWithSearch columns={columns} data={meetings} />
          )}
        </Card>
      </div>

      {/* Create/Edit Meeting Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingMeeting ? "Edit Meeting" : "Add New Meeting"}
        size="lg"
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
            label="Agenda"
            type="textarea"
            value={formData.agenda}
            onChange={(e) =>
              setFormData({ ...formData, agenda: e.target.value })
            }
            rows="4"
            required
          />
          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={formData.scheduledDate}
            onChange={(e) =>
              setFormData({ ...formData, scheduledDate: e.target.value })
            }
            required
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
          <Select
            label="Meeting Type"
            value={formData.meetingType}
            onChange={(e) =>
              setFormData({ ...formData, meetingType: e.target.value })
            }
            options={[
              { value: "regular", label: "Regular" },
              { value: "emergency", label: "Emergency" },
              { value: "planning", label: "Planning" },
              { value: "review", label: "Review" },
              { value: "other", label: "Other" },
            ]}
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
              {editingMeeting ? "Update" : "Create"} Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Meeting Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedMeeting?.title || "Meeting Details"}
        size="lg"
      >
        {selectedMeeting && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p>
                <strong>Meeting #:</strong> {selectedMeeting.meetingNumber}
              </p>
              <p>
                <strong>Type:</strong> {selectedMeeting.meetingType}
              </p>
              <p>
                <strong>Scheduled:</strong>{" "}
                {new Date(selectedMeeting.scheduledDate).toLocaleString()}
              </p>
              <p>
                <strong>Location:</strong> {selectedMeeting.location || "N/A"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {statusBadges[selectedMeeting.status]?.label}
              </p>
              <p>
                <strong>Organized By:</strong>{" "}
                {selectedMeeting.organizerName || "N/A"}
              </p>
            </div>
            <div>
              <strong>Agenda:</strong>
              <p className="mt-2 text-gray-700">{selectedMeeting.agenda}</p>
            </div>
            {selectedMeeting.minutes && (
              <div>
                <strong>Minutes:</strong>
                <p className="mt-2 text-gray-700">{selectedMeeting.minutes}</p>
              </div>
            )}
            {selectedMeeting.decisions && (
              <div>
                <strong>Decisions:</strong>
                <p className="mt-2 text-gray-700">
                  {selectedMeeting.decisions}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Meetings;



