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
    workItems: [
      {
        workDescription: "",
        spareParts: [{ name: "", quantity: 1, cost: 0 }],
        laborCost: 0,
      },
    ],
    issuesFound: "",
    proofOfWork: null,
    // NEW: Itemized costs based on inspection report
    inspectionItemCosts: [],
    useItemizedCosts: false, // Toggle between general and itemized approach
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

  const handleRegisterDetails = async (repair) => {
    setSelectedRepair(repair);

    // Fetch full inspection data if this repair is linked to an inspection
    let inspectionData = null;
    if (repair.inspectionId) {
      try {
        const inspRes = await axios.get(
          `/api/inspections/${repair.inspectionId}`
        );
        inspectionData = inspRes.data;
      } catch (error) {
        console.error("Failed to fetch inspection data:", error);
      }
    }

    setSelectedRepair({ ...repair, inspection: inspectionData });

    // Build itemized costs list from inspection failed items
    const itemizedCosts = [];

    if (inspectionData) {
      // Helper function to get item label
      const getItemLabel = (section, key) => {
        const labels = {
          externalAppearance: {
            q1: "Mkasi sawa",
            q2: "Tairi zote salama",
            q3: "Brake mbele/nyuma",
            q4: "Haijapinda/gonga kifua",
            q5: "Rangi maeneo yaliyoharibika",
            q6: "Tank halina kutu",
            q7: "Shokapu mbele hazivuji",
            q8: "Shokapu nyuma sawa",
            q9: "Mudguard mbele sawa",
            q10: "Mikono clutch/brake sawa",
            q11: "Side cover zimefungwa",
            q12: "Chain box haigongi",
            q13: "Stendi zote sawa",
            q14: "Speed meter cable sawa",
            q15: "Imesafishwa",
            q16: "Funguo wafungua tank",
            q17: "Engine & chassis zinalingana",
            q18: "Limu haijapinda",
            q19: "Taili hazijatoboka",
            q20: "Seat imefungwa vizuri",
          },
          electricalSystem: {
            q21: "Indicators zote zinafanya kazi",
            q22: "Honi inafanya kazi",
            q23: "Starter inafanya kazi",
            q24: "Taa mbele/nyuma zinafanya kazi",
            q25: "Switch kuwasha/kuzima inafanya kazi",
            q26: "Nyingineyo",
          },
          engineSystem: {
            q27: "Haitoi moshi",
            q28: "Timing chain hailii",
            q29: "Piston haigongi",
            q30: "Haina leakage",
            q31: "Shaft haijachomelewa",
            q32: "Kiki inafanya kazi",
            q33: "Haina miss",
            q34: "Mkono haigongi",
            q35: "Carburator sawa",
            q36: "Exhaust sawa",
            q37: "Clutch system sawa",
            q38: "Gear zote zinaingia",
            q39: "Gear 1-5 hazivumi",
            q40: "Exletor sawa",
            q41: "Tapeti hazigongi",
            q42: "Engine haina milio tofauti",
          },
        };
        return labels[section]?.[key] || key;
      };

      const getSectionName = (section) => {
        const names = {
          externalAppearance: "A. MUONEKANO WA NJE",
          electricalSystem: "B. MFUMO WA UMEME",
          engineSystem: "C. MFUMO WA ENGINE",
        };
        return names[section] || section;
      };

      // Extract failed items from each section
      ["externalAppearance", "electricalSystem", "engineSystem"].forEach(
        (section) => {
          const sectionData = inspectionData[section];
          if (sectionData && typeof sectionData === "object") {
            Object.entries(sectionData).forEach(([key, value]) => {
              if (value === false) {
                // This item failed inspection
                itemizedCosts.push({
                  itemKey: key,
                  section: section,
                  sectionName: getSectionName(section),
                  itemLabel: getItemLabel(section, key),
                  repaired: false, // Mechanic will check this
                  spareParts: [], // Mechanic will fill
                  laborCost: 0, // Mechanic will fill
                  notes: "", // Mechanic can add notes
                });
              }
            });
          }
        }
      );
    }

    setDetailsData({
      workItems: [
        {
          workDescription: "",
          spareParts: [{ name: "", quantity: 1, cost: 0 }],
          laborCost: 0,
        },
      ],
      // Pre-fill issuesFound with report from GIDIONI (stored in repair.notes or description)
      issuesFound:
        repair.issuesFound || repair.notes || repair.description || "",
      proofOfWork: null,
      inspectionItemCosts: itemizedCosts,
      useItemizedCosts: itemizedCosts.length > 0, // Auto-enable if we have items
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

    // Use itemized costs if enabled
    if (
      detailsData.useItemizedCosts &&
      detailsData.inspectionItemCosts.length > 0
    ) {
      // Validate at least one item is marked as repaired
      const hasRepairedItems = detailsData.inspectionItemCosts.some(
        (item) => item.repaired
      );
      if (!hasRepairedItems) {
        alert("Tafadhali chagua angalau kitu kimoja ulichokitengeneza!");
        return;
      }

      // Filter only repaired items
      const repairedItems = detailsData.inspectionItemCosts.filter(
        (item) => item.repaired
      );

      try {
        const formData = new FormData();
        formData.append("spareParts", JSON.stringify([])); // Not used with itemized
        formData.append("laborHours", 0);
        formData.append("laborCost", 0);
        formData.append(
          "workDescription",
          "Matengenezo kulingana na ripoti ya GIDIONI"
        );
        formData.append("issuesFound", detailsData.issuesFound || "");
        formData.append("recommendations", "");
        formData.append("inspectionItemCosts", JSON.stringify(repairedItems));

        if (detailsData.proofOfWork) {
          formData.append("proofOfWork", detailsData.proofOfWork);
        }

        const repairId = selectedRepair.id || selectedRepair._id;
        if (!repairId) {
          alert("Error: Repair ID not found. Please try again.");
          return;
        }

        const response = await axios.post(
          `/api/repairs/${repairId}/register-details`,
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
      return;
    }

    // Original approach: general work items (fallback)
    // Validate at least one work item has description
    const hasValidWork = detailsData.workItems.some(
      (item) => item.workDescription && item.workDescription.trim() !== ""
    );
    if (!hasValidWork) {
      alert("Please provide at least one work description");
      return;
    }

    // Calculate totals from all work items
    let totalLaborCost = 0;
    let allSpareParts = [];
    let workDescriptions = [];

    detailsData.workItems.forEach((item) => {
      if (item.workDescription && item.workDescription.trim()) {
        workDescriptions.push(item.workDescription);
        totalLaborCost += parseFloat(item.laborCost) || 0;
        allSpareParts = allSpareParts.concat(
          item.spareParts.filter((p) => p.name && p.name.trim())
        );
      }
    });

    try {
      const formData = new FormData();
      formData.append("spareParts", JSON.stringify(allSpareParts));
      formData.append("laborHours", 0); // Not used in new structure
      formData.append("laborCost", totalLaborCost);
      formData.append("workDescription", workDescriptions.join("\n\n"));
      formData.append("issuesFound", detailsData.issuesFound || "");
      formData.append("recommendations", "");
      formData.append("inspectionItemCosts", JSON.stringify([])); // Empty for general approach

      if (detailsData.proofOfWork) {
        formData.append("proofOfWork", detailsData.proofOfWork);
      }

      const repairId = selectedRepair.id || selectedRepair._id;
      if (!repairId) {
        alert("Error: Repair ID not found. Please try again.");
        return;
      }

      const response = await axios.post(
        `/api/repairs/${repairId}/register-details`,
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

  // Add new work item
  const addWorkItem = () => {
    setDetailsData({
      ...detailsData,
      workItems: [
        ...detailsData.workItems,
        {
          workDescription: "",
          spareParts: [{ name: "", quantity: 1, cost: 0 }],
          laborCost: 0,
        },
      ],
    });
  };

  // Remove work item
  const removeWorkItem = (workIndex) => {
    const newItems = detailsData.workItems.filter((_, i) => i !== workIndex);
    setDetailsData({
      ...detailsData,
      workItems:
        newItems.length > 0
          ? newItems
          : [
              {
                workDescription: "",
                spareParts: [{ name: "", quantity: 1, cost: 0 }],
                laborCost: 0,
              },
            ],
    });
  };

  // Add spare part to specific work item
  const addSparePartToWork = (workIndex) => {
    const newItems = [...detailsData.workItems];
    newItems[workIndex].spareParts.push({ name: "", quantity: 1, cost: 0 });
    setDetailsData({ ...detailsData, workItems: newItems });
  };

  // Remove spare part from specific work item
  const removeSparePartFromWork = (workIndex, partIndex) => {
    const newItems = [...detailsData.workItems];
    newItems[workIndex].spareParts = newItems[workIndex].spareParts.filter(
      (_, i) => i !== partIndex
    );
    if (newItems[workIndex].spareParts.length === 0) {
      newItems[workIndex].spareParts = [{ name: "", quantity: 1, cost: 0 }];
    }
    setDetailsData({ ...detailsData, workItems: newItems });
  };

  // Update spare part in specific work item
  const updateSparePartInWork = (workIndex, partIndex, field, value) => {
    const newItems = [...detailsData.workItems];
    newItems[workIndex].spareParts[partIndex][field] = value;
    setDetailsData({ ...detailsData, workItems: newItems });
  };

  // Update work item field
  const updateWorkItem = (workIndex, field, value) => {
    const newItems = [...detailsData.workItems];
    newItems[workIndex][field] = value;
    setDetailsData({ ...detailsData, workItems: newItems });
  };

  // === Inspection Item Costs Handlers ===

  // Toggle item repaired status
  const toggleItemRepaired = (itemIndex) => {
    const newItems = [...detailsData.inspectionItemCosts];
    newItems[itemIndex].repaired = !newItems[itemIndex].repaired;
    setDetailsData({ ...detailsData, inspectionItemCosts: newItems });
  };

  // Update item field
  const updateInspectionItem = (itemIndex, field, value) => {
    const newItems = [...detailsData.inspectionItemCosts];
    newItems[itemIndex][field] = value;
    setDetailsData({ ...detailsData, inspectionItemCosts: newItems });
  };

  // Add spare part to inspection item
  const addSparePartToItem = (itemIndex) => {
    const newItems = [...detailsData.inspectionItemCosts];
    if (!newItems[itemIndex].spareParts) {
      newItems[itemIndex].spareParts = [];
    }
    newItems[itemIndex].spareParts.push({ name: "", quantity: 1, cost: 0 });
    setDetailsData({ ...detailsData, inspectionItemCosts: newItems });
  };

  // Remove spare part from inspection item
  const removeSparePartFromItem = (itemIndex, partIndex) => {
    const newItems = [...detailsData.inspectionItemCosts];
    newItems[itemIndex].spareParts = newItems[itemIndex].spareParts.filter(
      (_, i) => i !== partIndex
    );
    setDetailsData({ ...detailsData, inspectionItemCosts: newItems });
  };

  // Update spare part in inspection item
  const updateSparePartInItem = (itemIndex, partIndex, field, value) => {
    const newItems = [...detailsData.inspectionItemCosts];
    newItems[itemIndex].spareParts[partIndex][field] = value;
    setDetailsData({ ...detailsData, inspectionItemCosts: newItems });
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
        <div className="min-w-[150px]">
          <div className="font-medium text-sm">
            {row.motorcycle?.brand} {row.motorcycle?.model}
          </div>
          <div className="text-xs text-gray-500">
            {row.motorcycle?.chassisNumber}
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <div className="max-w-[200px] truncate text-sm" title={row.description}>
          {row.description}
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex flex-col sm:flex-row flex-wrap gap-1 sm:gap-2 min-w-[180px]">
          {/* Pending: clearly show Start Work + Register Details */}
          {row.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartWork(row._id || row.id)}
                className="text-xs whitespace-nowrap"
              >
                <FiPlay className="mr-1" />
                Start
              </Button>
              <Button
                size="sm"
                onClick={() => handleRegisterDetails(row)}
                className="text-xs whitespace-nowrap"
              >
                <FiClipboard className="mr-1" />
                Register
              </Button>
            </>
          )}

          {/* In progress: main action is Register Details */}
          {row.status === "in_progress" && (
            <Button
              size="sm"
              onClick={() => handleRegisterDetails(row)}
              className="text-xs whitespace-nowrap"
            >
              <FiClipboard className="mr-1" />
              Register Details
            </Button>
          )}

          {/* Send Bill - for awaiting_details_approval or details_approved */}
          {(row.status === "awaiting_details_approval" ||
            row.status === "details_approved") && (
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
                    <Button
                      size="sm"
                      onClick={() => handleSendBill(row)}
                      className="text-xs whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FiSend className="mr-1" />
                      Send Bill
                    </Button>
                  );
                }
                return (
                  <span
                    className="inline-flex items-center text-green-600 text-xs font-medium px-2 py-1 bg-green-50 rounded"
                    title={`Bill ${bill.status.replace("_", " ")}`}
                  >
                    <FiDollarSign className="mr-1" />
                    Bill Sent
                  </span>
                );
              })()}
              <Button
                size="sm"
                onClick={() => handleMarkComplete(row._id || row.id)}
                className="text-xs whitespace-nowrap"
              >
                <FiCheckCircle className="mr-1" />
                Complete
              </Button>
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
          <div className="mb-4 space-y-3">
            {/* Basic Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Taarifa za Pikipiki
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Pikipiki:</strong> {selectedRepair.motorcycle?.brand}{" "}
                {selectedRepair.motorcycle?.model}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Kazi:</strong> {selectedRepair.description}
              </p>
            </div>

            {/* GIDIONI Inspection Report - Detailed */}
            {selectedRepair.inspection && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <FiClipboard className="mr-2" />
                  Report ya Ukaguzi wa GIDIONI
                </h3>

                {selectedRepair.inspection.notes && (
                  <div className="mb-3 p-2 bg-white rounded">
                    <p className="text-sm font-medium text-gray-800">
                      Maelezo ya Jumla:
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line mt-1">
                      {selectedRepair.inspection.notes}
                    </p>
                  </div>
                )}

                {/* Section A: External Appearance - show failed items */}
                {selectedRepair.inspection.externalAppearance && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      A. MUONEKANO WA NJE (Vitu vilivyo-fail):
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1 ml-4">
                      {Object.entries(
                        selectedRepair.inspection.externalAppearance
                      )
                        .filter(([key, value]) => value === false)
                        .map(([key, _], index) => {
                          const labels = {
                            q1: "Mkasi sawa",
                            q2: "Tairi zote salama",
                            q3: "Brake mbele/nyuma",
                            q4: "Haijapinda/gonga kifua",
                            q5: "Rangi maeneo yaliyoharibika",
                            q6: "Tank halina kutu",
                            q7: "Shokapu mbele hazivuji",
                            q8: "Shokapu nyuma sawa",
                            q9: "Mudguard mbele sawa",
                            q10: "Mikono clutch/brake sawa",
                            q11: "Side cover zimefungwa",
                            q12: "Chain box haigongi",
                            q13: "Stendi zote sawa",
                            q14: "Speed meter cable sawa",
                            q15: "Imesafishwa",
                            q16: "Funguo wafungua tank",
                            q17: "Engine & chassis zinalingana",
                            q18: "Limu haijapinda",
                            q19: "Taili hazijatoboka",
                            q20: "Seat imefungwa vizuri",
                          };
                          return (
                            <li key={key} className="text-red-600">
                              ❌ {labels[key] || key}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}

                {/* Section B: Electrical System - show failed items */}
                {selectedRepair.inspection.electricalSystem && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      B. MFUMO WA UMEME (Vitu vilivyo-fail):
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1 ml-4">
                      {Object.entries(
                        selectedRepair.inspection.electricalSystem
                      )
                        .filter(([key, value]) => value === false)
                        .map(([key, _], index) => {
                          const labels = {
                            q21: "Indicators zote zinafanya kazi",
                            q22: "Honi inafanya kazi",
                            q23: "Starter inafanya kazi",
                            q24: "Taa mbele/nyuma zinafanya kazi",
                            q25: "Switch kuwasha/kuzima inafanya kazi",
                            q26: "Nyingineyo",
                          };
                          return (
                            <li key={key} className="text-red-600">
                              ❌ {labels[key] || key}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}

                {/* Section C: Engine System - show failed items */}
                {selectedRepair.inspection.engineSystem && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      C. MFUMO WA ENGINE (Vitu vilivyo-fail):
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1 ml-4">
                      {Object.entries(selectedRepair.inspection.engineSystem)
                        .filter(([key, value]) => value === false)
                        .map(([key, _], index) => {
                          const labels = {
                            q27: "Haitoi moshi",
                            q28: "Timing chain hailii",
                            q29: "Piston haigongi",
                            q30: "Haina leakage",
                            q31: "Shaft haijachomelewa",
                            q32: "Kiki inafanya kazi",
                            q33: "Haina miss",
                            q34: "Mkono haigongi",
                            q35: "Carburator sawa",
                            q36: "Exhaust sawa",
                            q37: "Clutch system sawa",
                            q38: "Gear zote zinaingia",
                            q39: "Gear 1-5 hazivumi",
                            q40: "Exletor sawa",
                            q41: "Tapeti hazigongi",
                            q42: "Engine haina milio tofauti",
                          };
                          return (
                            <li key={key} className="text-red-600">
                              ❌ {labels[key] || key}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Fallback: if no inspection data, show notes only */}
            {!selectedRepair.inspection && selectedRepair.notes && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-gray-800">
                  Maelezo ya Kazi:
                </p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {selectedRepair.notes}
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitDetails}>
          {/* Toggle between approaches (if inspection items available) */}
          {detailsData.inspectionItemCosts.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Chagua Njia ya Kujaza Gharama
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Kuna vitu {detailsData.inspectionItemCosts.length}{" "}
                    vilivyofail kwenye ripoti ya GIDIONI
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDetailsData({
                      ...detailsData,
                      useItemizedCosts: !detailsData.useItemizedCosts,
                    })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    detailsData.useItemizedCosts
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {detailsData.useItemizedCosts
                    ? "✓ Gharama kwa Kila Kitu"
                    : "Gharama Jumla Tu"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {detailsData.useItemizedCosts
                  ? "Utajaza gharama kwa kila kitu kilichofail kwenye ripoti"
                  : "Utajaza gharama jumla tu bila kutenganisha"}
              </p>
            </div>
          )}

          {/* Itemized Costs Section (NEW) */}
          {detailsData.useItemizedCosts &&
            detailsData.inspectionItemCosts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Vitu Vilivyofail - Jaza Gharama kwa Kila Kimoja
                </h3>
                <div className="space-y-4">
                  {detailsData.inspectionItemCosts.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        item.repaired
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {/* Item Header with Checkbox */}
                      <div className="flex items-start space-x-3 mb-3">
                        <input
                          type="checkbox"
                          checked={item.repaired}
                          onChange={() => toggleItemRepaired(itemIndex)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-medium text-gray-500">
                                {item.sectionName}
                              </span>
                              <p className="font-medium text-gray-900 mt-1">
                                {item.itemLabel}
                              </p>
                            </div>
                            {item.repaired && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                                ✓ Imetengenezwa
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cost Details (only show if repaired) */}
                      {item.repaired && (
                        <div className="ml-8 space-y-3 mt-3 pt-3 border-t border-gray-200">
                          {/* Spare Parts */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">
                                Vipuri Vilivyotumika
                              </label>
                              <button
                                type="button"
                                onClick={() => addSparePartToItem(itemIndex)}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                              >
                                + Ongeza Kipuri
                              </button>
                            </div>
                            {(!item.spareParts ||
                              item.spareParts.length === 0) && (
                              <button
                                type="button"
                                onClick={() => addSparePartToItem(itemIndex)}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600"
                              >
                                Bofya kuongeza kipuri
                              </button>
                            )}
                            {item.spareParts && item.spareParts.length > 0 && (
                              <div className="space-y-2">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                                  <div className="col-span-5">
                                    Jina la Kipuri
                                  </div>
                                  <div className="col-span-2">Idadi</div>
                                  <div className="col-span-4">Bei (TZS)</div>
                                  <div className="col-span-1"></div>
                                </div>
                                {/* Parts List */}
                                {item.spareParts.map((part, partIndex) => (
                                  <div
                                    key={partIndex}
                                    className="grid grid-cols-12 gap-2"
                                  >
                                    <div className="col-span-5">
                                      <input
                                        type="text"
                                        placeholder="Mfano: Brake pad"
                                        value={part.name}
                                        onChange={(e) =>
                                          updateSparePartInItem(
                                            itemIndex,
                                            partIndex,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        placeholder="1"
                                        value={part.quantity}
                                        onChange={(e) =>
                                          updateSparePartInItem(
                                            itemIndex,
                                            partIndex,
                                            "quantity",
                                            parseFloat(e.target.value) || 1
                                          )
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="1"
                                      />
                                    </div>
                                    <div className="col-span-4">
                                      <input
                                        type="number"
                                        placeholder="25000"
                                        value={part.cost}
                                        onChange={(e) =>
                                          updateSparePartInItem(
                                            itemIndex,
                                            partIndex,
                                            "cost",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="0"
                                      />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSparePartFromItem(
                                            itemIndex,
                                            partIndex
                                          )
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        title="Ondoa kipuri"
                                      >
                                        <FiX />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Labor Cost */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Gharama ya Kazi (Labor Cost) - TZS
                            </label>
                            <input
                              type="number"
                              value={item.laborCost}
                              onChange={(e) =>
                                updateInspectionItem(
                                  itemIndex,
                                  "laborCost",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Mfano: 50000"
                              min="0"
                            />
                          </div>

                          {/* Notes (optional) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Maelezo Zaidi (Optional)
                            </label>
                            <textarea
                              value={item.notes}
                              onChange={(e) =>
                                updateInspectionItem(
                                  itemIndex,
                                  "notes",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              rows="2"
                              placeholder="Maelezo mengine..."
                            />
                          </div>

                          {/* Item Total */}
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">
                                Jumla kwa Kitu Hiki:
                              </span>
                              <span className="text-lg font-bold text-primary-600">
                                TZS{" "}
                                {(
                                  (parseFloat(item.laborCost) || 0) +
                                  (item.spareParts || []).reduce(
                                    (sum, p) =>
                                      sum +
                                      (parseFloat(p.cost) || 0) *
                                        (parseInt(p.quantity) || 1),
                                    0
                                  )
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Jumla ya Gharama Zote:
                    </span>
                    <span className="text-2xl font-bold text-primary-600">
                      TZS{" "}
                      {detailsData.inspectionItemCosts
                        .filter((item) => item.repaired)
                        .reduce((total, item) => {
                          const itemTotal =
                            (parseFloat(item.laborCost) || 0) +
                            (item.spareParts || []).reduce(
                              (sum, p) =>
                                sum +
                                (parseFloat(p.cost) || 0) *
                                  (parseInt(p.quantity) || 1),
                              0
                            );
                          return total + itemTotal;
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Original Work Items Section (only show if not using itemized) */}
          {!detailsData.useItemizedCosts && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Kazi Zilizofanywa (Work Done)
                </label>
                <button
                  type="button"
                  onClick={addWorkItem}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  + Ongeza Kazi Nyingine
                </button>
              </div>

              {detailsData.workItems.map((workItem, workIndex) => (
                <div
                  key={workIndex}
                  className="mb-4 p-4 border border-gray-300 rounded-lg bg-white"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800">
                      Kazi #{workIndex + 1}
                    </h4>
                    {detailsData.workItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkItem(workIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <FiX className="inline mr-1" />
                        Ondoa
                      </button>
                    )}
                  </div>

                  {/* Work Description */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maelezo ya Kazi (Work Description) *
                    </label>
                    <textarea
                      value={workItem.workDescription}
                      onChange={(e) =>
                        updateWorkItem(
                          workIndex,
                          "workDescription",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="2"
                      placeholder="Mfano: Badilisha mafuta ya engine na filter"
                      required
                    />
                  </div>

                  {/* Spare Parts for this work */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Vipuri Vilivyotumika (Spare Parts)
                      </label>
                      <button
                        type="button"
                        onClick={() => addSparePartToWork(workIndex)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                      >
                        + Ongeza Kipuri
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Header row for spare parts */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-1">
                        <div className="col-span-5">Jina la Kipuri</div>
                        <div className="col-span-2">Idadi</div>
                        <div className="col-span-4">Bei (TZS)</div>
                        <div className="col-span-1"></div>
                      </div>

                      {workItem.spareParts.map((part, partIndex) => (
                        <div
                          key={partIndex}
                          className="grid grid-cols-12 gap-2"
                        >
                          <div className="col-span-5">
                            <input
                              type="text"
                              placeholder="Mfano: Engine Oil"
                              value={part.name}
                              onChange={(e) =>
                                updateSparePartInWork(
                                  workIndex,
                                  partIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="1"
                              value={part.quantity}
                              onChange={(e) =>
                                updateSparePartInWork(
                                  workIndex,
                                  partIndex,
                                  "quantity",
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min="1"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              placeholder="25000"
                              value={part.cost}
                              onChange={(e) =>
                                updateSparePartInWork(
                                  workIndex,
                                  partIndex,
                                  "cost",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            {workItem.spareParts.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeSparePartFromWork(workIndex, partIndex)
                                }
                                className="text-red-600 hover:text-red-800"
                                title="Ondoa kipuri"
                              >
                                <FiX />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Labor Cost for this work */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gharama ya Kazi (Labor Cost) - TZS
                    </label>
                    <input
                      type="number"
                      value={workItem.laborCost}
                      onChange={(e) =>
                        updateWorkItem(
                          workIndex,
                          "laborCost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Mfano: 50000"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Issues Found (pre-filled from GIDIONI report) - Always show */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matatizo Yaliyopatikana (Issues Found - kutoka GIDIONI)
            </label>
            <textarea
              value={detailsData.issuesFound}
              onChange={(e) =>
                setDetailsData({ ...detailsData, issuesFound: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
              rows="3"
              placeholder="Matatizo kutoka kwa GIDIONI..."
              readOnly
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
