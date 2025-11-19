import { useState, useEffect } from "react";
import axios from "axios";
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
  FiDownload,
} from "react-icons/fi";

const Cashier = () => {
  const [transactions, setTransactions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [summary, setSummary] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: "cash_in",
    category: "",
    amount: "",
    currency: "TZS",
    description: "",
    date: new Date().toISOString().split("T")[0],
    contractId: "",
    motorcycleId: "",
    repairId: "",
    supplierId: "",
    customerId: "",
    department: "",
    proofImage: null,
    notes: "",
  });

  const [contracts, setContracts] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const categories = {
    cash_in: [
      { value: "sales_income", label: "Sales Income" },
      { value: "other_income", label: "Other Income" },
      { value: "refunds", label: "Refunds" },
    ],
    cash_out: [
      { value: "fuel", label: "Fuel" },
      { value: "transport", label: "Transport" },
      { value: "broker_fees", label: "Broker Fees" },
      { value: "repairs", label: "Repairs" },
      { value: "debts", label: "Debts" },
      { value: "plates", label: "Plates" },
      { value: "registration", label: "Registration" },
      { value: "purchase_expense", label: "Purchase Expense" },
      { value: "other_expense", label: "Other Expense" },
    ],
  };

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchBalance();
    fetchData();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("/api/finance/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get("/api/finance/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get("/api/finance/balance");
      setBalance(response.data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [contractsRes, motorcyclesRes, suppliersRes, customersRes] =
        await Promise.all([
          axios.get("/api/contracts"),
          axios.get("/api/motorcycles"),
          axios.get("/api/suppliers"),
          axios.get("/api/customers"),
        ]);

      setContracts(contractsRes.data || []);
      setMotorcycles(motorcyclesRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const dataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "proofImage" && formData.proofImage) {
          dataToSend.append("proofImage", formData.proofImage);
        } else if (formData[key] !== null && formData[key] !== "") {
          dataToSend.append(key, formData[key]);
        }
      });

      if (editingTransaction) {
        await axios.put(
          `/api/finance/transactions/${editingTransaction.id}`,
          formData
        );
        alert("Transaction updated successfully!");
      } else {
        await axios.post("/api/finance/transactions", formData);
        alert("Transaction created successfully!");
      }

      fetchTransactions();
      fetchSummary();
      fetchBalance();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await axios.delete(`/api/finance/transactions/${id}`);
        fetchTransactions();
        fetchSummary();
        fetchBalance();
        alert("Transaction deleted successfully!");
      } catch (error) {
        alert("Failed to delete transaction");
      }
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transactionType: transaction.transactionType,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      date: transaction.date,
      contractId: transaction.contractId || "",
      motorcycleId: transaction.motorcycleId || "",
      repairId: transaction.repairId || "",
      supplierId: transaction.supplierId || "",
      customerId: transaction.customerId || "",
      department: transaction.department || "",
      notes: transaction.notes || "",
      proofImage: null,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
    setFormData({
      transactionType: "cash_in",
      category: "",
      amount: "",
      currency: "TZS",
      description: "",
      date: new Date().toISOString().split("T")[0],
      contractId: "",
      motorcycleId: "",
      repairId: "",
      supplierId: "",
      customerId: "",
      department: "",
      proofImage: null,
      notes: "",
    });
  };

  const columns = [
    {
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      header: "Type",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.transactionType === "cash_in"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.transactionType === "cash_in" ? "Cash In" : "Cash Out"}
        </span>
      ),
    },
    {
      header: "Category",
      accessor: "category",
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
      header: "Department",
      accessor: "department",
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
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
              Cashier & Finance
            </h1>
            <p className="text-gray-600">
              Manage cash flow and financial transactions
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  ...formData,
                  transactionType: "cash_out",
                  category: "",
                });
                setModalOpen(true);
              }}
            >
              <FiTrendingDown className="inline mr-2" />
              Cash Out
            </Button>
            <Button
              onClick={() => {
                setFormData({
                  ...formData,
                  transactionType: "cash_in",
                  category: "",
                });
                setModalOpen(true);
              }}
            >
              <FiPlus className="inline mr-2" />
              Cash In
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  TZS {balance?.totalIncome?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {balance?.incomeCount || 0} transactions
                </p>
              </div>
              <FiTrendingUp className="text-green-600 text-4xl" />
            </div>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  TZS {balance?.totalExpenses?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {balance?.expenseCount || 0} transactions
                </p>
              </div>
              <FiTrendingDown className="text-red-600 text-4xl" />
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    (balance?.balance || 0) >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  TZS {balance?.balance?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Net cash flow</p>
              </div>
              <FiDollarSign className="text-blue-600 text-4xl" />
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <Button onClick={() => setModalOpen(true)}>
              <FiPlus className="inline mr-2" />
              Add Transaction
            </Button>
          </div>
          <TableWithSearch
            columns={columns}
            data={transactions}
            searchKeys={["description", "category", "department"]}
          />
        </Card>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? "Edit Transaction" : "New Transaction"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Select
            label="Transaction Type"
            value={formData.transactionType}
            onChange={(e) => {
              setFormData({
                ...formData,
                transactionType: e.target.value,
                category: "", // Reset category when type changes
              });
            }}
            options={[
              { value: "cash_in", label: "Cash In" },
              { value: "cash_out", label: "Cash Out" },
            ]}
            required
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            options={[
              { value: "", label: "Select category..." },
              ...(categories[formData.transactionType] || []),
            ]}
            required
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

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Select
            label="Link to Contract (Optional)"
            value={formData.contractId}
            onChange={(e) =>
              setFormData({ ...formData, contractId: e.target.value })
            }
            options={[
              { value: "", label: "None" },
              ...contracts.map((c) => ({
                value: c.id,
                label: `${c.contractNumber} - ${c.type}`,
              })),
            ]}
          />

          <Select
            label="Department (Optional)"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            options={[
              { value: "", label: "None" },
              { value: "sales", label: "Sales" },
              { value: "transport", label: "Transport" },
              { value: "repairs", label: "Repairs" },
              { value: "registration", label: "Registration" },
              { value: "admin", label: "Admin" },
            ]}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof Document/Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFormData({ ...formData, proofImage: file });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingTransaction ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cashier;
