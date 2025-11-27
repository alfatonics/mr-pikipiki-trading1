import { useState, useEffect } from "react";
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
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiX,
} from "react-icons/fi";

const Loans = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loans, setLoans] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [summary, setSummary] = useState(null);

  const [formData, setFormData] = useState({
    loanType: "we_owe",
    personName: "",
    personPhone: "",
    personEmail: "",
    personType: "other",
    amount: "",
    currency: "TZS",
    description: "",
    dueDate: "",
    interestRate: 0,
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchLoans();
    fetchSummary();
  }, [filterType]);

  const fetchLoans = async () => {
    try {
      const params = {};
      if (filterType !== "all") {
        params.loanType = filterType;
      }
      const response = await axios.get("/api/loans", { params });
      setLoans(response.data);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get("/api/loans/summary/stats");
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLoan) {
        await axios.put(`/api/loans/${editingLoan.id}`, formData);
      } else {
        await axios.post("/api/loans", formData);
      }
      fetchLoans();
      fetchSummary();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save loan");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await axios.delete(`/api/loans/${id}`);
        fetchLoans();
        fetchSummary();
      } catch (error) {
        alert(error.response?.data?.error || "Failed to delete loan");
      }
    }
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setFormData({
      loanType: loan.loanType,
      personName: loan.personName,
      personPhone: loan.personPhone || "",
      personEmail: loan.personEmail || "",
      personType: loan.personType || "other",
      amount: loan.amount,
      currency: loan.currency,
      description: loan.description,
      dueDate: loan.dueDate || "",
      interestRate: loan.interestRate || 0,
      notes: loan.notes || "",
    });
    setModalOpen(true);
  };

  const handleAddPayment = (loan) => {
    setSelectedLoan(loan);
    setPaymentData({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/loans/${selectedLoan.id}/payments`, paymentData);
      fetchLoans();
      fetchSummary();
      setPaymentModalOpen(false);
      setSelectedLoan(null);
      alert("Payment recorded successfully!");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to record payment");
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingLoan(null);
    setFormData({
      loanType: "we_owe",
      personName: "",
      personPhone: "",
      personEmail: "",
      personType: "other",
      amount: "",
      currency: "TZS",
      description: "",
      dueDate: "",
      interestRate: 0,
      notes: "",
    });
  };

  const getSummaryData = () => {
    if (!summary) return { weOwe: 0, oweUs: 0, totalActive: 0 };
    const weOwe = summary
      .filter((s) => s.loan_type === "we_owe" && s.status === "active")
      .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    const oweUs = summary
      .filter((s) => s.loan_type === "owe_us" && s.status === "active")
      .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    return { weOwe, oweUs, totalActive: weOwe + oweUs };
  };

  const summaryData = getSummaryData();

  const columns = [
    {
      header: "Type",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.loanType === "we_owe"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.loanType === "we_owe" ? "We Owe" : "Owe Us"}
        </span>
      ),
    },
    {
      header: "Person",
      render: (row) => (
        <div>
          <div className="font-medium">{row.personName}</div>
          {row.personPhone && (
            <div className="text-xs text-gray-500">{row.personPhone}</div>
          )}
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "personType",
    },
    {
      header: "Amount",
      render: (row) => (
        <span className="font-semibold">
          {row.currency} {parseFloat(row.amount).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Description",
      accessor: "description",
    },
    {
      header: "Due Date",
      render: (row) =>
        row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "N/A",
    },
    {
      header: "Status",
      render: (row) => {
        const statusColors = {
          active: "bg-blue-100 text-blue-800",
          paid: "bg-green-100 text-green-800",
          overdue: "bg-red-100 text-red-800",
          cancelled: "bg-gray-100 text-gray-800",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[row.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          {row.status === "active" && (
            <button
              onClick={() => handleAddPayment(row)}
              className="text-green-600 hover:text-green-800"
              title="Add Payment"
            >
              <FiDollarSign className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => handleDelete(row.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
              Loans & Debts
            </h1>
            <p className="text-gray-600">
              Track money we owe and money owed to us
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Add Loan/Debt
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">We Owe</p>
                <p className="text-2xl font-bold text-red-600">
                  TZS {summaryData.weOwe.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total active debts</p>
              </div>
              <FiTrendingDown className="text-red-600 text-4xl" />
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Owe Us</p>
                <p className="text-2xl font-bold text-green-600">
                  TZS {summaryData.oweUs.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total receivables</p>
              </div>
              <FiTrendingUp className="text-green-600 text-4xl" />
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Position</p>
                <p
                  className={`text-2xl font-bold ${
                    summaryData.oweUs - summaryData.weOwe >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  TZS {(summaryData.oweUs - summaryData.weOwe).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Net balance</p>
              </div>
              <FiDollarSign className="text-blue-600 text-4xl" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={filterType === "all" ? "primary" : "outline"}
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button
            variant={filterType === "we_owe" ? "primary" : "outline"}
            onClick={() => setFilterType("we_owe")}
          >
            We Owe
          </Button>
          <Button
            variant={filterType === "owe_us" ? "primary" : "outline"}
            onClick={() => setFilterType("owe_us")}
          >
            Owe Us
          </Button>
        </div>

        {/* Loans Table */}
        <Card>
          <TableWithSearch
            columns={columns}
            data={loans}
            searchKeys={["personName", "personPhone", "description"]}
          />
        </Card>
      </div>

      {/* Loan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingLoan ? "Edit Loan/Debt" : "New Loan/Debt"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Loan Type"
            value={formData.loanType}
            onChange={(e) =>
              setFormData({ ...formData, loanType: e.target.value })
            }
            options={[
              { value: "we_owe", label: "We Owe (Debt)" },
              { value: "owe_us", label: "Owe Us (Receivable)" },
            ]}
            required
          />

          <Input
            label="Person/Company Name"
            value={formData.personName}
            onChange={(e) =>
              setFormData({ ...formData, personName: e.target.value })
            }
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.personPhone}
              onChange={(e) =>
                setFormData({ ...formData, personPhone: e.target.value })
              }
            />
            <Input
              label="Email"
              type="email"
              value={formData.personEmail}
              onChange={(e) =>
                setFormData({ ...formData, personEmail: e.target.value })
              }
            />
          </div>

          <Select
            label="Person Type"
            value={formData.personType}
            onChange={(e) =>
              setFormData({ ...formData, personType: e.target.value })
            }
            options={[
              { value: "customer", label: "Customer" },
              { value: "supplier", label: "Supplier" },
              { value: "staff", label: "Staff" },
              { value: "other", label: "Other" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              options={[
                { value: "TZS", label: "TZS" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
              ]}
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={(e) =>
                setFormData({ ...formData, interestRate: e.target.value })
              }
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit">{editingLoan ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedLoan(null);
        }}
        title="Add Payment"
        size="md"
      >
        {selectedLoan && (
          <form onSubmit={handlePaymentSubmit}>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Loan/Debt</p>
              <p className="font-semibold">{selectedLoan.personName}</p>
              <p className="text-sm text-gray-600">
                Remaining: {selectedLoan.currency}{" "}
                {parseFloat(selectedLoan.amount).toLocaleString()}
              </p>
            </div>

            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              value={paymentData.amount}
              onChange={(e) =>
                setPaymentData({ ...paymentData, amount: e.target.value })
              }
              required
            />

            <Input
              label="Payment Date"
              type="date"
              value={paymentData.paymentDate}
              onChange={(e) =>
                setPaymentData({ ...paymentData, paymentDate: e.target.value })
              }
              required
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, notes: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedLoan(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Loans;




