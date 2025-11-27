import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import { FiCheckCircle, FiDollarSign, FiEdit, FiPackage } from "react-icons/fi";

export default function PricingApproval() {
  const { user } = useAuth();
  const [pendingMotorcycles, setPendingMotorcycles] = useState([]);
  const [pricedMotorcycles, setPricedMotorcycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingData, setPricingData] = useState({
    profitMargin: 20,
    salePrice: 0,
  });

  useEffect(() => {
    fetchMotorcycles();
  }, []);

  const fetchMotorcycles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/motorcycles");
      const all = response.data || [];

      // Motorcycles pending pricing
      const pending = all.filter(
        (m) => m.pricingStatus === "pending_pricing" && m.totalCost > 0
      );

      // Motorcycles already priced / approved
      const priced = all.filter(
        (m) =>
          m.pricingStatus === "approved" ||
          (m.pricingStatus !== "pending_pricing" &&
            (m.salePrice || m.sellingPrice))
      );

      setPendingMotorcycles(pending);
      setPricedMotorcycles(priced);
    } catch (error) {
      console.error("Failed to fetch motorcycles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPricing = (motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    const totalCost = parseFloat(motorcycle.totalCost || 0);

    // If already has sale price, use it to calculate current margin, otherwise default 20%
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
    const totalCost = parseFloat(selectedMotorcycle?.totalCost || 0);
    const calculatedPrice = totalCost * (1 + margin / 100);

    setPricingData({
      profitMargin: margin,
      salePrice: Math.round(calculatedPrice),
    });
  };

  const handleSalePriceChange = (e) => {
    const salePrice = parseFloat(e.target.value) || 0;
    const totalCost = parseFloat(selectedMotorcycle?.totalCost || 0);
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
        `Je, una uhakika kuwa unataka kuweka bei ya mauzo TZS ${pricingData.salePrice.toLocaleString()} kwa ${
          selectedMotorcycle.brand
        } ${selectedMotorcycle.model}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const totalCost = parseFloat(selectedMotorcycle.totalCost || 0);
      const salePrice = parseFloat(pricingData.salePrice || 0);
      const profit = salePrice - totalCost;

      await axios.put(`/api/motorcycles/${selectedMotorcycle.id}`, {
        profitMargin: pricingData.profitMargin,
        // keep salePrice for explicit selling price column
        salePrice: salePrice,
        // sync core pricing fields used in reports / dashboard
        sellingPrice: salePrice,
        priceIn: totalCost,
        priceOut: salePrice,
        profit: profit,
        pricingStatus: "approved",
        // Database only allows: in_stock, sold, in_repair, in_transit, reserved
        // So we use in_stock to indicate it is back in stock / ready for sale
        status: "in_stock",
        approvedBy: user.id,
        approvedAt: new Date(),
      });

      alert("Bei ya mauzo imewekwa na pikipiki imewekwa kwenye stock!");

      setPricingModalOpen(false);
      fetchMotorcycles();
    } catch (error) {
      console.error("Failed to approve pricing:", error);
      alert(
        error.response?.data?.error ||
          "Imeshindwa kuweka bei ya mauzo. Tafadhali jaribu tena."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `TZS ${parseFloat(amount || 0).toLocaleString()}`;
  };

  const calculateProfit = () => {
    const totalCost = parseFloat(selectedMotorcycle?.totalCost || 0);
    const salePrice = parseFloat(pricingData.salePrice || 0);
    return salePrice - totalCost;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Pricing Approval - Weka Bei ya Mauzo
        </h1>
        <p className="text-gray-600 mt-2">
          Weka faida na bei ya mauzo kwa pikipiki zilizokamilika matengenezo
        </p>
      </div>

      <Card title="Motorcycles Pending Pricing" className="mb-6">
        {loading && <p className="text-gray-600">Inapakia...</p>}

        {!loading && pendingMotorcycles.length === 0 && (
          <p className="text-gray-600">
            Hakuna pikipiki zinazongoja kuwekwa bei ya mauzo.
          </p>
        )}

        {!loading && pendingMotorcycles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pikipiki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chassis Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bei ya Manunuzi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gharama za Matengenezo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gharama Nyingine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumla ya Gharama
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingMotorcycles.map((motorcycle) => (
                  <tr key={motorcycle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center">
                          <FiPackage className="text-gray-400 mr-2 mt-1" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {motorcycle.brand} {motorcycle.model}
                            </div>
                            <div className="text-xs text-gray-500">
                              {motorcycle.year}
                            </div>
                          </div>
                        </div>
                        {/* Action button moved here so it is always visible on small screens */}
                        <Button
                          size="sm"
                          onClick={() => handleOpenPricing(motorcycle)}
                          className="whitespace-nowrap"
                        >
                          <FiDollarSign className="inline mr-1" />
                          Weka Bei ya Mauzo
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {motorcycle.chassisNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(motorcycle.purchasePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(motorcycle.repairCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(motorcycle.otherCosts)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(motorcycle.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Already priced / approved motorcycles */}
      <Card title="Motorcycles with Approved Pricing" className="mb-6">
        {loading && <p className="text-gray-600">Inapakia...</p>}

        {!loading && pricedMotorcycles.length === 0 && (
          <p className="text-gray-600">
            Hakuna pikipiki zenye bei ya mauzo iliyothibitishwa bado.
          </p>
        )}

        {!loading && pricedMotorcycles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pikipiki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chassis Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumla ya Gharama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bei ya Mauzo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Faida
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricedMotorcycles.map((motorcycle) => {
                  const totalCost = parseFloat(motorcycle.totalCost || 0);
                  const sale =
                    parseFloat(
                      motorcycle.salePrice || motorcycle.sellingPrice || 0
                    ) || 0;
                  const profit = sale - totalCost;

                  return (
                    <tr key={motorcycle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center">
                            <FiPackage className="text-gray-400 mr-2 mt-1" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {motorcycle.brand} {motorcycle.model}
                              </div>
                              <div className="text-xs text-gray-500">
                                {motorcycle.year}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOpenPricing(motorcycle)}
                            className="whitespace-nowrap"
                          >
                            <FiEdit className="inline mr-1" />
                            Badili Bei
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {motorcycle.chassisNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(sale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span
                          className={
                            profit >= 0 ? "text-green-700" : "text-red-700"
                          }
                        >
                          {formatCurrency(profit)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pricing Modal */}
      <Modal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        title="Weka Bei ya Mauzo"
        size="lg"
      >
        {selectedMotorcycle && (
          <div className="space-y-4">
            {/* Motorcycle Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Taarifa za Pikipiki
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Pikipiki:</strong> {selectedMotorcycle.brand}{" "}
                {selectedMotorcycle.model} ({selectedMotorcycle.year})
              </p>
              <p className="text-sm text-gray-700">
                <strong>Chassis Number:</strong>{" "}
                {selectedMotorcycle.chassisNumber}
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Muhtasari wa Gharama
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Bei ya Manunuzi:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedMotorcycle.purchasePrice)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Gharama za Matengenezo:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedMotorcycle.repairCost)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Gharama Nyingine:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedMotorcycle.otherCosts)}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900">JUMLA YA GHARAMA:</span>
                    <span className="text-blue-700">
                      {formatCurrency(selectedMotorcycle.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Inputs */}
            <div className="p-4 bg-green-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Weka Faida na Bei ya Mauzo
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faida (Profit Margin) %
                  </label>
                  <Input
                    type="number"
                    value={pricingData.profitMargin}
                    onChange={handleProfitMarginChange}
                    min="0"
                    step="0.1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mfano: 20% = TZS{" "}
                    {formatCurrency(
                      parseFloat(selectedMotorcycle.totalCost) * 0.2
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bei ya Mauzo (TZS)
                  </label>
                  <Input
                    type="number"
                    value={pricingData.salePrice}
                    onChange={handleSalePriceChange}
                    min="0"
                    step="1000"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unaweza ku-edit moja kwa moja
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Faida (Profit):</span>
                  <span
                    className={`font-bold ${
                      calculateProfit() >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(calculateProfit())}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2">
                  <span className="text-gray-900">BEI YA MAUZO:</span>
                  <span className="text-green-700">
                    {formatCurrency(pricingData.salePrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setPricingModalOpen(false)}
              >
                Funga
              </Button>
              <Button
                onClick={handleApprovePricing}
                disabled={loading || pricingData.salePrice <= 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FiCheckCircle className="inline mr-2" />
                {loading ? "Inahifadhi..." : "Thibitisha na Weka Stock"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
