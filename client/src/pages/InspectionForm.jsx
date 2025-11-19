import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import { FiPrinter, FiSave, FiArrowLeft, FiCheck, FiX } from "react-icons/fi";

const InspectionForm = () => {
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get("id");
  const motorcycleId = searchParams.get("motorcycleId");
  const contractId = searchParams.get("contractId");

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
    overallResult: "",
    notes: "",
  });

  const [motorcycles, setMotorcycles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchData();
    if (inspectionId) {
      fetchInspectionData();
    }
  }, [inspectionId, motorcycleId, contractId]);

  const fetchData = async () => {
    try {
      const [bikesRes, customersRes] = await Promise.all([
        axios.get("/api/motorcycles"),
        axios.get("/api/customers"),
      ]);

      setMotorcycles(bikesRes.data || []);
      setCustomers(customersRes.data || []);

      if (motorcycleId) {
        const bike = bikesRes.data.find((m) => m.id === motorcycleId);
        if (bike) {
          setSelectedMotorcycle(bike);
          updateMotorcycleFields(bike);
        }
      }

      if (contractId) {
        const contractRes = await axios.get(`/api/contracts/${contractId}`);
        const contract = contractRes.data;
        if (contract.customerId) {
          const customer = customersRes.data.find(
            (c) => c.id === contract.customerId
          );
          if (customer) {
            setSelectedCustomer(customer);
            setFormData((prev) => ({
              ...prev,
              customerName: customer.fullName,
              customerPhone: customer.phone,
            }));
          }
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

      setFormData({
        ...formData,
        ...inspection,
        inspectionDate:
          inspection.inspectionDate || new Date().toISOString().split("T")[0],
        externalAppearance:
          inspection.externalAppearance || formData.externalAppearance,
        electricalSystem:
          inspection.electricalSystem || formData.electricalSystem,
        engineSystem: inspection.engineSystem || formData.engineSystem,
        motorcycleName: inspection.motorcycle?.brand || "",
        motorcycleType: inspection.motorcycle?.model || "",
        motorcycleEngineNumber: inspection.motorcycle?.engineNumber || "",
        motorcycleChassisNumber: inspection.motorcycle?.chassisNumber || "",
        customerName: inspection.customer?.name || "",
        customerPhone: inspection.customer?.phone || "",
      });
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
      const dataToSend = {
        ...formData,
        motorcycleId: selectedMotorcycle?.id,
        contractId: contractId || null,
        customerId: selectedCustomer?.id || null,
      };

      if (inspectionId) {
        await axios.put(`/api/inspections/${inspectionId}`, dataToSend);
        alert("Ukaguzi umehifadhiwa kwa mafanikio!");
      } else {
        await axios.post("/api/inspections", dataToSend);
        alert("Ukaguzi umeundwa kwa mafanikio!");
      }
    } catch (error) {
      console.error("Error saving inspection:", error);
      alert("Imeshindwa kuhifadhi ukaguzi. Tafadhali jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
            <a href="/contracts" className="text-gray-600 hover:text-gray-900">
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

            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 border-b pb-4">
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
                  <input
                    type="text"
                    value={formData.mechanicName}
                    onChange={(e) =>
                      setFormData({ ...formData, mechanicName: e.target.value })
                    }
                    className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                    placeholder="Jina la fundi"
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
                  <strong>Tarehe ya Ukaguzi:</strong> {formData.inspectionDate}
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
                  <strong>Jina la Mnunuzi:</strong> {formData.customerName}
                </p>
                <p>
                  <strong>Simu:</strong> {formData.customerPhone}
                </p>
              </div>
            </div>

            {/* Section A: External Appearance */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">A. MUONEKANO WA NJE</h3>
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

            {/* Section D: Seller Information */}
            <div className="mb-6 border-t pt-4">
              <h3 className="text-xl font-bold mb-4">D. TAARIFA ZA MUUZAJI</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>43. Namba ya simu ya muuzaji:</strong>{" "}
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
                  </p>
                  <p className="mt-2">
                    <strong>44. Picha ya passport?</strong>{" "}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormData({
                              ...formData,
                              sellerPassportImage: event.target.result,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </p>
                  <p className="mt-2">
                    <strong>45. Kitambulisho?</strong>{" "}
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
                      placeholder="Aina ya kitambulisho"
                    />
                  </p>
                  <p className="mt-2">
                    <strong>46. Amepigiwa simu?</strong>{" "}
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
                  </p>
                </div>
                <div>
                  <p>
                    <strong>47. Access ya account ya kuhamisha umiliki?</strong>{" "}
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
                  </p>
                  <p className="mt-2">
                    <strong>48. Password ya account:</strong>{" "}
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
                  </p>
                  <p className="mt-2">
                    <strong>49. Simu ya OTP:</strong>{" "}
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
                  </p>
                  <p className="mt-2">
                    <strong>50. Imeletwa na nani?</strong>{" "}
                    <input
                      type="text"
                      value={formData.broughtBy}
                      onChange={(e) =>
                        setFormData({ ...formData, broughtBy: e.target.value })
                      }
                      className="inline-block w-48 px-2 py-1 border border-gray-300 rounded"
                      placeholder="Jina"
                    />
                  </p>
                  <p className="mt-2">
                    <strong>51. Imetoka wapi?</strong>{" "}
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
                  </p>
                  <p className="mt-2">
                    <strong>52. Namba ya dalali:</strong>{" "}
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
                  </p>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-2 gap-8">
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
