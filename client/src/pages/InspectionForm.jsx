import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import ImageUploader from "../components/ImageUploader";
import { FiPrinter, FiSave, FiArrowLeft, FiCheck, FiX } from "react-icons/fi";

const InspectionForm = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get("id");
  const motorcycleId = searchParams.get("motorcycleId");
  const contractId = searchParams.get("contractId");

  // Determine inspection type based on user role
  const inspectionType =
    user?.role === "transport"
      ? "gidi"
      : user?.role === "registration"
      ? "rama"
      : searchParams.get("type") || "gidi";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    inspectionDate: new Date().toISOString().split("T")[0],
    staffName: "",
    staffSignature: "",
    mechanicName: "",
    mechanicSignature: "",

    // Motorcycle Info
    motorcycleName: "",
    motorcycleType: "",
    motorcycleEngineNumber: "",
    motorcycleChassisNumber: "",
    customerName: "",
    customerPhone: "",

    // Section A: External Appearance (20 questions)
    externalAppearance: {
      q1: null, // Mkasi sawa
      q2: null, // Tairi zote salama
      q3: null, // Brake mbele/nyuma
      q4: null, // Haijapinda/gonga kifua
      q5: null, // Rangi maeneo yaliyoharibika
      q6: null, // Tank halina kutu
      q7: null, // Shokapu mbele hazivuji
      q8: null, // Shokapu nyuma sawa
      q9: null, // Mudguard mbele sawa
      q10: null, // Mikono clutch/brake sawa
      q11: null, // Side cover zimefungwa
      q12: null, // Chain box haigongi
      q13: null, // Stendi zote sawa
      q14: null, // Speed meter cable sawa
      q15: null, // Imesafishwa
      q16: null, // Funguo wafungua tank
      q17: null, // Engine & chassis zinalingana
      q18: null, // Limu haijapinda
      q19: null, // Taili hazijatoboka
      q20: null, // Seat imefungwa vizuri
    },

    // Section B: Electrical System (6 questions)
    electricalSystem: {
      q21: null, // Indicators zote zinafanya kazi
      q22: null, // Honi inafanya kazi
      q23: null, // Starter inafanya kazi
      q24: null, // Taa mbele/nyuma zinafanya kazi
      q25: null, // Switch kuwasha/kuzima inafanya kazi
      q26: null, // Nyingineyo
    },

    // Section C: Engine System (16 questions)
    engineSystem: {
      q27: null, // Haitoi moshi
      q28: null, // Timing chain hailii
      q29: null, // Piston haigongi
      q30: null, // Haina leakage
      q31: null, // Shaft haijachomelewa
      q32: null, // Kiki inafanya kazi
      q33: null, // Haina miss
      q34: null, // Mkono haigongi
      q35: null, // Carburator sawa
      q36: null, // Exhaust sawa
      q37: null, // Clutch system sawa
      q38: null, // Gear zote zinaingia
      q39: null, // Gear 1-5 hazivumi
      q40: null, // Exletor sawa
      q41: null, // Tapeti hazigongi
      q42: null, // Engine haina milio tofauti
    },

    // Section D: Seller Information
    sellerPhone: "",
    sellerPassportImage: null,
    sellerIdType: "",
    sellerIdNumber: "",
    sellerPhoneCalled: false,
    sellerAccountAccess: "",
    sellerAccountPassword: "",
    sellerOtpPhone: "",
    broughtBy: "",
    originLocation: "",
    brokerNumber: "",

    // Status
    status: "pending",
    workflowStatus: "rama_pending",
    overallResult: "",
    notes: "",
    inspectionType: inspectionType,
  });

  const [motorcycles, setMotorcycles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [contractData, setContractData] = useState(null); // Store contract details for display

  // Determine which sections to show based on workflow status and user role
  const canEditRamaSection =
    user?.role === "registration" &&
    (formData.workflowStatus === "rama_pending" ||
      formData.workflowStatus === "rama_completed");

  const canEditGidioniSections =
    user?.role === "transport" &&
    (formData.workflowStatus === "gidioni_pending" ||
      formData.workflowStatus === "gidioni_completed" ||
      formData.workflowStatus === "rama_completed");

  const showRamaSection =
    canEditRamaSection ||
    formData.workflowStatus === "gidioni_pending" ||
    formData.workflowStatus === "gidioni_completed" ||
    formData.workflowStatus === "completed";
  const showGidioniSections =
    canEditGidioniSections || formData.workflowStatus === "completed";

  // Motorcycle selector:
  // - For GIDIONI (transport) wanapochagua pikipiki kwa mnunuzi
  // - Au kama hakuna contract kabisa (ukaguzi wa kawaida bila mkataba)
  // RAMA (registration) hutumia pikipiki inayotoka moja kwa moja kwenye contract,
  // kwa hiyo hawatakiwi kuchagua pikipiki kwa mkono hapa.
  const shouldShowMotorcycleSelect = !contractId || user?.role === "transport";

  useEffect(() => {
    console.log("🔄 useEffect triggered:", {
      inspectionId,
      motorcycleId,
      contractId,
      userRole: user?.role,
    });
    fetchData();
    if (inspectionId) {
      fetchInspectionData();
    }
  }, [inspectionId, motorcycleId, contractId, user?.role]);

  const fetchData = async () => {
    try {
      const [bikesRes, customersRes] = await Promise.all([
        axios.get("/api/motorcycles"),
        axios.get("/api/customers"),
      ]);

      setMotorcycles(bikesRes.data || []);
      setCustomers(customersRes.data || []);

      // If contractId is provided, fetch contract details and autofill
      if (contractId) {
        try {
          console.log(
            "📋 Fetching contract details for contractId:",
            contractId
          );
          const contractRes = await axios.get(
            `/api/contracts/${contractId}/detailed`
          );
          const { contract, motorcycle, party } = contractRes.data;

          console.log("📋 Contract data received:", {
            contract: contract?.contractNumber,
            type: contract?.type,
            motorcycle: motorcycle?.chassisNumber,
            party: party?.name || party?.fullName,
          });

          // Store contract data for display (especially for RAMA)
          setContractData({ contract, motorcycle, party });

          // Autofill motorcycle data
          if (motorcycle) {
            setSelectedMotorcycle(motorcycle);
            updateMotorcycleFields(motorcycle);
          } else if (contract.motorcycleId) {
            // Fallback: try to find motorcycle from list
            const bike = bikesRes.data.find(
              (m) => m.id === contract.motorcycleId
            );
            if (bike) {
              setSelectedMotorcycle(bike);
              updateMotorcycleFields(bike);
            }
          }

          // For purchase contracts, party is supplier (not customer)
          // Don't autofill customer details for purchase contracts
          if (contract.type === "purchase" && party) {
            // For purchase contracts, party is supplier
            // We can use supplier info if needed, but don't set customer
            console.log("Purchase contract - Supplier:", party);
          } else if (contract.type === "sale" && party) {
            // For sale contracts, party is customer
            setSelectedCustomer(party);
            setFormData((prev) => ({
              ...prev,
              customerName: party.fullName || party.name,
              customerPhone: party.phone,
            }));
          }
        } catch (error) {
          console.error("Error fetching contract details:", error);
          // Fallback to basic contract fetch
          const contractRes = await axios.get(`/api/contracts/${contractId}`);
          const contract = contractRes.data;

          // Store basic contract data
          setContractData({ contract, motorcycle: null, party: null });

          if (contract.motorcycleId) {
            const bike = bikesRes.data.find(
              (m) => m.id === contract.motorcycleId
            );
            if (bike) {
              setSelectedMotorcycle(bike);
              updateMotorcycleFields(bike);
            }
          }
        }
      } else if (motorcycleId) {
        // If only motorcycleId is provided (no contract)
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

  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      const inspectionRes = await axios.get(`/api/inspections/${inspectionId}`);
      const inspection = inspectionRes.data;

      // Normalize inspection date to "yyyy-MM-dd" for HTML date input
      let normalizedInspectionDate = new Date().toISOString().split("T")[0];
      if (inspection.inspectionDate) {
        try {
          normalizedInspectionDate = new Date(inspection.inspectionDate)
            .toISOString()
            .split("T")[0];
        } catch (e) {
          console.warn("Failed to normalize inspectionDate:", e);
        }
      }

      setFormData((prev) => ({
        ...prev,
        ...inspection,
        inspectionDate: normalizedInspectionDate,
        externalAppearance:
          inspection.externalAppearance || prev.externalAppearance,
        electricalSystem: inspection.electricalSystem || prev.electricalSystem,
        engineSystem: inspection.engineSystem || prev.engineSystem,
        inspectionType: inspection.inspectionType || inspectionType,
        workflowStatus: inspection.workflowStatus || "rama_pending",
        motorcycleName: inspection.motorcycle?.brand || "",
        motorcycleType: inspection.motorcycle?.model || "",
        motorcycleEngineNumber: inspection.motorcycle?.engineNumber || "",
        motorcycleChassisNumber: inspection.motorcycle?.chassisNumber || "",
        customerName: inspection.customer?.name || "",
        customerPhone: inspection.customer?.phone || "",
      }));
    } catch (error) {
      console.error("Error fetching inspection:", error);
      alert("Failed to load inspection data");
    } finally {
      setLoading(false);
    }
  };

  const updateMotorcycleFields = (motorcycle) => {
    setFormData((prev) => ({
      ...prev,
      motorcycleName: motorcycle.brand,
      motorcycleType: motorcycle.model,
      motorcycleEngineNumber: motorcycle.engineNumber,
      motorcycleChassisNumber: motorcycle.chassisNumber,
    }));
  };

  const handleMotorcycleChange = (motorcycleId) => {
    const motorcycle = motorcycles.find((m) => m.id === motorcycleId);
    if (motorcycle) {
      setSelectedMotorcycle(motorcycle);
      updateMotorcycleFields(motorcycle);
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData((prev) => ({
        ...prev,
        customerName: customer.fullName,
        customerPhone: customer.phone,
      }));
    }
  };

  const handleQuestionChange = (section, question, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [question]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Determine workflow status based on user role and current status
      let newWorkflowStatus = formData.workflowStatus || "rama_pending";

      if (!inspectionId) {
        // New inspection - set initial status based on user role
        if (user?.role === "registration") {
          newWorkflowStatus = "rama_pending";
        } else if (user?.role === "transport") {
          // GIDIONI shouldn't create new inspections, but if they do, start at gidioni_pending
          newWorkflowStatus = "gidioni_pending";
        }
      } else {
        // Existing inspection - update based on current status and user role
        // Don't auto-update workflow status on save - only on explicit verification
        // Keep current status unless explicitly changed
        newWorkflowStatus = formData.workflowStatus || "rama_pending";
      }

      // Prepare data to send - clean up undefined values
      const dataToSend = {
        ...formData,
        motorcycleId: selectedMotorcycle?.id || motorcycleId || null,
        contractId: contractId || null,
        customerId: selectedCustomer?.id || null, // Can be null for purchase contracts
        inspectionType: inspectionType,
        workflowStatus: newWorkflowStatus,
        // Ensure required fields are set
        inspectionDate:
          formData.inspectionDate || new Date().toISOString().split("T")[0],
        status: formData.status || "pending",
        // Remove fields that might cause issues
        motorcycleName: undefined,
        motorcycleType: undefined,
        motorcycleEngineNumber: undefined,
        motorcycleChassisNumber: undefined,
        customerName: undefined,
        customerPhone: undefined,
      };

      if (inspectionId) {
        await axios.put(`/api/inspections/${inspectionId}`, dataToSend);
        alert("Ukaguzi umehifadhiwa kwa mafanikio!");
        // Update local state
        setFormData((prev) => ({ ...prev, workflowStatus: newWorkflowStatus }));
      } else {
        const response = await axios.post("/api/inspections", dataToSend);
        alert("Ukaguzi umeundwa kwa mafanikio!");
        // Redirect to edit mode
        window.location.href = `/inspection-form?id=${response.data.id}`;
      }
    } catch (error) {
      console.error("Error saving inspection:", error);
      console.error("Inspection save response:", error.response?.data);
      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Unknown error";
      alert(`Imeshindwa kuhifadhi ukaguzi: ${backendMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Handle verification - GIDIONI completes technical inspection (A, B, C)
  const handleGidioniVerify = async () => {
    if (!inspectionId) {
      alert("Tafadhali hifadhi ukaguzi kwanza kabla ya kuthibitisha.");
      return;
    }

    if (
      !window.confirm(
        "Je, una uhakika kuwa umekamilisha ukaguzi wa GIDIONI (Sehemu A, B, C) na unataka kuuthibitisha? Baada ya uthibitisho, ukaguzi utaenda kwa fundi kwa ajili ya matengenezo."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        // Workflow status update
        workflowStatus: "gidioni_completed",
        status: "completed",
        // Gidioni results / notes
        overallResult: formData.overallResult,
        notes: formData.notes,
        // Basic info that might be needed down the line
        staffName: formData.staffName,
        mechanicName: formData.mechanicName,
      };

      // Remove undefined / empty
      Object.keys(dataToSend).forEach((key) => {
        if (
          dataToSend[key] === undefined ||
          dataToSend[key] === null ||
          dataToSend[key] === ""
        ) {
          delete dataToSend[key];
        }
      });

      await axios.put(`/api/inspections/${inspectionId}`, dataToSend);

      alert(
        "Ukaguzi wa GIDIONI umekamilika kwa mafanikio! Task itaenda kwa fundi kwa ajili ya matengenezo."
      );

      setFormData((prev) => ({
        ...prev,
        workflowStatus: "gidioni_completed",
        status: "completed",
      }));

      // Baada ya kuthibitisha, rudi kwenye ukurasa wa kazi za GIDIONI
      window.location.href = "/tasks";
    } catch (error) {
      console.error("Error verifying GIDIONI inspection:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Unknown error";
      alert(
        `Imeshindwa kuthibitisha ukaguzi wa GIDIONI: ${errorMessage}. Tafadhali jaribu tena.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle verification - RAMA marks inspection as completed
  const handleVerify = async () => {
    if (!inspectionId) {
      alert("Tafadhali hifadhi ukaguzi kwanza kabla ya kuthibitisha.");
      return;
    }

    if (
      !window.confirm(
        "Je, una uhakika kuwa umekamilisha ukaguzi wa RAMA na unataka kuithibitisha? Baada ya uthibitisho, ukaguzi utaenda kwa GIDIONI."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Only send relevant fields for verification - clean up formData
      const dataToSend = {
        // Workflow status update (most important for verification)
        workflowStatus: "rama_completed",
        status: "completed",

        // Basic inspection info (if filled)
        staffName: formData.staffName,
        staffSignature: formData.staffSignature,

        // RAMA Section D: Seller Information (if filled)
        sellerPhone: formData.sellerPhone,
        sellerPassportImage: formData.sellerPassportImage,
        sellerIdType: formData.sellerIdType,
        sellerIdNumber: formData.sellerIdNumber,
        sellerPhoneCalled: formData.sellerPhoneCalled,
        sellerAccountAccess: formData.sellerAccountAccess,
        sellerAccountPassword: formData.sellerAccountPassword,
        sellerOtpPhone: formData.sellerOtpPhone,
        broughtBy: formData.broughtBy,
        originLocation: formData.originLocation,
        brokerNumber: formData.brokerNumber,

        // Inspection type
        inspectionType: formData.inspectionType || "rama",
      };

      // Remove undefined/null values
      Object.keys(dataToSend).forEach((key) => {
        if (
          dataToSend[key] === undefined ||
          dataToSend[key] === null ||
          dataToSend[key] === ""
        ) {
          delete dataToSend[key];
        }
      });

      console.log("Sending verification data:", dataToSend);

      await axios.put(`/api/inspections/${inspectionId}`, dataToSend);
      alert(
        "Ukaguzi umehakikiwa kwa mafanikio! Sasa unaweza kwenda kwa GIDIONI."
      );

      // Update local state
      setFormData((prev) => ({
        ...prev,
        workflowStatus: "rama_completed",
        status: "completed",
      }));

      // Redirect back to bike for inspection page
      window.location.href = "/bike-for-inspection";
    } catch (error) {
      console.error("Error verifying inspection:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Unknown error";
      alert(
        `Imeshindwa kuthibitisha ukaguzi: ${errorMessage}. Tafadhali jaribu tena.`
      );
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (
    section,
    questionKey,
    questionText,
    questionNumber
  ) => {
    const value = formData[section][questionKey];
    return (
      <div
        key={questionKey}
        className="flex items-center space-x-4 py-2 border-b"
      >
        <span className="font-medium w-8">{questionNumber}.</span>
        <span className="flex-1">{questionText}</span>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`${section}-${questionKey}`}
              checked={value === true}
              onChange={() => handleQuestionChange(section, questionKey, true)}
              className="w-4 h-4 text-green-600"
            />
            <span className="text-green-600 font-medium">YES</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`${section}-${questionKey}`}
              checked={value === false}
              onChange={() => handleQuestionChange(section, questionKey, false)}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-red-600 font-medium">NO</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back button - Return to Bike for Inspection for RAMA, or Contracts for others */}
            <a
              href={
                user?.role === "registration" || user?.role === "transport"
                  ? "/bike-for-inspection"
                  : "/contracts"
              }
              className="text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Fomu ya Ukaguzi wa Pikipiki
              </h1>
              <p className="text-gray-600">Kabla ya Kusafirishwa</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleSubmit} disabled={loading}>
              <FiSave className="inline mr-2" />
              {loading ? "Inahifadhi..." : "Hifadhi"}
            </Button>
            {/* RAMA Verification Button */}
            {user?.role === "registration" &&
              inspectionId &&
              formData.workflowStatus === "rama_pending" && (
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <FiCheck className="inline mr-2" />
                  {loading ? "Inathibitisha..." : "Thibitisha Ukaguzi"}
                </Button>
              )}
            {/* GIDIONI Verification Button */}
            {user?.role === "transport" &&
              inspectionId &&
              (formData.workflowStatus === "rama_completed" ||
                formData.workflowStatus === "gidioni_pending") && (
                <Button
                  onClick={handleGidioniVerify}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <FiCheck className="inline mr-2" />
                  {loading
                    ? "Inathibitisha..."
                    : "Thibitisha Ukaguzi wa GIDIONI"}
                </Button>
              )}
            <Button onClick={handlePrint}>
              <FiPrinter className="inline mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Form Selection (Hidden when printing) */}
      {shouldShowMotorcycleSelect && (
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
              {user?.role === "transport" && (
                <Select
                  label="Chagua Mnunuzi"
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  options={[
                    { value: "", label: "Chagua mnunuzi..." },
                    ...customers.map((c) => ({
                      value: c.id,
                      label: `${c.fullName} - ${c.phone}`,
                    })),
                  ]}
                />
              )}
              <Input
                label="Tarehe ya Ukaguzi"
                type="date"
                value={formData.inspectionDate}
                onChange={(e) =>
                  setFormData({ ...formData, inspectionDate: e.target.value })
                }
              />
            </div>
          </Card>
        </div>
      )}

      {/* Contract Details Section - Show for RAMA when contractId exists */}
      {(() => {
        const shouldShow = contractId && user?.role === "registration";
        const willShow = contractId || contractData;
        console.log("🔍 Contract section check:", {
          contractId,
          userRole: user?.role,
          shouldShow,
          willShow,
          hasContractData: !!contractData,
          contractNumber: contractData?.contract?.contractNumber,
        });
        // Temporarily show for debugging - remove after testing
        if (contractId && !shouldShow) {
          console.warn("⚠️ Contract section not showing because:", {
            hasContractId: !!contractId,
            userRole: user?.role,
            expectedRole: "registration",
          });
        }
        if (willShow) {
          console.log("✅ Contract section WILL BE RENDERED");
        } else {
          console.warn("❌ Contract section WILL NOT BE RENDERED");
        }
        return null;
      })()}
      {/* Show contract details if contractId exists - formatted like printable contract */}
      {(contractId || contractData) && (
        <div className="p-4 print:hidden">
          <div className="max-w-4xl mx-auto bg-white p-8 border border-gray-200 rounded-lg shadow-sm mb-4">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold mb-2">
                  {contractData?.contract?.type === "purchase"
                    ? "MKATABA WA KUNUNUA PIKIPIKI"
                    : "MKATABA WA MAUZIANO YA PIKIPIKI"}
                </h2>
                <p className="text-sm text-gray-600">
                  Mkataba huu{" "}
                  {contractData?.contract?.type === "purchase"
                    ? "wa kununua"
                    : "wa kuuza"}{" "}
                  pikipiki unafungwa{" "}
                  {contractData?.contract?.date
                    ? new Date(contractData.contract.date).toLocaleDateString(
                        "sw-TZ"
                      )
                    : "leo"}
                </p>
              </div>

              {/* Contract Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Namba ya Mkataba:</strong>{" "}
                    {contractData?.contract?.contractNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Aina ya Mkataba:</strong>{" "}
                    {contractData?.contract?.type === "purchase"
                      ? "Kununua"
                      : "Kuuza"}
                  </p>
                  <p>
                    <strong>Tarehe:</strong>{" "}
                    {contractData?.contract?.date
                      ? new Date(contractData.contract.date).toLocaleDateString(
                          "sw-TZ"
                        )
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Hali:</strong>{" "}
                    {contractData?.contract?.status || "N/A"}
                  </p>
                </div>
                <div>
                  {contractData?.party && (
                    <>
                      <p>
                        <strong>
                          {contractData.contract?.type === "purchase"
                            ? "Muuzaji"
                            : "Mnunuzi"}
                          :
                        </strong>{" "}
                        {contractData.party.fullName ||
                          contractData.party.name ||
                          "N/A"}
                      </p>
                      {contractData.party.phone && (
                        <p>
                          <strong>Simu:</strong> {contractData.party.phone}
                        </p>
                      )}
                      {contractData.party.address && (
                        <p>
                          <strong>Anwani:</strong> {contractData.party.address}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Motorcycle Details */}
              {contractData?.motorcycle && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">
                    PIKIPIKI YENYE TAARIFA ZIFUATAZO
                  </p>
                  <div className="grid grid-cols-2 gap-4 pl-4 text-sm">
                    <div>
                      <p>
                        <strong>AINA:</strong> {contractData.motorcycle.brand}{" "}
                        {contractData.motorcycle.model}
                      </p>
                      <p>
                        <strong>MWAKA:</strong>{" "}
                        {contractData.motorcycle.year || "N/A"}
                      </p>
                      <p>
                        <strong>RANGI:</strong>{" "}
                        {contractData.motorcycle.color || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>ENGINE NUMBER:</strong>{" "}
                        {contractData.motorcycle.engineNumber}
                      </p>
                      <p>
                        <strong>CHASIS NUMBER:</strong>{" "}
                        {contractData.motorcycle.chassisNumber}
                      </p>
                      {contractData.motorcycle.registrationNumber && (
                        <p>
                          <strong>USAJILI:</strong>{" "}
                          {contractData.motorcycle.registrationNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Owner Section (from notes) */}
              {contractData?.contract?.notes &&
                (() => {
                  try {
                    const notes =
                      typeof contractData.contract.notes === "string"
                        ? JSON.parse(contractData.contract.notes)
                        : contractData.contract.notes;

                    if (notes.previousOwner) {
                      return (
                        <div className="border-t pt-4">
                          <p className="font-semibold mb-3 text-base">
                            PIKIPIKI AMBAYO IMENUNULIWA/KUTOKA KWA
                          </p>
                          <div className="grid grid-cols-2 gap-6 pl-4 text-sm">
                            <div className="space-y-2">
                              <p>
                                <strong>JINA:</strong>{" "}
                                {notes.previousOwner.name || "N/A"}
                              </p>
                              <p>
                                <strong>MAWASILIANO:</strong>{" "}
                                {notes.previousOwner.contact || "N/A"}
                              </p>
                              {notes.previousOwner.tin && (
                                <p>
                                  <strong>TIN NUMBER:</strong>{" "}
                                  {notes.previousOwner.tin}
                                </p>
                              )}
                              {notes.previousOwner.idType && (
                                <p>
                                  <strong>AINA YA KITAMBULISHO:</strong>{" "}
                                  {notes.previousOwner.idType}
                                </p>
                              )}
                              {notes.previousOwner.idNumber && (
                                <p>
                                  <strong>NAMBA ZA KITAMBULISHO:</strong>{" "}
                                  {notes.previousOwner.idNumber}
                                </p>
                              )}
                              {notes.previousOwner.address && (
                                <p>
                                  <strong>MAKAZI YAKE:</strong>{" "}
                                  {notes.previousOwner.address}
                                </p>
                              )}
                              {notes.previousOwner.occupation && (
                                <p>
                                  <strong>KAZI:</strong>{" "}
                                  {notes.previousOwner.occupation}
                                </p>
                              )}
                            </div>
                            {notes.previousOwnerPhoto && (
                              <div className="flex flex-col items-center">
                                <p className="font-semibold mb-2 text-sm text-center">
                                  PICHA YA MMLIKI WA AWALI
                                </p>
                                <div className="border-2 border-dashed border-gray-400 h-40 w-32 flex items-center justify-center bg-gray-50">
                                  <img
                                    src={notes.previousOwnerPhoto}
                                    alt="Previous Owner"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch (e) {
                    return null;
                  }
                })()}

              {/* Brought By Section (from notes) */}
              {contractData?.contract?.notes &&
                (() => {
                  try {
                    const notes =
                      typeof contractData.contract.notes === "string"
                        ? JSON.parse(contractData.contract.notes)
                        : contractData.contract.notes;

                    // Handle both string and object formats for broughtBy
                    const broughtBy = notes.broughtBy;
                    if (broughtBy) {
                      // Check if broughtBy is an object or string
                      const isObject =
                        typeof broughtBy === "object" && broughtBy !== null;

                      return (
                        <div className="border-t pt-4">
                          <p className="font-semibold mb-3 text-base">
                            AMBAYE AMELETWA/KAELEKEZWA KWA MR PIKIPIKI TRADING
                            NA
                          </p>
                          <div className="pl-4 text-sm">
                            {isObject ? (
                              <div className="space-y-2">
                                {broughtBy.name && (
                                  <p>
                                    <strong>JINA:</strong> {broughtBy.name}
                                  </p>
                                )}
                                {broughtBy.contact && (
                                  <p>
                                    <strong>MAWASILIANO:</strong>{" "}
                                    {broughtBy.contact}
                                  </p>
                                )}
                                {broughtBy.address && (
                                  <p>
                                    <strong>MAKAZI:</strong> {broughtBy.address}
                                  </p>
                                )}
                                {broughtBy.occupation && (
                                  <p>
                                    <strong>KAZI:</strong>{" "}
                                    {broughtBy.occupation}
                                  </p>
                                )}
                                {broughtBy.relationship && (
                                  <p>
                                    <strong>UHUSIANO:</strong>{" "}
                                    {broughtBy.relationship}
                                  </p>
                                )}
                                {broughtBy.idType && (
                                  <p>
                                    <strong>AINA YA KITAMBULISHO:</strong>{" "}
                                    {broughtBy.idType}
                                  </p>
                                )}
                                {broughtBy.idNumber && (
                                  <p>
                                    <strong>NAMBA ZA KITAMBULISHO:</strong>{" "}
                                    {broughtBy.idNumber}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p>
                                <strong>JINA:</strong> {String(broughtBy)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch (e) {
                    console.error("Error parsing broughtBy:", e);
                    return null;
                  }
                })()}

              {/* Price Information */}
              {contractData?.contract?.amount && (
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">TAARIFA ZA MALIPO</p>
                  <div className="pl-4 text-sm space-y-1">
                    <p>
                      <strong>Kiasi cha Mkataba:</strong>{" "}
                      {contractData.contract.amount.toLocaleString()}{" "}
                      {contractData.contract.currency || "TZS"}
                    </p>
                    {contractData?.contract?.notes &&
                      (() => {
                        try {
                          const notes =
                            typeof contractData.contract.notes === "string"
                              ? JSON.parse(contractData.contract.notes)
                              : contractData.contract.notes;

                          return (
                            <>
                              {notes.salePrice && (
                                <p>
                                  <strong>Bei ya Kuuza:</strong>{" "}
                                  {notes.salePrice.toLocaleString()} TZS
                                </p>
                              )}
                              {notes.amountPaid && (
                                <p>
                                  <strong>Kiasi Kilicholipwa:</strong>{" "}
                                  {notes.amountPaid.toLocaleString()} TZS
                                </p>
                              )}
                              {notes.remainingBalance && (
                                <p>
                                  <strong>Salio:</strong>{" "}
                                  {notes.remainingBalance.toLocaleString()} TZS
                                </p>
                              )}
                            </>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inspection Form (Printable) */}
      <form onSubmit={handleSubmit}>
        <div className="p-4 print:p-8">
          <div className="max-w-4xl mx-auto bg-white p-8 print:shadow-none">
            {/* Header */}
            <div className="text-center border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold mb-2">
                FOMU YA UKAGUZI WA PIKIPIKI KABLA YA KUSAFIRISHWA
              </h2>
            </div>

            {/* Basic Info - Only show for GIDIONI, not for RAMA */}
            {showGidioniSections && (
              <div className="grid gap-4 mb-6 border-b pb-4 grid-cols-3">
                <div>
                  <p>
                    <strong>Jina la Staff aliyekagua:</strong>{" "}
                    <input
                      type="text"
                      value={formData.staffName}
                      onChange={(e) =>
                        setFormData({ ...formData, staffName: e.target.value })
                      }
                      className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                      placeholder="Jina la staff"
                    />
                  </p>
                  <p className="mt-2">
                    <strong>Sahihi:</strong> ____________________
                  </p>
                  <p>
                    <strong>Tarehe:</strong> {formData.inspectionDate}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Jina la Fundi aliyekagua:</strong>{" "}
                    {canEditGidioniSections ? (
                      <input
                        type="text"
                        value={formData.mechanicName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mechanicName: e.target.value,
                          })
                        }
                        className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                        placeholder="Jina la fundi"
                      />
                    ) : (
                      <span className="ml-2">
                        {formData.mechanicName || "N/A"}
                      </span>
                    )}
                  </p>
                  <p className="mt-2">
                    <strong>Sahihi:</strong> ____________________
                  </p>
                  <p>
                    <strong>Tarehe:</strong> {formData.inspectionDate}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Tarehe ya Ukaguzi:</strong>{" "}
                    {formData.inspectionDate}
                  </p>
                  <p className="mt-2">
                    <strong>Jina la Pikipiki:</strong> {formData.motorcycleName}
                  </p>
                  <p>
                    <strong>Aina:</strong> {formData.motorcycleType}
                  </p>
                  <p>
                    <strong>Namba ya Engine:</strong>{" "}
                    {formData.motorcycleEngineNumber}
                  </p>
                  <p>
                    <strong>Namba ya Chassis:</strong>{" "}
                    {formData.motorcycleChassisNumber}
                  </p>
                  <p>
                    <strong>Jina la Mnunuzi:</strong>{" "}
                    {formData.customerName || "N/A"}
                  </p>
                  <p>
                    <strong>Simu:</strong> {formData.customerPhone || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* GIDIONI Inspection: Sections A, B, C */}
            {showGidioniSections && (
              <>
                {/* Section A: External Appearance */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">
                    A. MUONEKANO WA NJE
                  </h3>
                  <div className="space-y-1">
                    {renderQuestion(
                      "externalAppearance",
                      "q1",
                      "umekagua Mkasi sawa??",
                      1
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q2",
                      "umekagua Tairi zote salama??",
                      2
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q3",
                      "umekagua Brake mbele/nyuma??",
                      3
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q4",
                      "umekagua Haijapinda/gonga kifua??",
                      4
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q5",
                      "umekagua Rangi maeneo yaliyoharibika??",
                      5
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q6",
                      "umekagua Tank halina kutu??",
                      6
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q7",
                      "umekagua Shokapu mbele hazivuji??",
                      7
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q8",
                      "umekagua Shokapu nyuma sawa??",
                      8
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q9",
                      "umekagua Mudguard mbele sawa??",
                      9
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q10",
                      "umekagua Mikono clutch/brake sawa??",
                      10
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q11",
                      "umekagua Side cover zimefungwa??",
                      11
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q12",
                      "umekagua Chain box haigongi??",
                      12
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q13",
                      "umekagua Stendi zote sawa??",
                      13
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q14",
                      "umekagua Speed meter cable sawa??",
                      14
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q15",
                      "umekagua Imesafishwa??",
                      15
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q16",
                      "umekagua Funguo wafungua tank??",
                      16
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q17",
                      "umekagua Engine & chassis zinalingana??",
                      17
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q18",
                      "umekagua Limu haijapinda??",
                      18
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q19",
                      "umekagua Taili hazijatoboka??",
                      19
                    )}
                    {renderQuestion(
                      "externalAppearance",
                      "q20",
                      "umekagua Seat imefungwa vizuri??",
                      20
                    )}
                  </div>
                </div>

                {/* Section B: Electrical System */}
                <div className="mb-6 border-t pt-4">
                  <h3 className="text-xl font-bold mb-4">B. MFUMO WA UMEME</h3>
                  <div className="space-y-1">
                    {renderQuestion(
                      "electricalSystem",
                      "q21",
                      "umekagua Indicators zote zinafanya kazi??",
                      21
                    )}
                    {renderQuestion(
                      "electricalSystem",
                      "q22",
                      "umekagua Honi inafanya kazi??",
                      22
                    )}
                    {renderQuestion(
                      "electricalSystem",
                      "q23",
                      "umekagua Starter inafanya kazi??",
                      23
                    )}
                    {renderQuestion(
                      "electricalSystem",
                      "q24",
                      "umekagua Taa mbele/nyuma zinafanya kazi??",
                      24
                    )}
                    {renderQuestion(
                      "electricalSystem",
                      "q25",
                      "umekagua Switch kuwasha/kuzima inafanya kazi??",
                      25
                    )}
                    {renderQuestion(
                      "electricalSystem",
                      "q26",
                      "umekagua Nyingineyo:?",
                      26
                    )}
                  </div>
                </div>

                {/* Section C: Engine System */}
                <div className="mb-6 border-t pt-4">
                  <h3 className="text-xl font-bold mb-4">C. MFUMO WA ENGINE</h3>
                  <div className="space-y-1">
                    {renderQuestion(
                      "engineSystem",
                      "q27",
                      "umekagua Haitoi moshi??",
                      27
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q28",
                      "umekagua Timing chain hailii??",
                      28
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q29",
                      "umekagua Piston haigongi??",
                      29
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q30",
                      "umekagua Haina leakage??",
                      30
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q31",
                      "umekagua Shaft haijachomelewa??",
                      31
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q32",
                      "umekagua Kiki inafanya kazi??",
                      32
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q33",
                      "umekagua Haina miss??",
                      33
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q34",
                      "umekagua Mkono haigongi??",
                      34
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q35",
                      "umekagua Carburator sawa??",
                      35
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q36",
                      "umekagua Exhaust sawa??",
                      36
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q37",
                      "umekagua Clutch system sawa??",
                      37
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q38",
                      "umekagua Gear zote zinaingia??",
                      38
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q39",
                      "umekagua Gear 1-5 hazivumi??",
                      39
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q40",
                      "umekagua Exletor sawa??",
                      40
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q41",
                      "umekagua Tapeti hazigongi??",
                      41
                    )}
                    {renderQuestion(
                      "engineSystem",
                      "q42",
                      "umekagua Engine haina milio tofauti??",
                      42
                    )}
                  </div>
                </div>
              </>
            )}

            {/* RAMA Inspection: Section D Only */}
            {showRamaSection && (
              <div className="mb-6 border-t pt-4">
                {/* Section D: Seller Information */}
                <h3 className="text-xl font-bold mb-4">
                  D. TAARIFA ZA MUUZAJI
                </h3>
                {!canEditRamaSection && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Ukaguzi wa RAMA umekamilika.</strong> Taarifa hizi
                      zimekaguliwa na idara ya usajili.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>43. Namba ya simu ya muuzaji:</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="text"
                          value={formData.sellerPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sellerPhone: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Namba ya simu"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.sellerPhone || "N/A"}
                        </span>
                      )}
                    </p>
                    <div className="mt-2">
                      <strong>44. Picha ya passport?</strong>
                      {canEditRamaSection ? (
                        <div className="mt-2">
                          <ImageUploader
                            label=""
                            value={formData.sellerPassportImage}
                            onChange={(imageData) =>
                              setFormData({
                                ...formData,
                                sellerPassportImage: imageData,
                              })
                            }
                          />
                        </div>
                      ) : (
                        <div className="mt-2">
                          {formData.sellerPassportImage ? (
                            <img
                              src={formData.sellerPassportImage}
                              alt="Passport"
                              className="max-w-xs h-32 object-contain border border-gray-300 rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mt-2">
                      <strong>45. Kitambulisho?</strong>
                    </p>
                    <div className="ml-4 space-y-2">
                      <p>
                        <strong>Aina:</strong>{" "}
                        {canEditRamaSection ? (
                          <input
                            type="text"
                            value={formData.sellerIdType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sellerIdType: e.target.value,
                              })
                            }
                            className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                            placeholder="NIDA, Passport, nk"
                          />
                        ) : (
                          <span className="ml-2">
                            {formData.sellerIdType || "N/A"}
                          </span>
                        )}
                      </p>
                      <p>
                        <strong>Namba:</strong>{" "}
                        {canEditRamaSection ? (
                          <input
                            type="text"
                            value={formData.sellerIdNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sellerIdNumber: e.target.value,
                              })
                            }
                            className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                            placeholder="Namba ya kitambulisho"
                          />
                        ) : (
                          <span className="ml-2">
                            {formData.sellerIdNumber || "N/A"}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="mt-2">
                      <strong>46. Amepigiwa simu?</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="checkbox"
                          checked={formData.sellerPhoneCalled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sellerPhoneCalled: e.target.checked,
                            })
                          }
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.sellerPhoneCalled ? "✓ Ndiyo" : "Hapana"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>
                        47. Access ya account ya kuhamisha umiliki?
                      </strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="text"
                          value={formData.sellerAccountAccess}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sellerAccountAccess: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Account access"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.sellerAccountAccess || "N/A"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2">
                      <strong>48. Password ya account:</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="password"
                          value={formData.sellerAccountPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sellerAccountPassword: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Password"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.sellerAccountPassword ? "••••••••" : "N/A"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2">
                      <strong>49. Simu ya OTP:</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="text"
                          value={formData.sellerOtpPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sellerOtpPhone: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Namba ya simu ya OTP"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.sellerOtpPhone || "N/A"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2">
                      <strong>50. Imeletwa na nani?</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="text"
                          value={formData.broughtBy}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              broughtBy: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Jina"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.broughtBy || "N/A"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2">
                      <strong>51. Imetoka wapi?</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="text"
                          value={formData.originLocation}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              originLocation: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Eneo"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.originLocation || "N/A"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2">
                      <strong>52. Namba ya dalali:</strong>{" "}
                      {canEditRamaSection ? (
                        <input
                          type="text"
                          value={formData.brokerNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brokerNumber: e.target.value,
                            })
                          }
                          className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                          placeholder="Namba ya dalali"
                        />
                      ) : (
                        <span className="ml-2">
                          {formData.brokerNumber || "N/A"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="border-t pt-6 mt-6">
              <div
                className={`grid gap-8 ${
                  !showGidioniSections ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                {showGidioniSections && (
                  <div>
                    <p>
                      <strong>Jina la Fundi:</strong> {formData.mechanicName}
                    </p>
                    <p>
                      <strong>Sahihi:</strong> ____________________
                    </p>
                    <p>
                      <strong>Tarehe:</strong> {formData.inspectionDate}
                    </p>
                  </div>
                )}
                <div>
                  <p>
                    <strong>Jina la Staff aliyekagua:</strong>{" "}
                    {formData.staffName}
                  </p>
                  <p>
                    <strong>Sahihi:</strong> ____________________
                  </p>
                  <p>
                    <strong>Tarehe:</strong> {formData.inspectionDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Button for RAMA */}
            {user?.role === "registration" &&
              inspectionId &&
              formData.workflowStatus === "rama_pending" &&
              canEditRamaSection && (
                <div className="border-t pt-6 mt-6 print:hidden">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>Muhimu:</strong> Baada ya kujaza taarifa zote za
                      Sehemu D, bofya "Thibitisha Ukaguzi" ili ukaguzi uende kwa
                      GIDIONI kwa ajili ya ukaguzi wa Sehemu A, B, na C.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleVerify}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      <FiCheck className="inline mr-2" />
                      {loading ? "Inathibitisha..." : "Thibitisha Ukaguzi"}
                    </Button>
                  </div>
                </div>
              )}

            {/* Status Display for Completed RAMA Inspection */}
            {user?.role === "registration" &&
              inspectionId &&
              formData.workflowStatus === "rama_completed" && (
                <div className="border-t pt-6 mt-6 print:hidden">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>✓ Ukaguzi wa RAMA umekamilika!</strong> Ukaguzi
                      huu sasa unaweza kwenda kwa GIDIONI kwa ajili ya ukaguzi
                      wa Sehemu A, B, na C.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </form>

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
          input[type="radio"] {
            -webkit-appearance: checkbox;
            appearance: checkbox;
          }
        }
      `}</style>
    </div>
  );
};

export default InspectionForm;
