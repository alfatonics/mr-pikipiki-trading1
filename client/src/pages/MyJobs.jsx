import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import TableWithSearch from "../components/TableWithSearch";
import QuickActions from "../components/QuickActions";
import {
  FiTool,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiX,
  FiAlertCircle,
  FiPlay,
  FiDollarSign,
  FiUpload,
  FiSend,
  FiImage,
  FiVideo,
} from "react-icons/fi";

const MyJobs = () => {
  const { user } = useAuth();
  const [myRepairs, setMyRepairs] = useState([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [filter, setFilter] = useState("active"); // active, awaiting, completed

  const [detailsData, setDetailsData] = useState({
    spareParts: [{ name: "", quantity: 1, cost: 0 }],
    laborHours: 0,
    laborCost: 0,
    workDescription: "",
    issuesFound: "",
    recommendations: "",
    proofOfWork: null,
  });
  const [bills, setBills] = useState([]);
  const [billModalOpen, setBillModalOpen] = useState(false);

  useEffect(() => {
    fetchMyRepairs();
    fetchBills();
  }, [filter]);

  const fetchBills = async () => {
    try {
      const mechanicId = user._id || user.id;
      const response = await axios.get(
        `/api/repair-bills?mechanicId=${mechanicId}`
      );
      setBills(response.data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const fetchMyRepairs = async () => {
    try {
      const mechanicId = user._id || user.id;
      const response = await axios.get(`/api/repairs?mechanic=${mechanicId}`);

      let filtered = response.data;
      if (filter === "active") {
        filtered = response.data.filter(
          (r) =>
            r.status === "pending" ||
            r.status === "in_progress" ||
            r.status === "details_approved"
        );
      } else if (filter === "awaiting") {
        filtered = response.data.filter(
          (r) => r.status === "awaiting_details_approval"
        );
      } else if (filter === "completed") {
        filtered = response.data.filter((r) => r.status === "completed");
      }

      setMyRepairs(filtered);
    } catch (error) {}
  };

  const handleStartWork = async (repairId) => {
    if (window.confirm("Start working on this repair?")) {
      try {
        await axios.put(`/api/repairs/${repairId}`, { status: "in_progress" });
        fetchMyRepairs();
        alert(
          "Status changed to In Progress. You can now work on this repair!"
        );
      } catch (error) {
        alert(
          "Failed to start repair: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  const handleRegisterDetails = (repair) => {
    setSelectedRepair(repair);
    setDetailsData({
      spareParts: [{ name: "", quantity: 1, cost: 0 }],
      laborHours: 0,
      laborCost: 0,
      workDescription: "",
      issuesFound: "",
      recommendations: "",
      proofOfWork: null,
    });
    setDetailsModalOpen(true);
  };

  const handleSendBill = async (repair) => {
    try {
      // Check if bill already exists
      const existingBill = bills.find(
        (b) => b.repairId === repair._id || b.repairId === repair.id
      );

      if (existingBill) {
        if (
          existingBill.status === "sent_to_cashier" ||
          existingBill.status === "payment_approved"
        ) {
          alert("Bill already sent to cashier!");
          return;
        }
        // Send existing bill
        await axios.post(`/api/repair-bills/${existingBill.id}/send`);
        alert("Bill sent to cashier successfully!");
      } else {
        // Create and send new bill
        const sparePartsCost =
          repair.spareParts?.reduce(
            (sum, part) => sum + (parseFloat(part.cost) || 0),
            0
          ) || 0;
        const totalAmount =
          (parseFloat(repair.laborCost) || 0) + sparePartsCost;

        const billData = {
          repairId: repair._id || repair.id,
          motorcycleId:
            repair.motorcycleId ||
            repair.motorcycle?._id ||
            repair.motorcycle?.id,
          laborCost: parseFloat(repair.laborCost) || 0,
          sparePartsCost: sparePartsCost,
          totalAmount: totalAmount,
          description: repair.workDescription || repair.description,
          repairDate: new Date().toISOString().split("T")[0],
        };

        const billResponse = await axios.post("/api/repair-bills", billData);
        await axios.post(`/api/repair-bills/${billResponse.data.id}/send`);
        alert("Bill created and sent to cashier successfully!");
      }

      fetchBills();
      fetchMyRepairs();
    } catch (error) {
      alert(
        "Failed to send bill: " + (error.response?.data?.error || error.message)
      );
    }
  };

  const handleSubmitDetails = async (e) => {
    e.preventDefault();

    if (
      !detailsData.workDescription ||
      detailsData.workDescription.trim() === ""
    ) {
      alert("Please provide a work description");
      return;
    }

    if (parseFloat(detailsData.laborCost) <= 0) {
      alert("Please enter labor cost");
      return;
    }

    if (parseFloat(detailsData.laborHours) <= 0) {
      alert("Please enter labor hours");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("spareParts", JSON.stringify(detailsData.spareParts));
      formData.append("laborHours", detailsData.laborHours);
      formData.append("laborCost", detailsData.laborCost);
      formData.append("workDescription", detailsData.workDescription);
      formData.append("issuesFound", detailsData.issuesFound || "");
      formData.append("recommendations", detailsData.recommendations || "");

      if (detailsData.proofOfWork) {
        formData.append("proofOfWork", detailsData.proofOfWork);
      }

      const response = await axios.post(
        `/api/repairs/${selectedRepair._id}/register-details`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fetchMyRepairs();
      setDetailsModalOpen(false);
      alert(
        "Repair details submitted for approval!\n\nSales and Admin will review your costs."
      );
    } catch (error) {
      alert(
        "Failed to submit details: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleMarkComplete = async (repairId) => {
    if (
      window.confirm(
        "Mark this repair as completed?\n\nThe motorcycle will be returned to stock."
      )
    ) {
      try {
        await axios.post(`/api/repairs/${repairId}/complete`);
        fetchMyRepairs();
        alert("Repair marked as completed! Motorcycle is now back in stock.");
      } catch (error) {
        alert(
          "Failed to complete repair: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  const addSparePartRow = () => {
    setDetailsData({
      ...detailsData,
      spareParts: [
        ...detailsData.spareParts,
        { name: "", quantity: 1, cost: 0 },
      ],
    });
  };

  const removeSparePartRow = (index) => {
    const newParts = detailsData.spareParts.filter((_, i) => i !== index);
    setDetailsData({
      ...detailsData,
      spareParts:
        newParts.length > 0 ? newParts : [{ name: "", quantity: 1, cost: 0 }],
    });
  };

  const updateSparePart = (index, field, value) => {
    const newParts = [...detailsData.spareParts];
    newParts[index][field] = value;
    setDetailsData({ ...detailsData, spareParts: newParts });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Assigned to You",
      },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
      awaiting_details_approval: {
        color: "bg-orange-100 text-orange-800",
        label: "Awaiting Approval",
      },
      details_approved: {
        color: "bg-purple-100 text-purple-800",
        label: "Ready to Complete",
      },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  const columns = [
    {
      header: "Motorcycle",
      render: (row) => (
        <div>
          <div className="font-medium">
            {row.motorcycle?.brand} {row.motorcycle?.model}
          </div>
          <div className="text-xs text-gray-500">
            {row.motorcycle?.chassisNumber}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      render: (row) => row.repairType.replace("_", " ").toUpperCase(),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <div className="max-w-xs truncate" title={row.description}>
          {row.description}
        </div>
      ),
    },
    {
      header: "Assigned Date",
      render: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          {/* Start Work - for pending */}
          {row.status === "pending" && (
            <button
              onClick={() => handleStartWork(row._id)}
              className="text-orange-600 hover:text-orange-800"
              title="Start Work"
            >
              <FiPlay />
            </button>
          )}

          {/* Register Details - for in_progress */}
          {row.status === "in_progress" && (
            <button
              onClick={() => handleRegisterDetails(row)}
              className="text-purple-600 hover:text-purple-800"
              title="Register Repair Details"
            >
              <FiClipboard />
            </button>
          )}

          {/* Awaiting approval */}
          {row.status === "awaiting_details_approval" && (
            <button
              className="text-orange-600 cursor-not-allowed"
              title="Awaiting approval from Sales → Admin"
              disabled
            >
              <FiClock />
            </button>
          )}

          {/* Send Bill - for details_approved */}
          {row.status === "details_approved" && (
            <>
              {(() => {
                const bill = bills.find(
                  (b) =>
                    (b.repairId === row._id || b.repairId === row.id) &&
                    (b.status === "sent_to_cashier" ||
                      b.status === "payment_approved" ||
                      b.status === "paid")
                );
                if (!bill) {
                  return (
                    <button
                      onClick={() => handleSendBill(row)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Send Bill to Cashier"
                    >
                      <FiSend />
                    </button>
                  );
                }
                return (
                  <span
                    className="text-green-600"
                    title={`Bill ${bill.status.replace("_", " ")}`}
                  >
                    <FiDollarSign />
                  </span>
                );
              })()}
              <button
                onClick={() => handleMarkComplete(row._id)}
                className="text-green-600 hover:text-green-800"
                title="Mark as Completed"
              >
                <FiCheckCircle />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Repair Jobs</h1>
          <p className="text-gray-600 mt-1">Repairs assigned to you</p>
        </div>
      </div>

      {/* Quick Actions */}
      {myRepairs.length > 0 && (
        <QuickActions
          repair={myRepairs[0]}
          onViewTask={(repair) => {
            setSelectedRepair(repair);
            // Could open a modal or navigate
          }}
          onSendBill={handleSendBill}
          onUploadProof={(repair) => handleRegisterDetails(repair)}
          onMarkComplete={(repair) =>
            handleMarkComplete(repair._id || repair.id)
          }
        />
      )}

      {/* Workflow Guide Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FiAlertCircle className="text-blue-600 text-xl mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Repair Workflow</h3>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Step 1:</strong> Click ▶️ "Start Work" when you begin
              <br />
              <strong>Step 2:</strong> Work on the motorcycle
              <br />
              <strong>Step 3:</strong> Click 📝 "Register Details" to record
              parts, labor, and costs
              <br />
              <strong>Step 4:</strong> Wait for approval (Sales → Admin)
              <br />
              <strong>Step 5:</strong> Click ✅ "Mark Complete" after approval
            </p>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg ${
              filter === "active"
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FiTool className="inline mr-2" />
            Active Jobs
          </button>
          <button
            onClick={() => setFilter("awaiting")}
            className={`px-4 py-2 rounded-lg ${
              filter === "awaiting"
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FiClock className="inline mr-2" />
            Awaiting Approval
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg ${
              filter === "completed"
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FiCheckCircle className="inline mr-2" />
            Completed
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              filter === "all"
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Repairs Table */}
      <Card>
        {myRepairs.length === 0 ? (
          <div className="text-center py-12">
            <FiTool className="text-gray-400 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No repairs found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === "active"
                ? "You have no active repair jobs"
                : filter === "awaiting"
                ? "No repairs awaiting approval"
                : filter === "completed"
                ? "No completed repairs yet"
                : "No repairs assigned to you yet"}
            </p>
          </div>
        ) : (
          <TableWithSearch
            columns={columns}
            data={myRepairs}
            searchKeys={[
              "description",
              "motorcycle.brand",
              "motorcycle.model",
              "motorcycle.chassisNumber",
              "repairType",
            ]}
          />
        )}
      </Card>

      {/* Register Repair Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Register Repair Details"
        size="lg"
      >
        {selectedRepair && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">Repair Information</h3>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Motorcycle:</strong> {selectedRepair.motorcycle?.brand}{" "}
              {selectedRepair.motorcycle?.model}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Assigned Task:</strong> {selectedRepair.description}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmitDetails}>
          {/* Spare Parts Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Spare Parts Used
              </label>
              <button
                type="button"
                onClick={addSparePartRow}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                + Add Part
              </button>
            </div>

            <div className="space-y-2">
              {detailsData.spareParts.map((part, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Part name (e.g., Engine Oil)"
                      value={part.name}
                      onChange={(e) =>
                        updateSparePart(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={part.quantity}
                      onChange={(e) =>
                        updateSparePart(
                          index,
                          "quantity",
                          parseFloat(e.target.value) || 1
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="1"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      placeholder="Cost (TZS)"
                      value={part.cost}
                      onChange={(e) =>
                        updateSparePart(
                          index,
                          "cost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {detailsData.spareParts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSparePartRow(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove part"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Labor Information */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Labor Hours *"
              type="number"
              step="0.5"
              value={detailsData.laborHours}
              onChange={(e) =>
                setDetailsData({ ...detailsData, laborHours: e.target.value })
              }
              placeholder="e.g., 4.5"
              required
            />
            <Input
              label="Labor Cost (TZS) *"
              type="number"
              value={detailsData.laborCost}
              onChange={(e) =>
                setDetailsData({ ...detailsData, laborCost: e.target.value })
              }
              placeholder="e.g., 50000"
              required
            />
          </div>

          {/* Work Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What Work Did You Do? *
            </label>
            <textarea
              value={detailsData.workDescription}
              onChange={(e) =>
                setDetailsData({
                  ...detailsData,
                  workDescription: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Example: Changed engine oil and filter, inspected brake system, topped up brake fluid, checked tire pressure"
              required
            />
          </div>

          {/* Issues Found */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issues Found (If Any)
            </label>
            <textarea
              value={detailsData.issuesFound}
              onChange={(e) =>
                setDetailsData({ ...detailsData, issuesFound: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Example: Brake pads worn to 30%, oil was very dark indicating delayed service"
            />
          </div>

          {/* Recommendations */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations for Customer
            </label>
            <textarea
              value={detailsData.recommendations}
              onChange={(e) =>
                setDetailsData({
                  ...detailsData,
                  recommendations: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Example: Replace brake pads within 1000km, schedule next oil change in 3000km"
            />
          </div>

          {/* Proof of Work Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof of Work (Photo/Video)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {detailsData.proofOfWork ? (
                  <div className="flex flex-col items-center">
                    <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600 mt-2">
                      {detailsData.proofOfWork.name || "File selected"}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailsData({ ...detailsData, proofOfWork: null })
                      }
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*,video/*"
                          onChange={(e) =>
                            setDetailsData({
                              ...detailsData,
                              proofOfWork: e.target.files[0],
                            })
                          }
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, MP4 up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Important:</strong> After submitting, your costs will
              be sent for approval (Sales → Admin). You can mark the repair as
              complete only after approval.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDetailsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <FiClipboard className="inline mr-2" />
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyJobs;
