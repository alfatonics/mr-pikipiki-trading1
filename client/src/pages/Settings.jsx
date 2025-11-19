import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import { FiSettings, FiMoon, FiSun, FiBell, FiSave } from "react-icons/fi";

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    theme: localStorage.getItem("theme") || "light",
    notifications: localStorage.getItem("notifications") !== "false",
    language: localStorage.getItem("language") || "en",
  });

  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    // Apply theme
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  const handleSave = () => {
    localStorage.setItem("theme", settings.theme);
    localStorage.setItem("notifications", settings.notifications.toString());
    localStorage.setItem("language", settings.language);
    alert("Settings saved successfully!");
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    setSettings({ ...settings, theme: newTheme });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-600">Manage your application settings</p>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <Card>
          <div className="space-y-6">
            {/* Appearance Settings */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FiSettings className="mr-2" />
                Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {isDarkMode ? (
                      <FiMoon className="text-2xl mr-3 text-gray-600" />
                    ) : (
                      <FiSun className="text-2xl mr-3 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-gray-600">
                        {isDarkMode ? "Dark Mode" : "Light Mode"}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={toggleTheme}>
                    Switch to {isDarkMode ? "Light" : "Dark"} Mode
                  </Button>
                </div>

                <Select
                  label="Language"
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  options={[
                    { value: "en", label: "English" },
                    { value: "sw", label: "Swahili" },
                  ]}
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FiBell className="mr-2" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-gray-600">
                      Receive notifications for important updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notifications}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Username</p>
                  <p className="font-medium">{user?.username}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-medium">
                    {user?.fullName || user?.full_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button onClick={handleSave} className="w-full sm:w-auto">
                <FiSave className="inline mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
