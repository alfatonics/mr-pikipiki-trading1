import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import {
  FiMessageCircle,
  FiSend,
  FiInbox,
  FiMail,
  FiCheck,
  FiClock,
} from "react-icons/fi";

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("inbox"); // inbox, sent
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    receiverId: "",
    subject: "",
    message: "",
    priority: "normal",
  });

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages?type=${filter}`);
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/messages", formData);
      alert("Message sent successfully!");
      setModalOpen(false);
      setFormData({
        receiverId: "",
        subject: "",
        message: "",
        priority: "normal",
      });
      fetchMessages();
    } catch (error) {
      alert(
        "Failed to send message: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await axios.post(`/api/messages/${messageId}/read`);
      fetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const unreadCount = messages.filter(
    (m) => !m.isRead && filter === "inbox"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
              Messages
            </h1>
            <p className="text-gray-600">
              Communicate with Cashier, Gidion, and other team members
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiSend className="inline mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Filter Tabs */}
        <Card className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter("inbox")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                filter === "inbox"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FiInbox />
              <span>Inbox</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("sent")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                filter === "sent"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FiMail />
              <span>Sent</span>
            </button>
          </div>
        </Card>

        {/* Messages List */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <FiMessageCircle className="text-gray-400 text-5xl mx-auto mb-4" />
              <p className="text-gray-600">No messages found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    !msg.isRead && filter === "inbox"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.isRead && filter === "inbox") {
                      handleMarkAsRead(msg.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold">
                          {filter === "inbox"
                            ? msg.senderName || msg.senderUsername
                            : msg.receiverName || msg.receiverUsername}
                        </p>
                        {!msg.isRead && filter === "inbox" && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                            New
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 mb-1">
                        {msg.subject || "(No Subject)"}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {msg.message}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-4">
                      <p>{new Date(msg.createdAt).toLocaleDateString()}</p>
                      <p>{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Send Message Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormData({
            receiverId: "",
            subject: "",
            message: "",
            priority: "normal",
          });
        }}
        title="Send New Message"
        size="lg"
      >
        <form onSubmit={handleSendMessage}>
          <Select
            label="To"
            value={formData.receiverId}
            onChange={(e) =>
              setFormData({ ...formData, receiverId: e.target.value })
            }
            options={[
              { value: "", label: "Select recipient" },
              ...users
                .filter((u) => u.id !== user.id)
                .map((u) => ({
                  value: u.id,
                  label: `${u.fullName || u.username} (${u.role})`,
                })),
            ]}
            required
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="5"
              required
            />
          </div>
          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value })
            }
            options={[
              { value: "low", label: "Low" },
              { value: "normal", label: "Normal" },
              { value: "high", label: "High" },
              { value: "urgent", label: "Urgent" },
            ]}
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <FiSend className="inline mr-2" />
              Send Message
            </Button>
          </div>
        </form>
      </Modal>

      {/* Message Detail Modal */}
      <Modal
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage?.subject || "Message"}
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">
                <strong>From:</strong>{" "}
                {selectedMessage.senderName || selectedMessage.senderUsername}
              </p>
              <p className="text-sm text-gray-600">
                <strong>To:</strong>{" "}
                {selectedMessage.receiverName ||
                  selectedMessage.receiverUsername}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong>{" "}
                {new Date(selectedMessage.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;

