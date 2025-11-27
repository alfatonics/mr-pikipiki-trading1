import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { FiCheckCircle, FiDollarSign, FiFileText } from "react-icons/fi";

export default function Cashier() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [approvedBills, setApprovedBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/repair-bills");

      // Filter bills that are sent to cashier (pending cashier approval)
      const cashierBills = response.data.filter(
        (b) => b.status === "sent_to_cashier"
      );
      setBills(cashierBills);

      // Fetch bills that this cashier has already approved (history)
      if (user?.id) {
        const approvedRes = await axios.get("/api/repair-bills", {
          params: { approvedByMe: true },
        });
        setApprovedBills(approvedRes.data || []);
      } else {
        setApprovedBills([]);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bill) => {
    try {
      // Fetch full bill details including repair and motorcycle info
      const response = await axios.get(`/api/repair-bills/${bill.id}`);
      setSelectedBill(response.data);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch bill details:", error);
      alert("Failed to load bill details");
    }
  };

  const handleApproveBill = async () => {
    if (!selectedBill) return;

    if (
      !window.confirm(
        `Je, una uhakika kuwa unataka kuthibitisha malipo ya TZS ${selectedBill.totalAmount?.toLocaleString()}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Approve payment
      await axios.post(`/api/repair-bills/${selectedBill.id}/approve-payment`);

      alert(
        "Malipo yamethibitishwa! Taarifa imetumwa kwa Admin kwa ajili ya kuweka bei ya mauzo."
      );

      setDetailsModalOpen(false);
      fetchBills();
    } catch (error) {
      console.error("Failed to approve payment:", error);
      alert(
        error.response?.data?.error ||
          "Imeshindwa kuthibitisha malipo. Tafadhali jaribu tena."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `TZS ${parseFloat(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Cashier - Malipo ya Matengenezo
        </h1>
        <p className="text-gray-600 mt-2">
          Thibitisha malipo ya bili za matengenezo
        </p>
      </div>

      <Card title="Bills Pending Payment Approval" className="mb-6">
        {loading && <p className="text-gray-600">Inapakia...</p>}

        {!loading && bills.length === 0 && (
          <p className="text-gray-600">
            Hakuna bili zinazongoja uthibitisho wa malipo.
          </p>
        )}

        {!loading && bills.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pikipiki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Maelezo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumla (TZS)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tarehe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.billNumber || bill.id?.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.motorcycle?.brand} {bill.motorcycle?.model}
                      <br />
                      <span className="text-xs text-gray-500">
                        {bill.motorcycle?.chassisNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {bill.description?.substring(0, 50)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        bill.repairDate || bill.createdAt
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button size="sm" onClick={() => handleViewDetails(bill)}>
                        <FiFileText className="inline mr-1" />
                        Angalia na Thibitisha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* History: bills this cashier has already approved (sent to admin) */}
      <Card
        title="Bills Zilizothibitishwa na Kutumwa kwa Admin"
        className="mb-6"
      >
        {approvedBills.length === 0 ? (
          <p className="text-gray-600">
            Bado hujathibitisha bili yoyote au hakuna rekodi za zamani.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pikipiki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Maelezo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumla (TZS)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hali
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.billNumber || bill.id?.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.motorcycle?.brand} {bill.motorcycle?.model}
                      <br />
                      <span className="text-xs text-gray-500">
                        {bill.motorcycle?.chassisNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {bill.description?.substring(0, 50)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                      {bill.status || "payment_approved"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Bill Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Bill Details - Thibitisha Malipo"
        size="lg"
      >
        {selectedBill && (
          <div className="space-y-4">
            {/* Motorcycle Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Taarifa za Pikipiki
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Pikipiki:</strong> {selectedBill.motorcycle?.brand}{" "}
                {selectedBill.motorcycle?.model}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Chassis Number:</strong>{" "}
                {selectedBill.motorcycle?.chassisNumber}
              </p>
            </div>

            {/* Repair Description */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Maelezo ya Matengenezo
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {selectedBill.description || "Hakuna maelezo"}
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Muhtasari wa Gharama
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    Gharama ya Kazi (Labor):
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(selectedBill.laborCost)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    Gharama ya Vipuri (Spare Parts):
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(selectedBill.sparePartsCost)}
                  </span>
                </div>

                {selectedBill.repair?.spareParts &&
                  selectedBill.repair.spareParts.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-600">
                        Vipuri Vilivyotumika:
                      </p>
                      {selectedBill.repair.spareParts.map((part, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-xs text-gray-600"
                        >
                          <span>
                            • {part.name} (x{part.quantity})
                          </span>
                          <span>{formatCurrency(part.cost)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900">JUMLA YA MALIPO:</span>
                    <span className="text-green-700">
                      {formatCurrency(selectedBill.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDetailsModalOpen(false)}
              >
                Funga
              </Button>
              <Button
                onClick={handleApproveBill}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FiCheckCircle className="inline mr-2" />
                {loading ? "Inathibitisha..." : "Thibitisha Malipo"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
