import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import TableWithSearch from "../components/TableWithSearch";
import { FiCheck, FiX, FiEye, FiAlertCircle } from "react-icons/fi";

const BikeForInspection = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [filter, setFilter] = useState("pending");

  // Determine default filter based on user role
  useEffect(() => {
    if (user?.role === "registration") {
      setFilter("pending");
    } else if (user?.role === "transport") {
      setFilter("pending");
    }
  }, [user?.role]);

  useEffect(() => {
    fetchContracts();
  }, [filter, user?.role]);

  const fetchContracts = async () => {
    try {
      setLoading(true);

      // Determine workflow status filter based on user role and filter selection
      let workflowStatusFilter = null;
      if (filter !== "all") {
        if (user?.role === "registration") {
          // RAMA users see bikes that need RAMA inspection (Section D)
          if (filter === "pending" || filter === "rama_pending") {
            workflowStatusFilter = "rama_pending";
          } else if (filter === "completed" || filter === "rama_completed") {
            workflowStatusFilter = "rama_completed";
          }
        } else if (user?.role === "transport") {
          // GIDIONI users see bikes that need GIDIONI inspection (Sections A-C)
          // after RAMA has completed
          if (filter === "pending" || filter === "rama_completed") {
            workflowStatusFilter = "rama_completed";
          } else if (filter === "completed" || filter === "gidioni_completed") {
            workflowStatusFilter = "gidioni_completed";
          }
        }
      }

      // Fetch all inspections and contracts
      const [inspectionsRes, contractsRes] = await Promise.all([
        axios.get("/api/inspections"),
        axios.get("/api/contracts"),
      ]);

      const allInspections = inspectionsRes.data || [];
      const allContracts = contractsRes.data || [];

      // Debug: Log what we're getting
      console.log("All contracts:", allContracts.length);
      console.log("All contracts data:", allContracts); // Show all contracts to see their types
      console.log("All inspections:", allInspections.length);
      console.log("User role:", user?.role);
      console.log("Filter:", filter);

      // Filter purchase contracts with motorcycles
      // Important: Show all purchase contracts that have motorcycleId
      // This includes contracts that were just created and don't have inspections yet
      let contractsWithMotorcycles = allContracts.filter((c) => {
        // Must have motorcycleId and be a purchase contract
        // Also check if motorcycle data exists in nested object
        const hasMotorcycle = !!(c.motorcycleId || c.motorcycle?.id);
        // Make type comparison case-insensitive and handle different formats
        const contractType = (c.type || "").toLowerCase().trim();
        const isPurchase = contractType === "purchase";

        if (!hasMotorcycle) {
          console.log("Contract missing motorcycleId:", {
            contractNumber: c.contractNumber,
            id: c.id,
            motorcycleId: c.motorcycleId,
            hasMotorcycleObject: !!c.motorcycle,
            type: c.type,
          });
        }
        if (!isPurchase && c.type) {
          console.log("Contract not purchase type - Full contract data:", {
            contractNumber: c.contractNumber,
            id: c.id,
            type: c.type,
            typeLowercase: contractType,
            motorcycleId: c.motorcycleId,
            fullContract: c, // Show full contract to debug
          });
        }
        return hasMotorcycle && isPurchase;
      });

      console.log(
        "Contracts with motorcycles:",
        contractsWithMotorcycles.length
      );

      // For RAMA users: Show contracts that either:
      // 1. Don't have an inspection yet (can start inspection)
      // 2. Have inspection with workflow_status = "rama_pending" or "rama_completed"
      if (user?.role === "registration") {
        if (filter === "pending" || filter === "rama_pending") {
          // Show contracts without inspection OR with rama_pending status
          const beforeFilter = contractsWithMotorcycles.length;
          contractsWithMotorcycles = contractsWithMotorcycles.filter((c) => {
            const inspection = allInspections.find((i) => {
              // Try matching by contract ID (both string and UUID formats)
              return (
                i.contractId === c.id ||
                i.contractId === c._id ||
                String(i.contractId) === String(c.id)
              );
            });
            // Show if no inspection exists (new contract) OR has rama_pending status
            const shouldShow =
              !inspection || inspection.workflowStatus === "rama_pending";
            if (!shouldShow && inspection) {
              console.log(
                `Filtering out contract ${c.contractNumber}: inspection status is ${inspection.workflowStatus}`
              );
            }
            if (!inspection) {
              console.log(
                `Contract ${c.contractNumber} has no inspection - will show`
              );
            }
            return shouldShow;
          });
          console.log(
            `After RAMA pending filter: ${beforeFilter} -> ${contractsWithMotorcycles.length}`
          );
        } else if (filter === "completed" || filter === "rama_completed") {
          // Show only contracts with rama_completed status
          contractsWithMotorcycles = contractsWithMotorcycles.filter((c) => {
            const inspection = allInspections.find((i) => {
              // Try matching by contract ID (both string and UUID formats)
              return (
                i.contractId === c.id ||
                i.contractId === c._id ||
                String(i.contractId) === String(c.id)
              );
            });
            return inspection?.workflowStatus === "rama_completed";
          });
        }
        // If filter is "all", show all purchase contracts
      } else if (user?.role === "transport") {
        // For GIDIONI: Only show contracts with rama_completed status
        if (filter === "pending" || filter === "rama_completed") {
          contractsWithMotorcycles = contractsWithMotorcycles.filter((c) => {
            const inspection = allInspections.find(
              (i) => i.contractId === c.id
            );
            return (
              inspection?.workflowStatus === "rama_completed" ||
              inspection?.workflowStatus === "gidioni_pending"
            );
          });
        } else if (filter === "completed" || filter === "gidioni_completed") {
          contractsWithMotorcycles = contractsWithMotorcycles.filter((c) => {
            const inspection = allInspections.find(
              (i) => i.contractId === c.id
            );
            return (
              inspection?.workflowStatus === "gidioni_completed" ||
              inspection?.workflowStatus === "completed"
            );
          });
        }
      }

      // Enrich contracts with inspection data
      const contractsWithInspections = contractsWithMotorcycles.map(
        (contract) => {
          const inspection = allInspections.find(
            (i) => i.contractId === contract.id
          );
          return {
            ...contract,
            inspection,
            workflowStatus: inspection?.workflowStatus || "rama_pending",
            // Ensure motorcycle data is available from either direct fields or nested object
            motorcycleBrand:
              contract.motorcycleBrand || contract.motorcycle?.brand || "N/A",
            motorcycleModel:
              contract.motorcycleModel || contract.motorcycle?.model || "",
            motorcycleChassisNumber:
              contract.motorcycleChassisNumber ||
              contract.motorcycle?.chassisNumber ||
              "N/A",
          };
        }
      );

      console.log(
        "Final contracts to display:",
        contractsWithInspections.length
      );
      setContracts(contractsWithInspections);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (contractId, status) => {
    // Find the contract and its inspection
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) {
      alert("Contract haijapatikana.");
      return;
    }

    const inspection = contract.inspection;
    if (!inspection) {
      alert("Ukaguzi haujaanza bado. Tafadhali anza ukaguzi kwanza.");
      return;
    }

    const confirmMessage =
      status === "verified"
        ? "Thibitisha kuwa ukaguzi wa RAMA umekamilika? Baada ya uthibitisho, ukaguzi utaenda kwa GIDIONI."
        : "Huthibitisha kuwa ukaguzi haujakamilika?";

    if (!window.confirm(confirmMessage)) return;

    try {
      // Update inspection workflow status to rama_completed
      await axios.put(`/api/inspections/${inspection.id}`, {
        workflowStatus: "rama_completed",
        status: "completed",
      });
      alert(
        status === "verified"
          ? "Ukaguzi wa RAMA umethibitishwa! Sasa unaweza kwenda kwa GIDIONI."
          : "Ukaguzi umekataliwa."
      );
      fetchContracts();
      setViewModalOpen(false);
    } catch (error) {
      alert(
        "Imeshindwa kuthibitisha ukaguzi: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const openViewModal = (contract) => {
    setSelectedContract(contract);
    setViewModalOpen(true);
  };

  const columns = [
    {
      header: "Contract Number",
      accessor: "contractNumber",
    },
    {
      header: "Motorcycle",
      render: (row) => (
        <div>
          <p className="font-semibold">
            {row.motorcycleBrand || "N/A"} {row.motorcycleModel || ""}
          </p>
          <p className="text-xs text-gray-500">
            Chassis: {row.motorcycleChassisNumber || "N/A"}
          </p>
        </div>
      ),
    },
    {
      header: "Amount",
      render: (row) => (
        <span className="font-semibold">
          {row.currency || "TZS"} {parseFloat(row.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Date",
      render: (row) =>
        row.date ? new Date(row.date).toLocaleDateString() : "N/A",
    },
    {
      header: "Workflow Status",
      render: (row) => {
        const workflowStatus = row.workflowStatus || "rama_pending";
        const statusConfig = {
          rama_pending: {
            color: "bg-yellow-100 text-yellow-800",
            label: "RAMA: Inasubiri",
            icon: <FiAlertCircle className="inline mr-1" />,
          },
          rama_completed: {
            color: "bg-blue-100 text-blue-800",
            label: "RAMA: Imekamilika",
            icon: <FiCheck className="inline mr-1" />,
          },
          gidioni_pending: {
            color: "bg-orange-100 text-orange-800",
            label: "GIDIONI: Inasubiri",
            icon: <FiAlertCircle className="inline mr-1" />,
          },
          gidioni_completed: {
            color: "bg-purple-100 text-purple-800",
            label: "GIDIONI: Imekamilika",
            icon: <FiCheck className="inline mr-1" />,
          },
          completed: {
            color: "bg-green-100 text-green-800",
            label: "Imekamilika",
            icon: <FiCheck className="inline mr-1" />,
          },
        };
        const config =
          statusConfig[workflowStatus] || statusConfig.rama_pending;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
          >
            {config.icon}
            {config.label}
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row) => {
        const workflowStatus =
          row.workflowStatus ||
          row.inspection?.workflowStatus ||
          "rama_pending";
        // Show verify button for RAMA when:
        // 1. User is registration role
        // 2. Inspection exists
        // 3. Workflow status is rama_pending (not yet completed)
        const hasInspection = !!row.inspection;
        const isRamaPending =
          workflowStatus === "rama_pending" ||
          workflowStatus === null ||
          workflowStatus === undefined;
        const canVerify =
          user?.role === "registration" && hasInspection && isRamaPending;

        return (
          <div className="flex space-x-2">
            {/* Eye icon - Link to inspection form */}
            {row.inspection ? (
              <a
                href={`/inspection-form?id=${row.inspection.id}`}
                className="text-blue-600 hover:text-blue-800"
                title="Angalia/Fanya Ukaguzi"
              >
                <FiEye className="w-5 h-5" />
              </a>
            ) : (
              <a
                href={`/inspection-form?contractId=${row.id}&motorcycleId=${row.motorcycleId}`}
                className="text-blue-600 hover:text-blue-800"
                title="Anza Ukaguzi"
              >
                <FiEye className="w-5 h-5" />
              </a>
            )}
            {/* Tick icon - Verify action (only for RAMA when inspection is pending) */}
            {canVerify && (
              <button
                onClick={() => handleVerify(row.id, "verified")}
                className="text-green-600 hover:text-green-800"
                title="Thibitisha Ukaguzi"
              >
                <FiCheck className="w-5 h-5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Count based on user role and workflow status
  const getPendingCount = () => {
    if (user?.role === "registration") {
      return contracts.filter((c) => c.workflowStatus === "rama_pending")
        .length;
    } else if (user?.role === "transport") {
      return contracts.filter(
        (c) =>
          c.workflowStatus === "rama_completed" ||
          c.workflowStatus === "gidioni_pending"
      ).length;
    }
    return contracts.filter((c) => c.workflowStatus === "rama_pending").length;
  };

  const getCompletedCount = () => {
    if (user?.role === "registration") {
      return contracts.filter((c) => c.workflowStatus === "rama_completed")
        .length;
    } else if (user?.role === "transport") {
      return contracts.filter(
        (c) =>
          c.workflowStatus === "gidioni_completed" ||
          c.workflowStatus === "completed"
      ).length;
    }
    return contracts.filter((c) => c.workflowStatus === "completed").length;
  };

  const pendingCount = getPendingCount();
  const completedCount = getCompletedCount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
              Bike for Inspection
            </h1>
            <p className="text-gray-600">
              {user?.role === "registration"
                ? "Ukaguzi wa Usalama (RAMA) - Sehemu D"
                : user?.role === "transport"
                ? "Ukaguzi wa Ubora na Matengenezo (GIDIONI) - Sehemu A-C"
                : "Ukaguzi wa Pikipiki"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inasubiri Ukaguzi</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pikipiki zisizokaguliwa
                </p>
              </div>
              <FiAlertCircle className="text-yellow-600 text-4xl" />
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {user?.role === "registration"
                    ? "RAMA: Zimekamilika"
                    : "GIDIONI: Zimekamilika"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {completedCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.role === "registration"
                    ? "Zinaweza kwenda kwa GIDIONI"
                    : "Ukaguzi umekamilika"}
                </p>
              </div>
              <FiCheck className="text-green-600 text-4xl" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={filter === "all" ? "primary" : "outline"}
            onClick={() => setFilter("all")}
          >
            Zote
          </Button>
          <Button
            variant={filter === "pending" ? "primary" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Inasubiri ({pendingCount})
          </Button>
          <Button
            variant={filter === "completed" ? "primary" : "outline"}
            onClick={() => setFilter("completed")}
          >
            {user?.role === "registration"
              ? "RAMA: Zimekamilika"
              : "GIDIONI: Zimekamilika"}{" "}
            ({completedCount})
          </Button>
        </div>

        {/* Contracts Table */}
        <Card>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Muhimu:</strong> Pikipiki zote zinatakiwa zikague na
              kuthibitishwa na Rama kabla ya pesa kuingia kwenye mfumo wa
              malipo. Bila uthibitisho, pesa haziwezi kwenda kwa admin/cashier.
            </p>
          </div>
          <TableWithSearch
            columns={columns}
            data={contracts}
            searchKeys={[
              "contractNumber",
              "motorcycleBrand",
              "motorcycleModel",
            ]}
          />
        </Card>
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedContract(null);
        }}
        title="Contract Details"
        size="lg"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Contract Number</p>
                <p className="font-semibold">
                  {selectedContract.contractNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-semibold">{selectedContract.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Motorcycle</p>
                <p className="font-semibold">
                  {selectedContract.motorcycleBrand}{" "}
                  {selectedContract.motorcycleModel}
                </p>
                <p className="text-xs text-gray-500">
                  Chassis: {selectedContract.motorcycleChassisNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold">
                  {selectedContract.currency || "TZS"}{" "}
                  {parseFloat(selectedContract.amount || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {selectedContract.date
                    ? new Date(selectedContract.date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inspection Status</p>
                <p className="font-semibold">
                  {selectedContract.ramaInspectionStatus || "pending"}
                </p>
              </div>
            </div>

            {selectedContract.ramaInspectionStatus === "pending" && (
              <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedContract(null);
                  }}
                >
                  Funga
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleVerify(selectedContract.id, "rejected")}
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <FiX className="inline mr-2" />
                  Kataa
                </Button>
                <Button
                  onClick={() => handleVerify(selectedContract.id, "verified")}
                  className="bg-green-600 text-white"
                >
                  <FiCheck className="inline mr-2" />
                  Thibitisha Ukaguzi
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BikeForInspection;
