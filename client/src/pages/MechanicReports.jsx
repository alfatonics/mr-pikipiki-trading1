import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import TableWithSearch from "../components/TableWithSearch";
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiPackage,
  FiDownload,
} from "react-icons/fi";

const MechanicReports = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState("daily");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateFrom, dateTo]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      const params = {};

      switch (activeReport) {
        case "daily":
          endpoint = "/api/mechanic-reports/daily-jobs";
          params.date = dateFrom;
          break;
        case "pending":
          endpoint = "/api/mechanic-reports/pending-jobs";
          break;
        case "completed":
          endpoint = "/api/mechanic-reports/completed-jobs";
          params.dateFrom = dateFrom;
          params.dateTo = dateTo;
          break;
        case "bills":
          endpoint = "/api/mechanic-reports/bills-sent";
          params.dateFrom = dateFrom;
          params.dateTo = dateTo;
          break;
        case "payment":
          endpoint = "/api/mechanic-reports/payment-status";
          break;
        case "spare":
          endpoint = "/api/mechanic-reports/spare-usage";
          params.dateFrom = dateFrom;
          params.dateTo = dateTo;
          break;
        default:
          return;
      }

      const response = await axios.get(endpoint, { params });
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching report:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      id: "daily",
      label: "Daily Repair Jobs",
      description: "Kazi zote zilizofanyika siku hiyo",
      icon: FiFileText,
    },
    {
      id: "pending",
      label: "Pending Jobs",
      description: "Kazi bado hazijaanza",
      icon: FiClock,
    },
    {
      id: "completed",
      label: "Completed Jobs",
      description: "Kazi zilizokamilika",
      icon: FiCheckCircle,
    },
    {
      id: "bills",
      label: "Bills Sent Report",
      description: "Bili zilizotumwa kwa cashier",
      icon: FiDollarSign,
    },
    {
      id: "payment",
      label: "Payment Status",
      description: "Zilizolipwa / Zinasubiri malipo",
      icon: FiDollarSign,
    },
    {
      id: "spare",
      label: "Spare Usage Report",
      description: "Vipuri vilivyotumika kwenye kila kazi",
      icon: FiPackage,
    },
  ];

  const getColumns = () => {
    switch (activeReport) {
      case "daily":
      case "pending":
      case "completed":
        return [
          {
            header: "Motorcycle",
            render: (row) => (
              <div>
                <div className="font-medium">
                  {row.brand} {row.model}
                </div>
                <div className="text-xs text-gray-500">
                  {row.chassis_number}
                </div>
              </div>
            ),
          },
          {
            header: "Description",
            accessor: "description",
          },
          {
            header: "Status",
            render: (row) => (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  row.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : row.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {row.status.replace("_", " ").toUpperCase()}
              </span>
            ),
          },
          {
            header: "Total Cost",
            render: (row) => (
              <span className="font-semibold">
                TZS {parseFloat(row.total_cost || 0).toLocaleString()}
              </span>
            ),
          },
        ];
      case "bills":
        return [
          {
            header: "Bill Number",
            accessor: "billNumber",
          },
          {
            header: "Motorcycle",
            render: (row) => (
              <div>
                {row.motorcycle?.brand} {row.motorcycle?.model}
              </div>
            ),
          },
          {
            header: "Total Amount",
            render: (row) => (
              <span className="font-semibold">
                TZS {row.totalAmount.toLocaleString()}
              </span>
            ),
          },
          {
            header: "Status",
            render: (row) => (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  row.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : row.status === "payment_approved"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {row.status.replace("_", " ").toUpperCase()}
              </span>
            ),
          },
          {
            header: "Date",
            render: (row) => new Date(row.repairDate).toLocaleDateString(),
          },
        ];
      case "payment":
        return [
          {
            header: "Status",
            render: (row) => (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  row.status === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {row.status === "paid" ? "PAID" : "AWAITING"}
              </span>
            ),
          },
          {
            header: "Bill Number",
            accessor: "billNumber",
          },
          {
            header: "Amount",
            render: (row) => (
              <span className="font-semibold">
                TZS {row.totalAmount.toLocaleString()}
              </span>
            ),
          },
          {
            header: "Date",
            render: (row) => new Date(row.repairDate).toLocaleDateString(),
          },
        ];
      case "spare":
        return [
          {
            header: "Spare Part",
            accessor: "name",
          },
          {
            header: "Total Quantity",
            render: (row) => (
              <span className="font-medium">
                {parseInt(row.total_quantity || 0)}
              </span>
            ),
          },
          {
            header: "Total Cost",
            render: (row) => (
              <span className="font-semibold">
                TZS {parseFloat(row.total_cost || 0).toLocaleString()}
              </span>
            ),
          },
          {
            header: "Used In",
            render: (row) => (
              <span>{parseInt(row.used_in_repairs || 0)} repairs</span>
            ),
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
              Mechanic Reports
            </h1>
            <p className="text-gray-600">
              View detailed reports on your repair jobs and performance
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Report Type Selector */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeReport === report.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      activeReport === report.id
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      activeReport === report.id
                        ? "text-blue-900"
                        : "text-gray-700"
                    }`}
                  >
                    {report.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Date Filters */}
        {(activeReport === "daily" ||
          activeReport === "completed" ||
          activeReport === "bills" ||
          activeReport === "spare") && (
          <Card className="mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              {(activeReport === "completed" ||
                activeReport === "bills" ||
                activeReport === "spare") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <Button onClick={fetchReport}>
                <FiDownload className="inline mr-2" />
                Refresh
              </Button>
            </div>
          </Card>
        )}

        {/* Payment Status Summary */}
        {activeReport === "payment" && reportData.paid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paid Bills</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.paid.count}
                  </p>
                  <p className="text-sm text-gray-500">
                    TZS {reportData.paid.total.toLocaleString()}
                  </p>
                </div>
                <FiCheckCircle className="text-green-600 text-3xl" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Awaiting Payment</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reportData.awaiting.count}
                  </p>
                  <p className="text-sm text-gray-500">
                    TZS {reportData.awaiting.total.toLocaleString()}
                  </p>
                </div>
                <FiClock className="text-yellow-600 text-3xl" />
              </div>
            </Card>
          </div>
        )}

        {/* Report Data Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading report...</p>
            </div>
          ) : Array.isArray(reportData) && reportData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No data found for this report</p>
            </div>
          ) : activeReport === "payment" ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Paid Bills</h3>
                <TableWithSearch
                  columns={getColumns()}
                  data={reportData.paid?.bills || []}
                />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Awaiting Payment</h3>
                <TableWithSearch
                  columns={getColumns()}
                  data={reportData.awaiting?.bills || []}
                />
              </div>
            </div>
          ) : (
            <TableWithSearch columns={getColumns()} data={reportData} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default MechanicReports;


