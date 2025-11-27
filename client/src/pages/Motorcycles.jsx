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
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
} from "react-icons/fi";

const Motorcycles = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [motorcycles, setMotorcycles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [pricingData, setPricingData] = useState({
    profitMargin: 20,
    salePrice: 0,
  });
  const [formData, setFormData] = useState({
    chassisNumber: "",
    engineNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    purchasePrice: "",
    sellingPrice: "",
    priceIn: "",
    profit: "",
    supplier: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    status: "in_stock",
    registrationNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchMotorcycles();
    }
  }, [user]);

  const fetchMotorcycles = async () => {
    try {
      const response = await axios.get("/api/motorcycles");
      setMotorcycles(response.data);
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only allow editing, not creating new motorcycles
    if (!editingMotorcycle) {
      alert(
        "Motorcycles can only be added through the contract flow. Please create a contract first."
      );
      return;
    }

    try {
      // Only allow editing existing motorcycles (for admin to update selling price)
      await axios.put(
        `/api/motorcycles/${editingMotorcycle.id || editingMotorcycle._id}`,
        formData
      );
      fetchMotorcycles();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save motorcycle");
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("Only admins can archive motorcycles");
      return;
    }

    if (
      !window.confirm(
        "Badala ya kufuta kabisa, pikipiki hii itawekwa kama 'reserved/archived' na haitatumika kwenye mauzo mapya. Una uhakika?"
      )
    ) {
      return;
    }

    try {
      // Soft-delete: badala ya DELETE, tunabadilisha status kuwa 'reserved'
      await axios.put(`/api/motorcycles/${id}`, {
        status: "reserved",
      });
      fetchMotorcycles();
      alert("Pikipiki imewekwa kama 'reserved/archived' badala ya kufutwa.");
    } catch (error) {
      alert(
        error.response?.data?.error ||
          "Imeshindwa kubadilisha status ya pikipiki."
      );
    }
  };

  const handleEdit = (motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setFormData({
      chassisNumber: motorcycle.chassisNumber,
      engineNumber: motorcycle.engineNumber,
      brand: motorcycle.brand,
      model: motorcycle.model,
      year: motorcycle.year,
      color: motorcycle.color,
      purchasePrice: motorcycle.purchasePrice || "",
      sellingPrice: motorcycle.sellingPrice || "",
      priceIn: motorcycle.priceIn || "",
      profit: motorcycle.profit || "",
      // Supplier comes from contract; keep id internally but don't edit in UI
      supplier: motorcycle.supplierId || "",
      purchaseDate: new Date(motorcycle.purchaseDate)
        .toISOString()
        .split("T")[0],
      status: motorcycle.status,
      registrationNumber: motorcycle.registrationNumber || "",
      notes: motorcycle.notes || "",
    });
    setModalOpen(true);
  };

  // Open pricing modal (same experience as Pricing Approval)
  const handleOpenPricing = (motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    const totalCost = parseFloat(
      motorcycle.totalCost || motorcycle.priceIn || 0
    );
    const existingSale =
      parseFloat(motorcycle.salePrice || motorcycle.sellingPrice || 0) || 0;
    const defaultMargin =
      totalCost > 0 && existingSale > 0
        ? ((existingSale - totalCost) / totalCost) * 100
        : 20;
    const marginRounded = Math.round(defaultMargin * 100) / 100;
    const calculatedPrice =
      existingSale > 0 ? existingSale : totalCost * (1 + marginRounded / 100);

    setPricingData({
      profitMargin: marginRounded,
      salePrice: Math.round(calculatedPrice),
    });
    setPricingModalOpen(true);
  };

  const handleProfitMarginChange = (e) => {
    const margin = parseFloat(e.target.value) || 0;
    const totalCost = parseFloat(
      selectedMotorcycle?.totalCost || selectedMotorcycle?.priceIn || 0
    );
    const calculatedPrice = totalCost * (1 + margin / 100);

    setPricingData({
      profitMargin: margin,
      salePrice: Math.round(calculatedPrice),
    });
  };

  const handleSalePriceChange = (e) => {
    const salePrice = parseFloat(e.target.value) || 0;
    const totalCost = parseFloat(
      selectedMotorcycle?.totalCost || selectedMotorcycle?.priceIn || 0
    );
    const margin =
      totalCost > 0 ? ((salePrice - totalCost) / totalCost) * 100 : 0;

    setPricingData({
      profitMargin: Math.round(margin * 100) / 100,
      salePrice: salePrice,
    });
  };

  const handleApprovePricing = async () => {
    if (!selectedMotorcycle) return;

    if (pricingData.salePrice <= 0) {
      alert("Bei ya mauzo lazima iwe zaidi ya 0");
      return;
    }

    if (
      !window.confirm(
        `Je, una uhakika kuwa unataka kuweka/kuhifadhi bei ya mauzo TZS ${pricingData.salePrice.toLocaleString()} kwa ${
          selectedMotorcycle.brand
        } ${selectedMotorcycle.model}?`
      )
    ) {
      return;
    }

    try {
      const totalCost = parseFloat(
        selectedMotorcycle.totalCost || selectedMotorcycle.priceIn || 0
      );
      const salePrice = parseFloat(pricingData.salePrice || 0);
      const profit = salePrice - totalCost;

      await axios.put(
        `/api/motorcycles/${selectedMotorcycle.id || selectedMotorcycle._id}`,
        {
          profitMargin: pricingData.profitMargin,
          salePrice: salePrice,
          sellingPrice: salePrice,
          priceIn: totalCost,
          priceOut: salePrice,
          profit: profit,
        }
      );

      alert("Bei ya mauzo imehifadhiwa kwa pikipiki hii.");
      setPricingModalOpen(false);
      fetchMotorcycles();
    } catch (error) {
      console.error("Failed to save pricing:", error);
      alert(
        error.response?.data?.error ||
          "Imeshindwa kuhifadhi bei ya mauzo. Tafadhali jaribu tena."
      );
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMotorcycle(null);
    setFormData({
      chassisNumber: "",
      engineNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      purchasePrice: "",
      sellingPrice: "",
      priceIn: "",
      profit: "",
      supplier: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      status: "in_stock",
      registrationNumber: "",
      notes: "",
    });
  };

  const columns = [
    { header: "Brand", accessor: "brand" },
    { header: "Model", accessor: "model" },
    { header: "Chassis No", accessor: "chassisNumber" },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "in_stock"
              ? "bg-green-100 text-green-800"
              : row.status === "sold"
              ? "bg-blue-100 text-blue-800"
              : row.status === "in_repair"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {row.status.replace("_", " ").toUpperCase()}
        </span>
      ),
    },
    {
      header: "Selling Price (Bei ya Mauzo)",
      render: (row) =>
        row.sellingPrice
          ? `TZS ${parseFloat(row.sellingPrice).toLocaleString()}`
          : "Not Set",
    },
    {
      header: "Price In",
      render: (row) =>
        row.priceIn ? `TZS ${parseFloat(row.priceIn).toLocaleString()}` : "N/A",
    },
    {
      header: "Profit",
      render: (row) =>
        row.profit ? `TZS ${parseFloat(row.profit).toLocaleString()}` : "N/A",
    },
    {
      header: "Supplier",
      render: (row) => row.supplierName || "N/A",
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          {(isAdmin || row.status !== "in_stock") && (
            <button
              onClick={() => handleEdit(row)}
              className="text-blue-600 hover:text-blue-800 p-1 sm:p-0"
              title="Edit"
            >
              <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {row.status === "in_stock" && (
            <button
              onClick={() =>
                window.open(
                  `/contracts?create=sale&motorcycle=${row._id}`,
                  "_blank"
                )
              }
              className="text-green-600 hover:text-green-800 p-1 sm:p-0"
              title="Create Sale Contract"
            >
              <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => handleOpenPricing(row)}
              className="text-purple-600 hover:text-purple-800 p-1 sm:p-0"
              title="Weka / Badili Bei ya Mauzo"
            >
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => handleDelete(row.id || row._id)}
              className="text-red-600 hover:text-red-800 p-1 sm:p-0"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">
              Motorcycles
            </h1>
            <p className="text-gray-600">
              Manage motorcycle inventory and details
            </p>
          </div>
          <div className="flex gap-2">
            <div className="text-sm text-gray-500 italic">
              Motorcycles are added automatically through the contract flow:
              Contract → Rama Inspection → Gidi Inspection → Repairs → Payment →
              Admin Approval → Stock
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card>
          <TableWithSearch
            columns={columns}
            data={motorcycles}
            searchKeys={[
              "brand",
              "model",
              "chassisNumber",
              "engineNumber",
              "color",
              "supplier.name",
            ]}
          />
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingMotorcycle ? "Edit Motorcycle" : "Add New Motorcycle"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Chassis Number"
              value={formData.chassisNumber}
              onChange={(e) =>
                setFormData({ ...formData, chassisNumber: e.target.value })
              }
              required
            />
            <Input
              label="Engine Number"
              value={formData.engineNumber}
              onChange={(e) =>
                setFormData({ ...formData, engineNumber: e.target.value })
              }
              required
            />
            <Input
              label="Brand"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              required
            />
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              required
            />
            <Input
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
              required
            />
            <Input
              label="Color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              required
            />
            <Input
              label="Selling Price (Bei ya Mauzo)"
              type="number"
              value={formData.sellingPrice}
              onChange={(e) =>
                setFormData({ ...formData, sellingPrice: e.target.value })
              }
              required
            />
            {isAdmin && (
              <>
                <Input
                  label="Purchase Price (Internal)"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: e.target.value })
                  }
                />
                <Input
                  label="Price In (Purchase + Repairs + Extras)"
                  type="number"
                  value={formData.priceIn}
                  onChange={(e) =>
                    setFormData({ ...formData, priceIn: e.target.value })
                  }
                />
                <Input
                  label="Profit"
                  type="number"
                  value={formData.profit}
                  onChange={(e) =>
                    setFormData({ ...formData, profit: e.target.value })
                  }
                />
              </>
            )}
            {/* Supplier name (read-only, fetched from contract / database) */}
            <Input
              label="Supplier"
              value={editingMotorcycle?.supplierName || ""}
              readOnly
            />
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: "in_stock", label: "In Stock" },
                { value: "sold", label: "Sold" },
                { value: "in_repair", label: "In Repair" },
                { value: "in_transit", label: "In Transit" },
                { value: "reserved", label: "Reserved" },
              ]}
            />
            <Input
              label="Registration Number"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData({ ...formData, registrationNumber: e.target.value })
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
            />
          </div>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingMotorcycle ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pricing Modal for editing selling price from Motorcycles page */}
      <Modal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        title="Weka / Badili Bei ya Mauzo"
        size="lg"
      >
        {selectedMotorcycle && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Taarifa za Pikipiki
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Pikipiki:</strong> {selectedMotorcycle.brand}{" "}
                {selectedMotorcycle.model}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Chassis Number:</strong>{" "}
                {selectedMotorcycle.chassisNumber}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Muhtasari wa Gharama
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Bei ya Manunuzi:</span>
                  <span className="font-semibold">
                    {`TZS ${parseFloat(
                      selectedMotorcycle.purchasePrice || 0
                    ).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    Jumla ya Gharama (Price In):
                  </span>
                  <span className="font-semibold">
                    {`TZS ${parseFloat(
                      selectedMotorcycle.totalCost ||
                        selectedMotorcycle.priceIn ||
                        0
                    ).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Weka Faida na Bei ya Mauzo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Faida (Profit Margin) %"
                    type="number"
                    value={pricingData.profitMargin}
                    onChange={handleProfitMarginChange}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <Input
                    label="Bei ya Mauzo (TZS)"
                    type="number"
                    value={pricingData.salePrice}
                    onChange={handleSalePriceChange}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Faida (Profit):</span>
                  <span className="font-bold">
                    {`TZS ${(
                      pricingData.salePrice -
                      (selectedMotorcycle.totalCost ||
                        selectedMotorcycle.priceIn ||
                        0)
                    ).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setPricingModalOpen(false)}
              >
                Funga
              </Button>
              <Button
                onClick={handleApprovePricing}
                disabled={pricingData.salePrice <= 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FiCheckCircle className="inline mr-2" />
                Hifadhi Bei ya Mauzo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Motorcycles;
