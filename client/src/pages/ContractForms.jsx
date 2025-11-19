import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import { FiPrinter, FiSave, FiArrowLeft } from "react-icons/fi";

const ContractForms = () => {
  const [searchParams] = useSearchParams();
  const contractType = searchParams.get("type") || "sale"; // "sale" or "purchase"
  const contractId = searchParams.get("contractId");
  const motorcycleId = searchParams.get("motorcycleId");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Company info (MR PIKIPIKI TRADING)
    companyRegistration: "518309",
    companyTIN: "54888667",
    companyAddress: "UBUNGO RIVERSIDE",
    companyPhone: "0744882955",
    companyRepresentative: "EMANWELY PATRICK MWAMLIMA",
    companyRepPhone: "0676238482",
    companyRepAddress: "UBUNGO",

    // Date
    contractDate: new Date().toLocaleDateString("sw-TZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),

    // Party info (Customer/Supplier)
    partyName: "",
    partyTIN: "",
    partyAddress: "",
    partyPhone: "",
    partyIdType: "",
    partyIdNumber: "",
    partyPhoto: null,

    // Motorcycle info
    motorcycleRegistration: "",
    motorcycleType: "",
    motorcycleYear: "",
    motorcycleEngineNumber: "",
    motorcycleChassisNumber: "",
    motorcycleColor: "",
  });

  const [motorcycles, setMotorcycles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);

  useEffect(() => {
    fetchData();
    if (contractId) {
      fetchContractData();
    }
  }, [contractId, motorcycleId]);

  const fetchData = async () => {
    try {
      const [bikesRes, customersRes, suppliersRes] = await Promise.all([
        axios.get("/api/motorcycles"),
        axios.get("/api/customers"),
        axios.get("/api/suppliers"),
      ]);

      setMotorcycles(bikesRes.data || []);
      setCustomers(customersRes.data || []);
      setSuppliers(suppliersRes.data || []);

      if (motorcycleId) {
        const bike = bikesRes.data.find((m) => m.id === motorcycleId);
        if (bike) {
          setSelectedMotorcycle(bike);
          updateMotorcycleFields(bike);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const contractRes = await axios.get(`/api/contracts/${contractId}`);
      const contract = contractRes.data;

      // Fetch related data
      const [motorcycleRes, partyRes] = await Promise.all([
        axios.get(`/api/motorcycles/${contract.motorcycleId}`),
        contract.partyModel === "Customer"
          ? axios.get(`/api/customers/${contract.partyId}`)
          : axios.get(`/api/suppliers/${contract.partyId}`),
      ]);

      const motorcycle = motorcycleRes.data;
      const party = partyRes.data;

      setSelectedMotorcycle(motorcycle);
      setSelectedParty(party);

      // Update form with contract data
      setFormData((prev) => ({
        ...prev,
        contractDate: new Date(contract.date).toLocaleDateString("sw-TZ", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        partyName: party.fullName || party.name,
        partyTIN: party.taxId || "",
        partyAddress: party.address || "",
        partyPhone: party.phone || "",
        partyIdType: party.idType || "",
        partyIdNumber: party.idNumber || "",
        motorcycleRegistration: motorcycle.registrationNumber || "",
        motorcycleType: `${motorcycle.brand} ${motorcycle.model}`,
        motorcycleYear: motorcycle.year,
        motorcycleEngineNumber: motorcycle.engineNumber,
        motorcycleChassisNumber: motorcycle.chassisNumber,
        motorcycleColor: motorcycle.color,
      }));
    } catch (error) {
      console.error("Error fetching contract:", error);
      alert("Failed to load contract data");
    } finally {
      setLoading(false);
    }
  };

  const updateMotorcycleFields = (motorcycle) => {
    setFormData((prev) => ({
      ...prev,
      motorcycleRegistration: motorcycle.registrationNumber || "",
      motorcycleType: `${motorcycle.brand} ${motorcycle.model}`,
      motorcycleYear: motorcycle.year,
      motorcycleEngineNumber: motorcycle.engineNumber,
      motorcycleChassisNumber: motorcycle.chassisNumber,
      motorcycleColor: motorcycle.color,
    }));
  };

  const updatePartyFields = (party) => {
    setFormData((prev) => ({
      ...prev,
      partyName: party.fullName || party.name,
      partyTIN: party.taxId || "",
      partyAddress: party.address || "",
      partyPhone: party.phone || "",
      partyIdType: party.idType || "",
      partyIdNumber: party.idNumber || "",
    }));
  };

  const handleMotorcycleChange = (motorcycleId) => {
    const motorcycle = motorcycles.find((m) => m.id === motorcycleId);
    if (motorcycle) {
      setSelectedMotorcycle(motorcycle);
      updateMotorcycleFields(motorcycle);
    }
  };

  const handlePartyChange = (partyId) => {
    const parties = contractType === "sale" ? customers : suppliers;
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      setSelectedParty(party);
      updatePartyFields(party);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    // This would save the form data or create/update contract
    alert("Form saved successfully!");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sw-TZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/contracts" className="text-gray-600 hover:text-gray-900">
              <FiArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contractType === "sale"
                  ? "Mkataba wa Mauziano"
                  : "Mkataba wa Kununua"}
              </h1>
              <p className="text-gray-600">Jaza na Print Mkataba</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleSave}>
              <FiSave className="inline mr-2" />
              Hifadhi
            </Button>
            <Button onClick={handlePrint}>
              <FiPrinter className="inline mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Form Selection (Hidden when printing) */}
      <div className="p-4 print:hidden">
        <Card className="mb-4">
          <h3 className="text-lg font-semibold mb-4">Chagua Taarifa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Chagua Pikipiki"
              value={selectedMotorcycle?.id || ""}
              onChange={(e) => handleMotorcycleChange(e.target.value)}
              options={[
                { value: "", label: "Chagua pikipiki..." },
                ...motorcycles.map((m) => ({
                  value: m.id,
                  label: `${m.brand} ${m.model} - ${m.chassisNumber}`,
                })),
              ]}
            />
            <Select
              label={
                contractType === "sale" ? "Chagua Mnunuzi" : "Chagua Muuzaji"
              }
              value={selectedParty?.id || ""}
              onChange={(e) => handlePartyChange(e.target.value)}
              options={[
                {
                  value: "",
                  label: `Chagua ${
                    contractType === "sale" ? "mnunuzi" : "muuzaji"
                  }...`,
                },
                ...(contractType === "sale" ? customers : suppliers).map(
                  (p) => ({
                    value: p.id,
                    label: `${p.fullName || p.name} - ${p.phone}`,
                  })
                ),
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Contract Form (Printable) */}
      <div className="p-4 print:p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 print:shadow-none">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold mb-2">
                MKATABA WA MAUZIANO YA PIKIPIKI
              </h2>
              <p className="text-sm text-gray-600">
                Mkataba huu wa kuuza pikipiki unafungwa leo{" "}
                <span className="font-semibold">{formData.contractDate}</span>
              </p>
            </div>

            {/* Parties Section */}
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">KATI YA</p>
                <div className="pl-4 space-y-1">
                  <p>
                    <strong>MR PIKIPIKI TRADING</strong> Yenye USAJILI NAMBA{" "}
                    {formData.companyRegistration}, TIN NO {formData.companyTIN}
                    , Inayopatikana {formData.companyAddress}, mawasiliano{" "}
                    {formData.companyPhone} inayowakilishwa na{" "}
                    {formData.companyRepresentative} mwenye namba ya simu{" "}
                    {formData.companyRepPhone} MKAZI wa{" "}
                    {formData.companyRepAddress}{" "}
                    {contractType === "sale"
                      ? "(ambaye anatambulika kama muuzaji, ikiwa ni Pamoja na warithi wake wote na wawakilishi wake kisheria)"
                      : "(ambaye anatambulika kama MNUNUZI, ikiwa ni Pamoja na warithi wake wote na wawakilishi wake kisheria)"}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">NA</p>
                <div className="pl-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p>
                        <strong>NDUGU</strong>{" "}
                        {formData.partyName || "____________________"}
                      </p>
                      <p className="mt-2">
                        <strong>
                          PICHA YA{" "}
                          {contractType === "sale" ? "MNUNUZI" : "MUUZAJI"}
                        </strong>
                      </p>
                      <div className="border-2 border-dashed border-gray-300 h-32 flex items-center justify-center mt-2">
                        {formData.partyPhoto ? (
                          <img
                            src={formData.partyPhoto}
                            alt="Party Photo"
                            className="max-h-full"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">
                            (ibandikwe hapa)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <strong>TIN NO</strong>{" "}
                        {formData.partyTIN || "____________________"}
                      </p>
                      <p>
                        <strong>MAKAZI</strong>{" "}
                        {formData.partyAddress || "____________________"}
                      </p>
                      <p>
                        <strong>NAMBA ZA SIMU</strong>{" "}
                        {formData.partyPhone || "____________________"}
                      </p>
                      <p>
                        <strong>AINA YA KITAMBULISHO</strong>{" "}
                        {formData.partyIdType || "____________________"}
                      </p>
                      <p>
                        <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                        {formData.partyIdNumber || "____________________"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    (ambaye anatambulika kama{" "}
                    {contractType === "sale" ? "mnunuzi" : "muuzaji"} ikiwa ni
                    Pamoja na warithi wote na wawakilishi wake kisheria)
                  </p>
                </div>
              </div>
            </div>

            {/* Motorcycle Details */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">
                PIKIPIKI YENYE TAARIFA ZIFUATAZO
              </p>
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div>
                  <p>
                    <strong>USAJILI</strong>{" "}
                    {formData.motorcycleRegistration || "____________________"}
                  </p>
                  <p>
                    <strong>AINA</strong>{" "}
                    {formData.motorcycleType || "____________________"}
                  </p>
                  <p>
                    <strong>MWAKA</strong>{" "}
                    {formData.motorcycleYear || "____________________"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>ENGINE NUMBER</strong>{" "}
                    {formData.motorcycleEngineNumber || "____________________"}
                  </p>
                  <p>
                    <strong>CHASIS NUMBER</strong>{" "}
                    {formData.motorcycleChassisNumber || "____________________"}
                  </p>
                  <p>
                    <strong>RANGI</strong>{" "}
                    {formData.motorcycleColor || "____________________"}
                  </p>
                </div>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="font-semibold mb-4">SAHIHI YA KAMPUNI</p>
                  <div className="space-y-2">
                    <p>Jina: {formData.companyRepresentative}</p>
                    <p>Sahihi: _________________________</p>
                    <p>Tarehe: {formData.contractDate}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-4">
                    SAHIHI YA {contractType === "sale" ? "MNUNUZI" : "MUUZAJI"}
                  </p>
                  <div className="space-y-2">
                    <p>Jina: {formData.partyName || "____________________"}</p>
                    <p>Sahihi: _________________________</p>
                    <p>Tarehe: _________________________</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-8, .print\\:p-8 * {
            visibility: visible;
          }
          .print\\:p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractForms;
