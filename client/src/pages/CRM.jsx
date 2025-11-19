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
  FiUser,
  FiUsers,
  FiTrendingUp,
  FiMapPin,
  FiDollarSign,
} from "react-icons/fi";

const CRM = () => {
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState("all"); // all, customers, suppliers, buyers, sellers
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactHistory, setContactHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const [customersRes, suppliersRes] = await Promise.all([
        axios.get("/api/customers"),
        axios.get("/api/suppliers"),
      ]);

      const customers = (customersRes.data || []).map((c) => ({
        ...c,
        type: "customer",
        contactType: "buyer",
      }));
      const suppliers = (suppliersRes.data || []).map((s) => ({
        ...s,
        type: "supplier",
        contactType: "seller",
        fullName: s.name,
        idType: null,
        idNumber: null,
      }));

      let allContacts = [...customers, ...suppliers];

      // Apply filter
      if (filter === "customers") {
        allContacts = customers;
      } else if (filter === "suppliers") {
        allContacts = suppliers;
      } else if (filter === "buyers") {
        allContacts = customers;
      } else if (filter === "sellers") {
        allContacts = suppliers;
      }

      // Fetch transaction stats for each contact
      const contactsWithStats = await Promise.all(
        allContacts.map(async (contact) => {
          try {
            // Get all contracts and filter by partyId
            const contractsRes = await axios.get("/api/contracts");
            const allContracts = contractsRes.data || [];
            const contracts = allContracts.filter(
              (c) => c.partyId === contact.id
            );

            // Calculate stats
            const totalTransactions = contracts.length;
            const totalValue = contracts.reduce(
              (sum, c) => sum + (parseFloat(c.amount) || 0),
              0
            );
            const averageValue =
              totalTransactions > 0 ? totalValue / totalTransactions : 0;

            // Get all motorcycles and filter
            const motorcyclesRes = await axios.get("/api/motorcycles");
            const allMotorcycles = motorcyclesRes.data || [];
            const motorcycles = allMotorcycles.filter(
              (m) =>
                (contact.type === "customer" && m.customerId === contact.id) ||
                (contact.type === "supplier" && m.supplierId === contact.id)
            );

            return {
              ...contact,
              stats: {
                totalTransactions,
                totalValue,
                averageValue,
                totalMotorcycles: motorcycles.length,
                lastTransactionDate: contracts[0]?.date || null,
              },
            };
          } catch (error) {
            return {
              ...contact,
              stats: {
                totalTransactions: 0,
                totalValue: 0,
                averageValue: 0,
                totalMotorcycles: 0,
                lastTransactionDate: null,
              },
            };
          }
        })
      );

      setContacts(contactsWithStats);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactHistory = async (contactId, contactType) => {
    try {
      const [contractsRes, motorcyclesRes] = await Promise.all([
        axios.get("/api/contracts"),
        axios.get("/api/motorcycles"),
      ]);

      const contracts = (contractsRes.data || []).filter(
        (c) =>
          (contactType === "customer" && c.partyId === contactId) ||
          (contactType === "supplier" && c.partyId === contactId)
      );

      const motorcycles = (motorcyclesRes.data || []).filter(
        (m) =>
          (contactType === "customer" && m.customerId === contactId) ||
          (contactType === "supplier" && m.supplierId === contactId)
      );

      setContactHistory({
        contracts,
        motorcycles,
      });
    } catch (error) {
      console.error("Error fetching contact history:", error);
    }
  };

  const handleViewHistory = (contact) => {
    setSelectedContact(contact);
    fetchContactHistory(contact.id, contact.type);
    setModalOpen(true);
  };

  const columns = [
    {
      header: "Name",
      render: (row) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FiUser className="text-blue-600" />
          </div>
          <span className="font-medium">{row.fullName || row.name}</span>
        </div>
      ),
    },
    {
      header: "Type",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.type === "customer"
              ? "bg-green-100 text-green-800"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {row.type === "customer" ? "Customer" : "Supplier"}
        </span>
      ),
    },
    {
      header: "Phone",
      accessor: "phone",
    },
    {
      header: "Location",
      render: (row) => (
        <div className="flex items-center space-x-1 text-gray-600">
          <FiMapPin className="w-4 h-4" />
          <span>{row.city || row.address || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Transactions",
      render: (row) => (
        <div>
          <p className="font-semibold">{row.stats?.totalTransactions || 0}</p>
          <p className="text-xs text-gray-500">
            TZS {row.stats?.totalValue?.toLocaleString() || "0"}
          </p>
        </div>
      ),
    },
    {
      header: "Avg Value",
      render: (row) => (
        <span className="font-medium">
          TZS {row.stats?.averageValue?.toLocaleString() || "0"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewHistory(row)}
            className="text-blue-600 hover:text-blue-800"
            title="View History"
          >
            <FiTrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (row.type === "customer") {
                window.location.href = `/customers`;
              } else {
                window.location.href = `/suppliers`;
              }
            }}
            className="text-green-600 hover:text-green-800"
            title="Edit"
          >
            <FiEdit className="w-4 h-4" />
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
              CRM - Contacts Management
            </h1>
            <p className="text-gray-600">
              Unified view of all customers, suppliers, buyers, and sellers
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4">
        <Card className="mb-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Contacts
            </Button>
            <Button
              variant={filter === "customers" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("customers")}
            >
              Customers
            </Button>
            <Button
              variant={filter === "suppliers" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("suppliers")}
            >
              Suppliers
            </Button>
            <Button
              variant={filter === "buyers" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("buyers")}
            >
              Buyers
            </Button>
            <Button
              variant={filter === "sellers" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilter("sellers")}
            >
              Sellers
            </Button>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
              <FiUsers className="text-blue-600 text-3xl" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">
                  {contacts.reduce(
                    (sum, c) => sum + (c.stats?.totalTransactions || 0),
                    0
                  )}
                </p>
              </div>
              <FiTrendingUp className="text-green-600 text-3xl" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  TZS{" "}
                  {contacts
                    .reduce((sum, c) => sum + (c.stats?.totalValue || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <FiDollarSign className="text-yellow-600 text-3xl" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold">
                  TZS{" "}
                  {contacts.length > 0
                    ? (
                        contacts.reduce(
                          (sum, c) => sum + (c.stats?.averageValue || 0),
                          0
                        ) / contacts.length
                      ).toLocaleString()
                    : "0"}
                </p>
              </div>
              <FiTrendingUp className="text-purple-600 text-3xl" />
            </div>
          </Card>
        </div>

        {/* Contacts Table */}
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading contacts...</p>
            </div>
          ) : (
            <TableWithSearch
              columns={columns}
              data={contacts}
              searchKeys={[
                "fullName",
                "name",
                "phone",
                "email",
                "address",
                "city",
              ]}
            />
          )}
        </Card>
      </div>

      {/* Contact History Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedContact(null);
          setContactHistory(null);
        }}
        title={`${
          selectedContact?.fullName || selectedContact?.name
        } - History`}
        size="lg"
      >
        {selectedContact && contactHistory && (
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>
                  <strong>Name:</strong>{" "}
                  {selectedContact.fullName || selectedContact.name}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedContact.phone}
                </p>
                <p>
                  <strong>Email:</strong> {selectedContact.email || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {selectedContact.city || selectedContact.address || "N/A"}
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {selectedContact.type === "customer"
                    ? "Customer"
                    : "Supplier"}
                </p>
                <p>
                  <strong>Total Transactions:</strong>{" "}
                  {selectedContact.stats?.totalTransactions || 0}
                </p>
              </div>
            </div>

            {/* Contracts */}
            <div>
              <h3 className="font-semibold mb-2">
                Contracts ({contactHistory.contracts.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contactHistory.contracts.length > 0 ? (
                  contactHistory.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {contract.contractNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {contract.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {contract.currency}{" "}
                            {parseFloat(contract.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(contract.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No contracts found</p>
                )}
              </div>
            </div>

            {/* Motorcycles */}
            <div>
              <h3 className="font-semibold mb-2">
                Motorcycles ({contactHistory.motorcycles.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contactHistory.motorcycles.length > 0 ? (
                  contactHistory.motorcycles.map((motorcycle) => (
                    <div
                      key={motorcycle.id}
                      className="p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {motorcycle.brand} {motorcycle.model}
                          </p>
                          <p className="text-sm text-gray-600">
                            {motorcycle.chassisNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {motorcycle.status.replace("_", " ").toUpperCase()}
                          </p>
                          {motorcycle.sellingPrice && (
                            <p className="text-xs text-gray-500">
                              TZS{" "}
                              {parseFloat(
                                motorcycle.sellingPrice
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No motorcycles found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CRM;
