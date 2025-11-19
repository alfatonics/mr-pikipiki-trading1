import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { FiUser, FiLock, FiSave, FiEdit } from "react-icons/fi";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        username: user.username || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(`/api/users/${user.id}`, formData);
      setUser(response.data);
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert(
        "Failed to update profile: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/api/users/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordModalOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Password changed successfully!");
    } catch (error) {
      alert(
        "Failed to change password: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              My Profile
            </h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              <FiEdit className="inline mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <Card>
          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-4xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {user?.fullName || user?.full_name || user?.username}
                  </h2>
                  <p className="text-gray-600 capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  disabled={!editing}
                />
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={!editing}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!editing}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={!editing}
                />
              </div>

              {editing && (
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        fullName: user?.fullName || user?.full_name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        username: user?.username || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <FiSave className="inline mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Security</h3>
            <Button
              variant="secondary"
              onClick={() => setPasswordModalOpen(true)}
            >
              <FiLock className="inline mr-2" />
              Change Password
            </Button>
          </div>
        </Card>
      </div>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                required
                minLength={6}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                minLength={6}
              />
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
