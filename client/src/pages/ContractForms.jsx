import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import ImageUploader from "../components/ImageUploader";
import ValidatedInput from "../components/ValidatedInput";
import { FiPrinter, FiSave, FiArrowLeft } from "react-icons/fi";

const SAVE_REQUEST_TIMEOUT = 60000; // allow slower networks to finish multi-step saves
const MAX_IMAGE_DIMENSION = 1024;
const IMAGE_COMPRESSION_QUALITY = 0.65;

const normalizeValue = (value) => (value || "").toString().trim().toLowerCase();

const ContractForms = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const contractType = searchParams.get("type") || "sale"; // "sale" or "purchase"
  const contractId = searchParams.get("contractId");
  const motorcycleId = searchParams.get("motorcycleId");

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Refs for scrolling to invalid fields
  const partyNameRef = useRef(null);
  const partyPhoneRef = useRef(null);
  const partyAddressRef = useRef(null);
  const motorcycleTypeRef = useRef(null);
  const motorcycleYearRef = useRef(null);
  const motorcycleEngineRef = useRef(null);
  const motorcycleChassisRef = useRef(null);
  const motorcycleColorRef = useRef(null);

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
    partyOccupation: "",

    // Previous Owner Info (for purchase contracts)
    previousOwnerName: "",
    previousOwnerContact: "",
    previousOwnerTIN: "",
    previousOwnerIdType: "",
    previousOwnerIdNumber: "",
    previousOwnerAddress: "",
    previousOwnerOccupation: "",
    previousOwnerPhoto: null,

    // Person who brought/referred
    broughtByName: "",
    broughtByContact: "",
    broughtByAddress: "",
    broughtByOccupation: "",
    broughtByRelationship: "",
    broughtByIdType: "",
    broughtByIdNumber: "",
    broughtByPhoto: null,

    // Motorcycle info
    motorcycleRegistration: "",
    motorcycleType: "",
    motorcycleYear: "",
    motorcycleEngineNumber: "",
    motorcycleChassisNumber: "",
    motorcycleColor: "",

    // Sale terms
    salePrice: "",
    amountPaid: "",
    remainingBalance: "",
    balanceReason: "",

    // Witnesses
    sellerWitness1Name: "",
    sellerWitness1Phone: "",
    sellerWitness1Address: "",
    sellerWitness1IdType: "",
    sellerWitness1IdNumber: "",
    sellerWitness1Occupation: "",
    sellerWitness1Signature: "",

    sellerWitness2Name: "",
    sellerWitness2Phone: "",
    sellerWitness2Address: "",
    sellerWitness2IdType: "",
    sellerWitness2IdNumber: "",
    sellerWitness2Occupation: "",
    sellerWitness2Signature: "",

    buyerWitnessName: "",
    buyerWitnessPhone: "",
    buyerWitnessAddress: "",
    buyerWitnessSignature: "",

    // Legal professional
    lawyerName: "",
    lawyerContact: "",
    lawyerSignature: "",
    witnessDate: "",
  });

  const [motorcycles, setMotorcycles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseContracts, setPurchaseContracts] = useState([]);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedPurchaseContract, setSelectedPurchaseContract] =
    useState(null);

  useEffect(() => {
    fetchData();
    if (contractId) {
      fetchContractData();
    }
  }, [contractId, motorcycleId]);

  const fetchData = async () => {
    try {
      // Don't fetch all purchase contracts upfront - fetch only when needed
      // This prevents timeout issues when there are many contracts
      const [bikesRes, customersRes, suppliersRes] = await Promise.all([
        axios.get("/api/motorcycles", { timeout: 30000 }),
        axios.get("/api/customers", { timeout: 30000 }),
        axios.get("/api/suppliers", { timeout: 30000 }),
      ]);

      setMotorcycles(bikesRes.data || []);
      setCustomers(customersRes.data || []);
      setSuppliers(suppliersRes.data || []);
      // Don't fetch purchase contracts here - fetch only when motorcycle is selected
      setPurchaseContracts([]);

      if (motorcycleId) {
        const bike = bikesRes.data.find((m) => m.id === motorcycleId);
        if (bike) {
          setSelectedMotorcycle(bike);
          updateMotorcycleFields(bike);
          // Auto-fill from motorcycle if it's in stock
          if (contractType === "sale" && bike.status === "in_stock") {
            await loadMotorcycleData(bike);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.code === "ECONNABORTED") {
        alert("Ombi limechelewa. Tafadhali jaribu tena.");
      }
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
      // Auto-fill selling price for sale contracts
      salePrice:
        contractType === "sale" && motorcycle.sellingPrice
          ? motorcycle.sellingPrice.toString()
          : prev.salePrice,
    }));
  };

  // Load purchase contract data and auto-fill previous owner info
  const loadMotorcycleData = async (motorcycle) => {
    try {
      console.log(
        "🔍 Loading motorcycle data for:",
        motorcycle.id,
        motorcycle.chassisNumber
      );

      // Find purchase contract for this motorcycle
      let purchaseContract = purchaseContracts.find(
        (c) => c.motorcycleId === motorcycle.id && c.type === "purchase"
      );

      console.log(
        "📋 Purchase contract from cache:",
        purchaseContract ? purchaseContract.contractNumber : "Not found"
      );

      // If not found in cached contracts, try fetching directly by motorcycleId
      if (!purchaseContract) {
        try {
          console.log(
            "🔎 Fetching purchase contract from API by motorcycleId..."
          );
          const contractsRes = await axios.get(
            `/api/contracts?type=purchase&motorcycleId=${motorcycle.id}`
          );
          const contracts = contractsRes.data || [];
          console.log("📦 Contracts found by motorcycleId:", contracts.length);
          purchaseContract = contracts.find(
            (c) => c.motorcycleId === motorcycle.id
          );
          if (purchaseContract) {
            console.log(
              "✅ Found purchase contract:",
              purchaseContract.contractNumber
            );
            setPurchaseContracts((prev) => [...prev, purchaseContract]);
          }
        } catch (e) {
          console.error(
            "❌ Could not fetch purchase contract by motorcycleId:",
            e
          );
        }
      }

      // If still not found, try to find by matching chassis/engine number using optimized search endpoint
      // This handles cases where contract was created before motorcycle was linked
      if (!purchaseContract) {
        try {
          console.log(
            "🔎 Trying to find purchase contract by chassis/engine number..."
          );
          // Use optimized search endpoint instead of fetching all contracts
          const searchRes = await axios.get(
            `/api/contracts/search/by-motorcycle`,
            {
              params: {
                chassisNumber: motorcycle.chassisNumber,
                engineNumber: motorcycle.engineNumber,
                type: "purchase",
              },
              timeout: 30000, // 30 seconds should be enough for a single search
            }
          );
          purchaseContract = searchRes.data || null;
          console.log(
            purchaseContract
              ? `✅ Found purchase contract: ${purchaseContract.contractNumber}`
              : "⚠️ No purchase contract found by chassis/engine number"
          );

          if (purchaseContract) {
            // Update contract with motorcycleId if it doesn't have it
            if (!purchaseContract.motorcycleId) {
              console.log("🔗 Linking contract to motorcycle...");
              try {
                await axios.put(`/api/contracts/${purchaseContract.id}`, {
                  motorcycleId: motorcycle.id,
                });
                purchaseContract.motorcycleId = motorcycle.id;
                console.log("✅ Contract linked to motorcycle successfully");
              } catch (e) {
                console.warn("⚠️ Could not link contract to motorcycle:", e);
              }
            }
            // Cache the contract for future use
            setPurchaseContracts((prev) => {
              if (!prev.find((c) => c.id === purchaseContract.id)) {
                return [...prev, purchaseContract];
              }
              return prev;
            });
          } else {
            console.log(
              "⚠️ No purchase contract found even after searching by chassis/engine number"
            );
            console.log(
              "💡 This motorcycle might not have a purchase contract yet"
            );
          }
        } catch (e) {
          console.error("❌ Could not search purchase contracts:", e);
        }
      }

      if (purchaseContract) {
        setSelectedPurchaseContract(purchaseContract);
        console.log("📝 Purchase contract notes:", purchaseContract.notes);

        // Parse notes to get previous owner info
        let notesData = {};
        try {
          notesData =
            typeof purchaseContract.notes === "string"
              ? JSON.parse(purchaseContract.notes)
              : purchaseContract.notes || {};
          console.log("📄 Parsed notes data:", notesData);
        } catch (e) {
          console.warn("⚠️ Could not parse contract notes:", e);
          console.log("Raw notes:", purchaseContract.notes);
        }

        const previousOwner = notesData.previousOwner || {};
        const broughtBy = notesData.broughtBy || {};

        console.log("👤 Previous owner data:", previousOwner);
        console.log("🚗 Brought by data:", broughtBy);

        // Auto-fill previous owner info
        setFormData((prev) => ({
          ...prev,
          previousOwnerName: previousOwner.name || "",
          previousOwnerContact: previousOwner.contact || "",
          previousOwnerTIN: previousOwner.tin || "",
          previousOwnerIdType: previousOwner.idType || "",
          previousOwnerIdNumber: previousOwner.idNumber || "",
          previousOwnerAddress: previousOwner.address || "",
          previousOwnerOccupation: previousOwner.occupation || "",
          previousOwnerPhoto: previousOwner.photo || null,
          broughtByName: broughtBy.name || "",
          broughtByContact: broughtBy.contact || "",
          broughtByAddress: broughtBy.address || "",
          broughtByOccupation: broughtBy.occupation || "",
          broughtByRelationship: broughtBy.relationship || "",
          broughtByIdType: broughtBy.idType || "",
          broughtByIdNumber: broughtBy.idNumber || "",
          broughtByPhoto: broughtBy.photo || null,
        }));

        console.log(
          "✅ Auto-filled form data with previous owner and broughtBy info"
        );

        // Show success message if data was filled
        if (previousOwner.name || broughtBy.name) {
          console.log(
            "✅ Taarifa za mmiliki wa awali na mtu aliyeleta zimejaza kiotomatiki"
          );
        } else {
          console.warn(
            "⚠️ Purchase contract ilipatikana lakini haina taarifa za mmiliki wa awali au mtu aliyeleta"
          );
        }
      } else {
        console.log(
          "⚠️ No purchase contract found. Taarifa za mmiliki wa awali hazitajijaza kiotomatiki."
        );
        // Show user-friendly message
        if (contractType === "sale") {
          console.warn(
            "ℹ️ Pikipiki hii haina mkataba wa kununua ulio-link. Taarifa za mmiliki wa awali hazitajijaza kiotomatiki."
          );
        }
      }
    } catch (error) {
      console.error("❌ Error loading motorcycle purchase data:", error);
    }
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

  const handleMotorcycleChange = async (motorcycleId) => {
    const motorcycle = motorcycles.find((m) => m.id === motorcycleId);
    if (motorcycle) {
      setSelectedMotorcycle(motorcycle);
      // Update motorcycle fields first
      updateMotorcycleFields(motorcycle);

      // For sale contracts, load purchase contract data if motorcycle is in stock
      // This will auto-fill previous owner and broughtBy info
      if (contractType === "sale" && motorcycle.status === "in_stock") {
        await loadMotorcycleData(motorcycle);
      }
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
    try {
      setLoading(true);
      const axiosConfig = { timeout: SAVE_REQUEST_TIMEOUT };

      // Check if user is authenticated
      if (!user) {
        alert("Huna ruhusa. Tafadhali ingia tena.");
        logout();
        navigate("/login");
        return;
      }

      // Check if token exists
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        alert("Token haipatikani. Tafadhali ingia tena.");
        logout();
        navigate("/login");
        return;
      }

      // Validate required fields
      const errors = {};
      const missingFields = [];

      // Check party fields
      if (!formData.partyName) {
        errors.partyName = true;
        missingFields.push({
          field: "partyName",
          label: "Jina la Mnunuzi/Muuzaji",
        });
      }
      if (!formData.partyPhone) {
        errors.partyPhone = true;
        missingFields.push({
          field: "partyPhone",
          label: "Simu ya Mnunuzi/Muuzaji",
        });
      }
      if (!formData.partyAddress) {
        errors.partyAddress = true;
        missingFields.push({
          field: "partyAddress",
          label: "Makazi ya Mnunuzi/Muuzaji",
        });
      }

      if (missingFields.length > 0) {
        setValidationErrors(errors);

        // Scroll to first missing field
        const firstMissingField = missingFields[0].field;
        if (fieldRefs[firstMissingField]?.current) {
          fieldRefs[firstMissingField].current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          fieldRefs[firstMissingField].current.focus();
        }

        alert(
          "❌ TAARIFA ZA MTEJA/MNUNUZI ZIMEKOSEKANA!\n\n" +
            "Tafadhali jaza:\n" +
            missingFields.map((f) => `• ${f.label}`).join("\n")
        );
        setLoading(false);
        return;
      }

      // Check motorcycle fields
      const motorcycleErrors = {};
      const missingMotorcycleFields = [];

      if (!formData.motorcycleType) {
        motorcycleErrors.motorcycleType = true;
        missingMotorcycleFields.push({
          field: "motorcycleType",
          label: "Aina ya Pikipiki (Brand & Model)",
        });
      }
      if (!formData.motorcycleYear) {
        motorcycleErrors.motorcycleYear = true;
        missingMotorcycleFields.push({
          field: "motorcycleYear",
          label: "Mwaka wa Uzalishaji",
        });
      }
      if (!formData.motorcycleEngineNumber) {
        motorcycleErrors.motorcycleEngineNumber = true;
        missingMotorcycleFields.push({
          field: "motorcycleEngineNumber",
          label: "Namba ya Engine",
        });
      }
      if (!formData.motorcycleChassisNumber) {
        motorcycleErrors.motorcycleChassisNumber = true;
        missingMotorcycleFields.push({
          field: "motorcycleChassisNumber",
          label: "Namba ya Chassis",
        });
      }
      if (!formData.motorcycleColor) {
        motorcycleErrors.motorcycleColor = true;
        missingMotorcycleFields.push({
          field: "motorcycleColor",
          label: "Rangi ya Pikipiki",
        });
      }

      if (missingMotorcycleFields.length > 0) {
        setValidationErrors({ ...errors, ...motorcycleErrors });

        // Scroll to first missing motorcycle field
        const firstMissingField = missingMotorcycleFields[0].field;
        if (fieldRefs[firstMissingField]?.current) {
          fieldRefs[firstMissingField].current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          fieldRefs[firstMissingField].current.focus();
        }

        alert(
          "❌ TAARIFA ZA PIKIPIKI ZIMEKOSEKANA!\n\n" +
            "Tafadhali jaza:\n" +
            missingMotorcycleFields.map((f) => `• ${f.label}`).join("\n")
        );
        setLoading(false);
        return;
      }

      // Clear validation errors if all fields are filled
      setValidationErrors({});

      // Create or reuse customer/supplier first
      let partyId = selectedParty?.id || selectedParty?._id;
      let supplierId =
        contractType === "sale"
          ? selectedMotorcycle?.supplierId ||
            selectedMotorcycle?.supplier?.id ||
            selectedParty?.supplierId ||
            null
          : partyId;

      const refreshCustomers = async () => {
        const latestCustomers = await axios.get("/api/customers", axiosConfig);
        setCustomers(latestCustomers.data || []);
        return latestCustomers.data || [];
      };

      const refreshSuppliers = async () => {
        const latestSuppliers = await axios.get("/api/suppliers", axiosConfig);
        setSuppliers(latestSuppliers.data || []);
        return latestSuppliers.data || [];
      };

      if (!partyId) {
        if (contractType === "sale") {
          const existingCustomer = findMatchingCustomer(customers, formData);
          if (existingCustomer) {
            partyId = existingCustomer.id || existingCustomer._id;
            setSelectedParty(existingCustomer);
          } else {
            try {
              const customerRes = await axios.post(
                "/api/customers",
                {
                  fullName: formData.partyName,
                  phone: formData.partyPhone,
                  address: formData.partyAddress,
                  taxId: formData.partyTIN,
                  idType: formData.partyIdType,
                  idNumber: formData.partyIdNumber,
                },
                axiosConfig
              );
              partyId = customerRes.data.id || customerRes.data._id;
              setCustomers((prev) => [customerRes.data, ...prev]);
              setSelectedParty(customerRes.data);
            } catch (error) {
              const duplicateId =
                error.response?.status === 400 &&
                (error.response?.data?.error || "")
                  .toLowerCase()
                  .includes("id number already exists");
              if (duplicateId) {
                const latest = await refreshCustomers();
                const matching = findMatchingCustomer(latest, formData);
                if (matching) {
                  partyId = matching.id || matching._id;
                  setSelectedParty(matching);
                } else {
                  throw error;
                }
              } else {
                throw error;
              }
            }
          }
        } else {
          const existingSupplier = findMatchingSupplier(suppliers, formData);
          if (existingSupplier) {
            partyId = existingSupplier.id || existingSupplier._id;
            supplierId = partyId;
            setSelectedParty(existingSupplier);
          } else {
            try {
              const supplierRes = await axios.post(
                "/api/suppliers",
                {
                  name: formData.partyName,
                  phone: formData.partyPhone,
                  address: formData.partyAddress,
                  taxId: formData.partyTIN,
                },
                axiosConfig
              );
              partyId = supplierRes.data.id || supplierRes.data._id;
              supplierId = partyId;
              setSuppliers((prev) => [supplierRes.data, ...prev]);
              setSelectedParty(supplierRes.data);
            } catch (error) {
              const duplicateSupplier =
                error.response?.status === 400 &&
                (error.response?.data?.error || "")
                  .toLowerCase()
                  .includes("already exists");
              if (duplicateSupplier) {
                const latest = await refreshSuppliers();
                const matching = findMatchingSupplier(latest, formData);
                if (matching) {
                  partyId = matching.id || matching._id;
                  supplierId = partyId;
                  setSelectedParty(matching);
                } else {
                  throw error;
                }
              } else {
                throw error;
              }
            }
          }
        }
      }

      if (contractType === "sale" && !supplierId) {
        let suppliersList = suppliers;
        if (suppliersList.length === 0) {
          const suppliersRes = await axios.get("/api/suppliers", axiosConfig);
          suppliersList = suppliersRes.data || [];
        }

        if (suppliersList.length > 0) {
          supplierId =
            suppliersList[0].id ||
            suppliersList[0]._id ||
            suppliersList[0].supplierId ||
            null;
        } else {
          const defaultSupplierRes = await axios.post(
            "/api/suppliers",
            {
              name: "Internal Stock",
              company: "MR PIKIPIKI TRADING",
              phone: "0744882955",
              address: "UBUNGO RIVERSIDE",
              city: "Dar es Salaam",
              country: "Tanzania",
              taxId: "54888667",
              isActive: true,
              notes: "Default supplier for motorcycles in stock",
            },
            axiosConfig
          );
          supplierId =
            defaultSupplierRes.data.id || defaultSupplierRes.data._id;
        }
      }

      // Create or reuse motorcycle
      let motorcycleId =
        selectedMotorcycle?.id || selectedMotorcycle?._id || null;

      if (!motorcycleId) {
        const brand =
          formData.motorcycleType.trim().split(" ")[0] ||
          formData.motorcycleType;
        const model = formData.motorcycleType
          .trim()
          .split(" ")
          .slice(1)
          .join(" ");
        const parsedYear = parseInt(formData.motorcycleYear, 10);

        const motorcycleRes = await axios.post(
          "/api/motorcycles",
          {
            brand,
            model,
            year: Number.isNaN(parsedYear) ? null : parsedYear,
            engineNumber: formData.motorcycleEngineNumber,
            chassisNumber: formData.motorcycleChassisNumber,
            color: formData.motorcycleColor,
            registrationNumber: formData.motorcycleRegistration,
            purchasePrice: formData.salePrice || 0,
            sellingPrice: formData.salePrice || 0,
            supplierId,
            customerId: contractType === "sale" ? partyId : null,
            purchaseDate: new Date().toISOString().split("T")[0],
            status: "in_stock",
          },
          axiosConfig
        );
        motorcycleId = motorcycleRes.data.id || motorcycleRes.data._id;
      }

      // Create contract with all data
      await axios.post(
        "/api/contracts",
        {
          type: contractType,
          motorcycleId,
          partyId,
          partyModel: contractType === "sale" ? "Customer" : "Supplier",
          amount: parseFloat(formData.salePrice) || 0,
          currency: "TZS",
          date: new Date().toISOString().split("T")[0],
          effectiveDate: new Date().toISOString().split("T")[0],
          paymentMethod: "cash",
          status: "draft",
          // Store additional contract data in notes/internalNotes as JSON
          notes: JSON.stringify({
            previousOwner:
              contractType === "purchase"
                ? {
                    name: formData.previousOwnerName,
                    contact: formData.previousOwnerContact,
                    tin: formData.previousOwnerTIN,
                    idType: formData.previousOwnerIdType,
                    idNumber: formData.previousOwnerIdNumber,
                    address: formData.previousOwnerAddress,
                    occupation: formData.previousOwnerOccupation,
                    photo: formData.previousOwnerPhoto,
                  }
                : null,
            broughtBy:
              contractType === "purchase"
                ? {
                    name: formData.broughtByName,
                    contact: formData.broughtByContact,
                    address: formData.broughtByAddress,
                    occupation: formData.broughtByOccupation,
                    relationship: formData.broughtByRelationship,
                    idType: formData.broughtByIdType,
                    idNumber: formData.broughtByIdNumber,
                    photo: formData.broughtByPhoto,
                  }
                : null,
            saleTerms: {
              salePrice: formData.salePrice,
              amountPaid: formData.amountPaid,
              remainingBalance: formData.remainingBalance,
              balanceReason: formData.balanceReason,
            },
            witnesses: {
              sellerWitness1: {
                name: formData.sellerWitness1Name,
                phone: formData.sellerWitness1Phone,
                address: formData.sellerWitness1Address,
                idType: formData.sellerWitness1IdType,
                idNumber: formData.sellerWitness1IdNumber,
                occupation: formData.sellerWitness1Occupation,
              },
              sellerWitness2: {
                name: formData.sellerWitness2Name,
                phone: formData.sellerWitness2Phone,
                address: formData.sellerWitness2Address,
                idType: formData.sellerWitness2IdType,
                idNumber: formData.sellerWitness2IdNumber,
                occupation: formData.sellerWitness2Occupation,
              },
              buyerWitness: {
                name: formData.buyerWitnessName,
                phone: formData.buyerWitnessPhone,
                address: formData.buyerWitnessAddress,
              },
            },
            lawyer: {
              name: formData.lawyerName,
              contact: formData.lawyerContact,
            },
            partyPhoto: formData.partyPhoto,
          }),
        },
        axiosConfig
      );

      alert(
        "Mkataba umeundwa kwa mafanikio! Customer/Supplier na Pikipiki zimeundwa kwenye database."
      );
      // Optionally redirect to contracts page
      window.location.href = "/contracts";
    } catch (error) {
      console.error("Error saving contract:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        const errorMsg = error.response?.data?.error || "Ruhusa imeisha";
        if (
          errorMsg.includes("Token expired") ||
          errorMsg.includes("expired")
        ) {
          alert("Token imeisha. Tafadhali ingia tena.");
        } else {
          alert("Ruhusa imeisha. Tafadhali ingia tena.");
        }
        logout();
        navigate("/login");
        return;
      }

      // Handle database connection errors
      if (error.response?.status === 503) {
        alert(
          "Kuna tatizo la muunganisho wa database. Tafadhali jaribu tena baada ya muda mfupi."
        );
        setLoading(false);
        return;
      }

      // Handle network errors
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        alert("Ombi limechelewa. Tafadhali jaribu tena.");
        setLoading(false);
        return;
      }

      // Handle other errors (including 500)
      const errorDetails =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      const errorMessage =
        error.response?.data?.error || "Imeshindwa kuunda mkataba";

      console.error("Full error response:", error.response?.data);
      console.error("Error details:", errorDetails);

      // Show detailed and helpful error message
      let friendlyMessage = "❌ IMESHINDWA KUUNDA MKATABA!\n\n";

      if (errorDetails && typeof errorDetails === "string") {
        if (errorDetails.includes("[object Object]")) {
          friendlyMessage += "Kuna taarifa zisizo sahihi. Tafadhali angalia:\n";
          friendlyMessage += "• Jina la Mteja/Muuzaji limejazwa?\n";
          friendlyMessage += "• Simu imejazwa?\n";
          friendlyMessage += "• Makazi yamejazwa?\n";
          friendlyMessage += "• Namba ya Engine na Chassis zimejazwa?\n\n";
          friendlyMessage += "Hakikisha umejaza taarifa zote kwa usahihi.";
        } else {
          friendlyMessage += errorDetails;
        }
      } else {
        friendlyMessage += errorMessage;
      }

      alert(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sw-TZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const findMatchingCustomer = (customers, formData) => {
    const idNumber = normalizeValue(formData.partyIdNumber);
    const phone = normalizeValue(formData.partyPhone);
    return (
      customers.find((customer) => {
        const customerId = normalizeValue(customer.idNumber);
        const customerPhone = normalizeValue(customer.phone);
        if (idNumber && customerId && idNumber === customerId) {
          return true;
        }
        if (phone && customerPhone && phone === customerPhone) {
          return true;
        }
        return false;
      }) || null
    );
  };

  const findMatchingSupplier = (suppliers, formData) => {
    const taxId = normalizeValue(formData.partyTIN);
    const phone = normalizeValue(formData.partyPhone);
    const name = normalizeValue(formData.partyName);
    return (
      suppliers.find((supplier) => {
        const supplierTax = normalizeValue(supplier.taxId);
        const supplierPhone = normalizeValue(supplier.phone);
        const supplierName = normalizeValue(supplier.name);
        if (taxId && supplierTax && taxId === supplierTax) {
          return true;
        }
        if (phone && supplierPhone && phone === supplierPhone) {
          return true;
        }
        if (name && supplierName && name === supplierName) {
          return true;
        }
        return false;
      }) || null
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

      {/* Form Input Section (Hidden when printing) */}
      <div className="p-4 print:hidden">
        <Card className="mb-4">
          <h3 className="text-lg font-semibold mb-4">
            Jaza Taarifa za Mkataba
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Jaza taarifa zote hapa chini. Customer/Supplier na Pikipiki
            zitaundwa kwenye database wakati wa kuunda mkataba.
          </p>

          {/* Party Information (Customer/Supplier) */}
          <div className="border-b pb-4 mb-4">
            <h4 className="font-semibold mb-3">
              Taarifa za {contractType === "sale" ? "Mnunuzi" : "Muuzaji"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                ref={partyNameRef}
                label="Jina"
                name="partyName"
                value={formData.partyName}
                onChange={(e) =>
                  setFormData({ ...formData, partyName: e.target.value })
                }
                error={validationErrors.partyName}
                errorMessage="Jaza jina la mnunuzi/muuzaji"
                required
                placeholder="Mfano: John Doe"
              />
              <Input
                label="TIN Number"
                value={formData.partyTIN}
                onChange={(e) =>
                  setFormData({ ...formData, partyTIN: e.target.value })
                }
              />
              <ValidatedInput
                ref={partyPhoneRef}
                label="Namba ya Simu"
                name="partyPhone"
                value={formData.partyPhone}
                onChange={(e) =>
                  setFormData({ ...formData, partyPhone: e.target.value })
                }
                error={validationErrors.partyPhone}
                errorMessage="Jaza namba ya simu"
                required
                placeholder="Mfano: 0712345678"
              />
              <ValidatedInput
                ref={partyAddressRef}
                label="Makazi"
                name="partyAddress"
                value={formData.partyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, partyAddress: e.target.value })
                }
                error={validationErrors.partyAddress}
                errorMessage="Jaza makazi"
                required
                placeholder="Mfano: Kinondoni, DSM"
              />
              <Select
                label="Aina ya Kitambulisho"
                value={formData.partyIdType}
                onChange={(e) =>
                  setFormData({ ...formData, partyIdType: e.target.value })
                }
                options={[
                  { value: "", label: "Chagua..." },
                  { value: "NIDA", label: "NIDA" },
                  { value: "Passport", label: "Passport" },
                  { value: "Driving License", label: "Driving License" },
                ]}
              />
              <Input
                label="Namba za Kitambulisho"
                value={formData.partyIdNumber}
                onChange={(e) =>
                  setFormData({ ...formData, partyIdNumber: e.target.value })
                }
              />
              <Input
                label="Kazi"
                value={formData.partyOccupation}
                onChange={(e) =>
                  setFormData({ ...formData, partyOccupation: e.target.value })
                }
              />
              <div>
                <ImageUploader
                  label={`Picha ya ${
                    contractType === "sale" ? "Mnunuzi" : "Muuzaji"
                  }`}
                  value={formData.partyPhoto}
                  onChange={(imageData) =>
                    setFormData({ ...formData, partyPhoto: imageData })
                  }
                />
              </div>
            </div>
          </div>

          {/* Motorcycle Selection (for Sale Contracts) */}
          {contractType === "sale" && (
            <div className="border-b pb-4 mb-4">
              <h4 className="font-semibold mb-3">
                Chagua Pikipiki kutoka Stock
              </h4>
              <div className="mb-4">
                <Select
                  label="Chagua Pikipiki"
                  value={selectedMotorcycle?.id || ""}
                  onChange={(e) => handleMotorcycleChange(e.target.value)}
                  options={[
                    { value: "", label: "Chagua pikipiki kutoka stock..." },
                    ...motorcycles
                      .filter((m) => m.status === "in_stock")
                      .map((m) => ({
                        value: m.id,
                        label: `${m.brand} ${m.model} - ${m.chassisNumber} (Stock)`,
                      })),
                  ]}
                />
                {selectedPurchaseContract && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>✓</strong> Taarifa za mmiliki wa awali zimejaza
                      kiotomatiki kutoka kwenye mkataba wa kununua:{" "}
                      <strong>{selectedPurchaseContract.contractNumber}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Motorcycle Information */}
          <div className="border-b pb-4 mb-4">
            <h4 className="font-semibold mb-3">Taarifa za Pikipiki</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Namba ya Usajili"
                value={formData.motorcycleRegistration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    motorcycleRegistration: e.target.value,
                  })
                }
                disabled={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                }
                className={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                    ? "bg-gray-100"
                    : ""
                }
              />
              <ValidatedInput
                ref={motorcycleTypeRef}
                label="Aina (Brand/Model)"
                name="motorcycleType"
                value={formData.motorcycleType}
                onChange={(e) =>
                  setFormData({ ...formData, motorcycleType: e.target.value })
                }
                error={validationErrors.motorcycleType}
                errorMessage="Jaza aina ya pikipiki"
                required
                disabled={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                }
                className={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                    ? "bg-gray-100"
                    : ""
                }
                placeholder="Mfano: Honda CB150"
              />
              <ValidatedInput
                ref={motorcycleYearRef}
                label="Mwaka"
                name="motorcycleYear"
                type="number"
                value={formData.motorcycleYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    motorcycleYear: e.target.value,
                  })
                }
                error={validationErrors.motorcycleYear}
                errorMessage="Jaza mwaka wa uzalishaji"
                required
                disabled={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                }
                className={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                    ? "bg-gray-100"
                    : ""
                }
                placeholder="Mfano: 2020"
              />
              <ValidatedInput
                ref={motorcycleEngineRef}
                label="Engine Number"
                name="motorcycleEngineNumber"
                value={formData.motorcycleEngineNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    motorcycleEngineNumber: e.target.value,
                  })
                }
                error={validationErrors.motorcycleEngineNumber}
                errorMessage="Jaza namba ya engine"
                required
                disabled={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                }
                className={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                    ? "bg-gray-100"
                    : ""
                }
                placeholder="Mfano: CB150-12345"
              />
              <ValidatedInput
                ref={motorcycleChassisRef}
                label="Chassis Number"
                name="motorcycleChassisNumber"
                value={formData.motorcycleChassisNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    motorcycleChassisNumber: e.target.value,
                  })
                }
                error={validationErrors.motorcycleChassisNumber}
                errorMessage="Jaza namba ya chassis"
                required
                disabled={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                }
                className={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                    ? "bg-gray-100"
                    : ""
                }
                placeholder="Mfano: CH-12345"
              />
              <ValidatedInput
                ref={motorcycleColorRef}
                label="Rangi"
                name="motorcycleColor"
                value={formData.motorcycleColor}
                onChange={(e) =>
                  setFormData({ ...formData, motorcycleColor: e.target.value })
                }
                error={validationErrors.motorcycleColor}
                errorMessage="Jaza rangi ya pikipiki"
                required
                disabled={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                }
                className={
                  contractType === "sale" &&
                  selectedMotorcycle?.status === "in_stock"
                    ? "bg-gray-100"
                    : ""
                }
                placeholder="Mfano: Red"
              />
            </div>
          </div>

          {/* Previous Owner Section (for purchase contracts) */}
          {contractType === "purchase" && (
            <div className="border-b pb-4 mb-4">
              <h4 className="font-semibold mb-3">
                PIKIPIKI AMBAYO IMENUNULIWA/KUTOKA KWA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Jina"
                  value={formData.previousOwnerName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerName: e.target.value,
                    })
                  }
                />
                <Input
                  label="Mawasiliano"
                  value={formData.previousOwnerContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerContact: e.target.value,
                    })
                  }
                />
                <Input
                  label="TIN Number"
                  value={formData.previousOwnerTIN}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerTIN: e.target.value,
                    })
                  }
                />
                <Select
                  label="Aina ya Kitambulisho"
                  value={formData.previousOwnerIdType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerIdType: e.target.value,
                    })
                  }
                  options={[
                    { value: "", label: "Chagua..." },
                    { value: "NIDA", label: "NIDA" },
                    { value: "Passport", label: "Passport" },
                    { value: "Driving License", label: "Driving License" },
                  ]}
                />
                <Input
                  label="Namba za Kitambulisho"
                  value={formData.previousOwnerIdNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerIdNumber: e.target.value,
                    })
                  }
                />
                <Input
                  label="Makazi"
                  value={formData.previousOwnerAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerAddress: e.target.value,
                    })
                  }
                />
                <Input
                  label="Kazi"
                  value={formData.previousOwnerOccupation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      previousOwnerOccupation: e.target.value,
                    })
                  }
                />
                <div>
                  <ImageUploader
                    label="Picha ya Mmiliki wa Awali"
                    value={formData.previousOwnerPhoto}
                    onChange={(imageData) =>
                      setFormData({
                        ...formData,
                        previousOwnerPhoto: imageData,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Person who brought/referred (for purchase contracts) */}
          {contractType === "purchase" && (
            <div className="border-b pb-4 mb-4">
              <h4 className="font-semibold mb-3">
                AMBAYE AMELETWA/KAELEKEZWA KWA MR PIKIPIKI TRADING NA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Jina"
                  value={formData.broughtByName}
                  onChange={(e) =>
                    setFormData({ ...formData, broughtByName: e.target.value })
                  }
                />
                <Input
                  label="Mawasiliano"
                  value={formData.broughtByContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broughtByContact: e.target.value,
                    })
                  }
                />
                <Input
                  label="Makazi"
                  value={formData.broughtByAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broughtByAddress: e.target.value,
                    })
                  }
                />
                <Input
                  label="Kazi"
                  value={formData.broughtByOccupation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broughtByOccupation: e.target.value,
                    })
                  }
                />
                <Input
                  label="Uhusiano na Mmiliki"
                  value={formData.broughtByRelationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broughtByRelationship: e.target.value,
                    })
                  }
                />
                <Select
                  label="Aina ya Kitambulisho"
                  value={formData.broughtByIdType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broughtByIdType: e.target.value,
                    })
                  }
                  options={[
                    { value: "", label: "Chagua..." },
                    { value: "NIDA", label: "NIDA" },
                    { value: "Passport", label: "Passport" },
                    { value: "Driving License", label: "Driving License" },
                  ]}
                />
                <Input
                  label="Namba za Kitambulisho"
                  value={formData.broughtByIdNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      broughtByIdNumber: e.target.value,
                    })
                  }
                />
                <div>
                  <ImageUploader
                    label="Picha ya Mwakilishi/Dalali"
                    value={formData.broughtByPhoto}
                    onChange={(imageData) =>
                      setFormData({ ...formData, broughtByPhoto: imageData })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sale Terms */}
          <div className="border-b pb-4 mb-4">
            <h4 className="font-semibold mb-3">Masharti ya Mauzo</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Maelezo:</strong> Deni ni kiasi kilichobaki cha kulipa
                baada ya malipo ya awali. Sababu ya deni ni maelezo kwa nini
                kuna deni (mfano: malipo ya kawaida, sehemu ya malipo, nk).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Bei ya Pikipiki (TZS) *"
                type="number"
                value={formData.salePrice}
                onChange={(e) => {
                  const salePrice = parseFloat(e.target.value) || 0;
                  const amountPaid = parseFloat(formData.amountPaid) || 0;
                  const remaining = salePrice - amountPaid;
                  setFormData({
                    ...formData,
                    salePrice: e.target.value,
                    remainingBalance:
                      remaining > 0 ? remaining.toString() : "0",
                  });
                }}
                required
                placeholder="Mfano: 3000000"
              />
              <Input
                label="Kiasi Kilicholipwa (TZS)"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => {
                  const amountPaid = parseFloat(e.target.value) || 0;
                  const salePrice = parseFloat(formData.salePrice) || 0;
                  const remaining = salePrice - amountPaid;
                  setFormData({
                    ...formData,
                    amountPaid: e.target.value,
                    remainingBalance:
                      remaining > 0 ? remaining.toString() : "0",
                  });
                }}
                placeholder="Mfano: 2500000 (au 0 kama malipo kamili)"
              />
              <Input
                label="Deni (TZS) - Kiasi Kilichobaki"
                type="number"
                value={formData.remainingBalance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remainingBalance: e.target.value,
                  })
                }
                disabled
                className="bg-gray-100"
                placeholder="Hesabujiwa kiotomatiki"
              />
              <Input
                label="Sababu ya Deni (Kwa nini kuna deni?)"
                value={formData.balanceReason}
                onChange={(e) =>
                  setFormData({ ...formData, balanceReason: e.target.value })
                }
                placeholder="Mfano: Malipo ya kawaida (installment), sehemu ya malipo, nk"
              />
            </div>
            {parseFloat(formData.remainingBalance) > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Kumbuka:</strong> Kuna deni la TZS{" "}
                  {parseFloat(formData.remainingBalance).toLocaleString()}.
                  Hakikisha umejaza sababu ya deni.
                </p>
              </div>
            )}
            {parseFloat(formData.remainingBalance) === 0 &&
              parseFloat(formData.amountPaid) > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>✓</strong> Malipo kamili yamelipwa. Hakuna deni.
                  </p>
                </div>
              )}
          </div>

          {/* Witnesses Section */}
          <div className="mb-4">
            <h4 className="font-semibold mb-3">Mashahidi</h4>
            <div className="space-y-4">
              {/* Seller's Witness 1 */}
              <div className="border p-4 rounded">
                <h5 className="font-semibold mb-2">SHAHIDI WA MUUZAJI [1]</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Jina"
                    value={formData.sellerWitness1Name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness1Name: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Namba ya Simu"
                    value={formData.sellerWitness1Phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness1Phone: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Makazi"
                    value={formData.sellerWitness1Address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness1Address: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Aina ya Kitambulisho"
                    value={formData.sellerWitness1IdType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness1IdType: e.target.value,
                      })
                    }
                    options={[
                      { value: "", label: "Chagua..." },
                      { value: "NIDA", label: "NIDA" },
                      { value: "Passport", label: "Passport" },
                      { value: "Driving License", label: "Driving License" },
                    ]}
                  />
                  <Input
                    label="Namba za Kitambulisho"
                    value={formData.sellerWitness1IdNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness1IdNumber: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Kazi"
                    value={formData.sellerWitness1Occupation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness1Occupation: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Seller's Witness 2 */}
              <div className="border p-4 rounded">
                <h5 className="font-semibold mb-2">SHAHIDI WA MUUZAJI [2]</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Jina"
                    value={formData.sellerWitness2Name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness2Name: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Namba ya Simu"
                    value={formData.sellerWitness2Phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness2Phone: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Makazi"
                    value={formData.sellerWitness2Address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness2Address: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Aina ya Kitambulisho"
                    value={formData.sellerWitness2IdType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness2IdType: e.target.value,
                      })
                    }
                    options={[
                      { value: "", label: "Chagua..." },
                      { value: "NIDA", label: "NIDA" },
                      { value: "Passport", label: "Passport" },
                      { value: "Driving License", label: "Driving License" },
                    ]}
                  />
                  <Input
                    label="Namba za Kitambulisho"
                    value={formData.sellerWitness2IdNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness2IdNumber: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Kazi"
                    value={formData.sellerWitness2Occupation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellerWitness2Occupation: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Buyer's Witness */}
              <div className="border p-4 rounded">
                <h5 className="font-semibold mb-2">SHAHIDI WA MNUNUZI</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Jina"
                    value={formData.buyerWitnessName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyerWitnessName: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Namba ya Simu"
                    value={formData.buyerWitnessPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyerWitnessPhone: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Makazi"
                    value={formData.buyerWitnessAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buyerWitnessAddress: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legal Professional */}
          <div className="mb-4">
            <h4 className="font-semibold mb-3">Mwanasheria/Wakili</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Jina"
                value={formData.lawyerName}
                onChange={(e) =>
                  setFormData({ ...formData, lawyerName: e.target.value })
                }
              />
              <Input
                label="Mawasiliano"
                value={formData.lawyerContact}
                onChange={(e) =>
                  setFormData({ ...formData, lawyerContact: e.target.value })
                }
              />
            </div>
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
                    <div className="space-y-2">
                      <p>
                        <strong>NDUGU</strong>{" "}
                        {formData.partyName || "____________________"}
                      </p>
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
                    <div className="flex flex-col items-center">
                      <p className="font-semibold mb-2 text-sm text-center">
                        PICHA YA{" "}
                        {contractType === "sale" ? "MNUNUZI" : "MUUZAJI"}
                      </p>
                      <div className="border-2 border-dashed border-gray-400 h-40 w-32 flex items-center justify-center bg-gray-50">
                        {formData.partyPhoto ? (
                          <img
                            src={formData.partyPhoto}
                            alt="Party Photo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs text-center px-2">
                            (ibandikwe hapa)
                          </span>
                        )}
                      </div>
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

            {/* Previous Owner Section (for purchase contracts) */}
            {contractType === "purchase" && (
              <div className="border-t pt-4 mt-4">
                <p className="font-semibold mb-3 text-base">
                  PIKIPIKI AMBAYO IMENUNULIWA/KUTOKA KWA
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>JINA</strong>{" "}
                      {formData.previousOwnerName || "____________________"}
                    </p>
                    <p>
                      <strong>MAWASILIANO</strong>{" "}
                      {formData.previousOwnerContact || "____________________"}
                    </p>
                    <p>
                      <strong>TIN NUMBER</strong>{" "}
                      {formData.previousOwnerTIN || "____________________"}
                    </p>
                    <p>
                      <strong>AINA YA KITAMBULISHO</strong>{" "}
                      {formData.previousOwnerIdType || "____________________"}
                    </p>
                    <p>
                      <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                      {formData.previousOwnerIdNumber || "____________________"}
                    </p>
                    <p>
                      <strong>MAKAZI YAKE</strong>{" "}
                      {formData.previousOwnerAddress || "____________________"}
                    </p>
                    <p>
                      <strong>KAZI</strong>{" "}
                      {formData.previousOwnerOccupation ||
                        "____________________"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="font-semibold mb-2 text-sm text-center">
                      PICHA YA MMLIKI WA AWALI
                    </p>
                    <div className="border-2 border-dashed border-gray-400 h-40 w-32 flex items-center justify-center bg-gray-50">
                      {formData.previousOwnerPhoto ? (
                        <img
                          src={formData.previousOwnerPhoto}
                          alt="Previous Owner"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                          (ibandikwe hapa)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motorcycle Details - Kwanza */}
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

            {/* Previous Owner Section (for sale contracts) - Pili */}
            {contractType === "sale" && (
              <div className="border-t pt-4 mt-4">
                <p className="font-semibold mb-3 text-base">
                  PIKIPIKI AMBAYO IMENUNULIWA/KUTOKA KWA
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>JINA</strong>{" "}
                      {formData.previousOwnerName || "____________________"}
                    </p>
                    <p>
                      <strong>MAWASILIANO</strong>{" "}
                      {formData.previousOwnerContact || "____________________"}
                    </p>
                    <p>
                      <strong>TIN NUMBER</strong>{" "}
                      {formData.previousOwnerTIN || "____________________"}
                    </p>
                    <p>
                      <strong>AINA YA KITAMBULISHO</strong>{" "}
                      {formData.previousOwnerIdType || "____________________"}
                    </p>
                    <p>
                      <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                      {formData.previousOwnerIdNumber || "____________________"}
                    </p>
                    <p>
                      <strong>MAKAZI YAKE</strong>{" "}
                      {formData.previousOwnerAddress || "____________________"}
                    </p>
                    <p>
                      <strong>KAZI</strong>{" "}
                      {formData.previousOwnerOccupation ||
                        "____________________"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="font-semibold mb-2 text-sm text-center">
                      PICHA YA MMLIKI WA AWALI
                    </p>
                    <div className="border-2 border-dashed border-gray-400 h-40 w-32 flex items-center justify-center bg-gray-50">
                      {formData.previousOwnerPhoto ? (
                        <img
                          src={formData.previousOwnerPhoto}
                          alt="Previous Owner"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                          (ibandikwe hapa)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Person who brought/referred Section (for sale contracts) - Tatu */}
            {contractType === "sale" && (
              <div className="border-t pt-4 mt-4">
                <p className="font-semibold mb-3 text-base">
                  AMBAYE AMELETWA/KAELEKEZWA KWA MR PIKIPIKI TRADING NA
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>JINA</strong>{" "}
                      {formData.broughtByName || "____________________"}
                    </p>
                    <p>
                      <strong>MAWASILIANO</strong>{" "}
                      {formData.broughtByContact || "____________________"}
                    </p>
                    <p>
                      <strong>MAKAZI</strong>{" "}
                      {formData.broughtByAddress || "____________________"}
                    </p>
                    <p>
                      <strong>KAZI YAKE</strong>{" "}
                      {formData.broughtByOccupation || "____________________"}
                    </p>
                    <p>
                      <strong>UHUSIANO NA MMLIKI</strong>{" "}
                      {formData.broughtByRelationship || "____________________"}
                    </p>
                    <p>
                      <strong>AINA YA KITAMBULISHO</strong>{" "}
                      {formData.broughtByIdType || "____________________"}
                    </p>
                    <p>
                      <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                      {formData.broughtByIdNumber || "____________________"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="font-semibold mb-2 text-sm text-center">
                      PICHA YA MWAKILISHI/DALALI/ALIYEMALIZA MKATABA
                    </p>
                    <div className="border-2 border-dashed border-gray-400 h-40 w-32 flex items-center justify-center bg-gray-50">
                      {formData.broughtByPhoto ? (
                        <img
                          src={formData.broughtByPhoto}
                          alt="Brought By"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                          (ibandikwe hapa)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Person who brought/referred Section (for purchase contracts) */}
            {contractType === "purchase" && (
              <div className="border-t pt-4 mt-4">
                <p className="font-semibold mb-3 text-base">
                  AMBAYE AMELETWA/KAELEKEZWA KWA MR PIKIPIKI TRADING NA
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>JINA</strong>{" "}
                      {formData.broughtByName || "____________________"}
                    </p>
                    <p>
                      <strong>MAWASILIANO</strong>{" "}
                      {formData.broughtByContact || "____________________"}
                    </p>
                    <p>
                      <strong>MAKAZI</strong>{" "}
                      {formData.broughtByAddress || "____________________"}
                    </p>
                    <p>
                      <strong>KAZI YAKE</strong>{" "}
                      {formData.broughtByOccupation || "____________________"}
                    </p>
                    <p>
                      <strong>UHUSIANO NA MMLIKI</strong>{" "}
                      {formData.broughtByRelationship || "____________________"}
                    </p>
                    <p>
                      <strong>AINA YA KITAMBULISHO</strong>{" "}
                      {formData.broughtByIdType || "____________________"}
                    </p>
                    <p>
                      <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                      {formData.broughtByIdNumber || "____________________"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="font-semibold mb-2 text-sm text-center">
                      PICHA YA MWAKILISHI/DALALI/ALIYEMALIZA MKATABA
                    </p>
                    <div className="border-2 border-dashed border-gray-400 h-40 w-32 flex items-center justify-center bg-gray-50">
                      {formData.broughtByPhoto ? (
                        <img
                          src={formData.broughtByPhoto}
                          alt="Brought By"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                          (ibandikwe hapa)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions Section */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">
                MKATABA HUU UNASHUHUDIA YAFUATAYO
              </p>
              <div className="pl-4 space-y-2 text-sm">
                <p>
                  <strong>1 (a)</strong> Pikipiki tajwa itauzwa kwa bei ya
                  shilingi{" "}
                  {formData.salePrice
                    ? parseFloat(formData.salePrice).toLocaleString()
                    : "____________________"}
                </p>
                <p>
                  <strong>(b)</strong> Mnunuzi anakubali kununua pikipiki tajwa
                  katika hali iliyokuwa nayo na ambayo amekubaliana nayo
                </p>
                <p>
                  <strong>(c)</strong> Mnunuzi anakubali kubeba gharama za
                  kuhamisha umiliki Pamoja na kodi zote
                </p>
                <p>
                  <strong>(d)</strong> OFISI ITATOA MUDA WA SIKU THELASINI (30)
                  TU KUTOKA SIKU YA KUSAINIWA KWA MKATABA HUU KWA MNUNUZI
                  KUBADILISHA UMILIKI WA PIKIPIKI TAJWA PAMOJA NA KODI ZOTE.
                </p>
                <p>
                  <strong>(e)</strong> Ofisi haitahusika katika namna yoyote kwa
                  matumizi ya pikipiki baada ya tarehe ya kusainiwa kwa mkataba
                  huu
                </p>
                <p>
                  <strong>(f)</strong> Mnunuzi atawajibika kwa makosa yoyote
                  yatakayo fanyika/ kutendeka na pikipiki tajwa katika kipindi
                  chote ambacho hajabadilisha umiliki baada ya tarehe ya
                  kusainiwa kwa mkataba huu.
                </p>
                <p>
                  <strong>(g)</strong> Ofisi itaendelea kuwa mshauri wa karibu
                  (kama ikihitajika) katika masuala ya kiufundi katika pikipiki
                  tajwa hapo juu baada ya tarehe ya kusainiwa kwa mkataba huu.
                </p>
                <p>
                  <strong>(h)</strong> Pikipiki ikiuzwa hairudishwi
                </p>
                <p>
                  <strong>2 (a)</strong> Ofisi itawajibika kutoa viambatanisho
                  vinavyohitajika kwa muongozo wa mamlaka ya mapato Tanzania
                  (TRA) ili kubadilisha umiliki wa pikipiki tajwa hapo juu
                </p>
                <p>
                  <strong>(b)</strong> Pikipiki zote zilizonunuliwa kutoka
                  kwenye kampuni, mnunuzi atawajibika kutoa viambatanisho vyake
                  vinavyohitajika ili kubadilisha umiliki na ofisi itawajibika
                  kushughulikia taratibu za kuhamisha umiliki kwa gharama za
                  mnunuzi (kama ilivyokubaliwa katika kipengele 1:c)
                </p>
                <p>
                  <strong>(c)</strong> Ofisi inawajibika kuthibitisha usalama wa
                  pikipiki tajwa hapo juu ambayo imenunuliwa katika KAMPUNI/MTU
                  BINAFSI ambaye/ambazo taarifa zake zimeanishwa hapo juu.
                </p>
                <p>
                  <strong>(d)</strong> Ofisi itahakikisha kutoa taarifa
                  ilizopewa na mmliki wa awali (kama ikihitajika) kuhusu
                  pikipiki KATIKA KIPINDI CHA SIKU 30 TU (mwezi mmoja) kutoka
                  tarehe ya kusainiwa kwa mkataba huu ambazo zitahusisha
                  MAWASILIANO, KITAMBULISHO, PICHA YA PASSPORT, NAMBA YA
                  UTAMBULISHO WA MLIPAKODI (TIN). (ISIPOKUWA KWA PIKIPIKI ZENYE
                  UMILIKI WA KAMPUNI AU UBIA NA KAMPUNI)
                </p>
                <p>
                  <strong>(e)</strong> Mnunuzi anatambua kuwa ofisi inasamama
                  kama daraja kati yake (mnunuzi) na mmliki wa awali ambaye
                  taarifa zake zimetajwa, hivyo ofisi haiwajibiki kubadili
                  umiliki wa pikipiki kuwa katika umiliki wake (ofisi) kabla ya
                  kuuza kwa mnunuzi
                </p>
                <p>
                  <strong>(f)</strong> Mkataba huu utaendeshwa na kutafsiriwa
                  kwa mujibu wa sheria za nchi ya jamuhuri ya muuangano wa
                  Tanzania
                </p>
                <p>
                  <strong>(g)</strong> Mnunuzi na muuzaji wanakiri kusoma,
                  kuelewa na kuridhia masharti ya mkataba huu kabla ya tarehe ya
                  kusainiwa.
                </p>
              </div>
            </div>

            {/* Seller Section */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">1: MUUZAJI</p>
              <div className="pl-4 space-y-2">
                <p>
                  <strong>JINA</strong>{" "}
                  {contractType === "sale"
                    ? "MR PIKIPIKI TRADING"
                    : formData.partyName || "____________________"}
                </p>
                <p>
                  <strong>NAMBA YA SIMU</strong>{" "}
                  {contractType === "sale"
                    ? formData.companyPhone
                    : formData.partyPhone || "____________________"}
                </p>
                <p>
                  <strong>MAKAZI</strong>{" "}
                  {contractType === "sale"
                    ? formData.companyAddress
                    : formData.partyAddress || "____________________"}
                </p>
                {contractType === "purchase" && (
                  <>
                    <p>
                      <strong>AINA YA KITAMBULISHO</strong>{" "}
                      {formData.partyIdType || "____________________"}
                    </p>
                    <p>
                      <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                      {formData.partyIdNumber || "____________________"}
                    </p>
                  </>
                )}
                <p>
                  <strong>KAZI</strong>{" "}
                  {contractType === "purchase"
                    ? formData.partyOccupation || "____________________"
                    : "Muuzaji"}
                </p>
                <p>
                  <strong>SAHIHI</strong>{" "}
                  {contractType === "sale"
                    ? "____________________"
                    : formData.partyName
                    ? "____________________"
                    : "____________________"}
                </p>
              </div>
            </div>

            {/* Seller's Witness 1 */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">2: SHAHIDI WA MUUZAJI</p>
              <div className="pl-4 space-y-2">
                <p>
                  <strong>JINA</strong>{" "}
                  {formData.sellerWitness1Name || "____________________"}
                </p>
                <p>
                  <strong>NAMBA YA SIMU</strong>{" "}
                  {formData.sellerWitness1Phone || "____________________"}
                </p>
                <p>
                  <strong>MAKAZI</strong>{" "}
                  {formData.sellerWitness1Address || "____________________"}
                </p>
                <p>
                  <strong>AINA YA KITAMBULISHO</strong>{" "}
                  {formData.sellerWitness1IdType || "____________________"}
                </p>
                <p>
                  <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                  {formData.sellerWitness1IdNumber || "____________________"}
                </p>
                <p>
                  <strong>KAZI</strong>{" "}
                  {formData.sellerWitness1Occupation || "____________________"}
                </p>
                <p>
                  <strong>SAHIHI</strong>{" "}
                  {formData.sellerWitness1Signature || "____________________"}
                </p>
              </div>
            </div>

            {/* Seller's Witness 2 - Only show for purchase contracts */}
            {contractType === "purchase" && (
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">3: SHAHIDI WA MUUZAJI [2]</p>
                <div className="pl-4 space-y-2">
                  <p>
                    <strong>JINA</strong>{" "}
                    {formData.sellerWitness2Name || "____________________"}
                  </p>
                  <p>
                    <strong>NAMBA YA SIMU</strong>{" "}
                    {formData.sellerWitness2Phone || "____________________"}
                  </p>
                  <p>
                    <strong>MAKAZI</strong>{" "}
                    {formData.sellerWitness2Address || "____________________"}
                  </p>
                  <p>
                    <strong>AINA YA KITAMBULISHO</strong>{" "}
                    {formData.sellerWitness2IdType || "____________________"}
                  </p>
                  <p>
                    <strong>NAMBA ZA KITAMBULISHO</strong>{" "}
                    {formData.sellerWitness2IdNumber || "____________________"}
                  </p>
                  <p>
                    <strong>KAZI</strong>{" "}
                    {formData.sellerWitness2Occupation ||
                      "____________________"}
                  </p>
                  <p>
                    <strong>SAHIHI</strong>{" "}
                    {formData.sellerWitness2Signature || "____________________"}
                  </p>
                </div>
              </div>
            )}

            {/* Buyer Section */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">
                {contractType === "sale" ? "3: MNUNUZI" : "3: MNUNUZI"}
              </p>
              <div className="pl-4 space-y-2">
                <p>
                  <strong>JINA</strong>{" "}
                  {contractType === "sale"
                    ? formData.partyName || "____________________"
                    : "MR PIKIPIKI TRADING"}
                </p>
                <p>
                  <strong>NAMBA YA SIMU</strong>{" "}
                  {contractType === "sale"
                    ? formData.partyPhone || "____________________"
                    : formData.companyPhone}
                </p>
                <p>
                  <strong>MAKAZI</strong>{" "}
                  {contractType === "sale"
                    ? formData.partyAddress || "____________________"
                    : formData.companyAddress}
                </p>
                <p>
                  <strong>SAHIHI</strong>{" "}
                  {contractType === "sale"
                    ? formData.partyName
                      ? "____________________"
                      : "____________________"
                    : "____________________"}
                </p>
              </div>
            </div>

            {/* Buyer's Witness */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">4: SHAHIDI WA MNUNUZI</p>
              <div className="pl-4 space-y-2">
                <p>
                  <strong>JINA</strong>{" "}
                  {formData.buyerWitnessName || "____________________"}
                </p>
                <p>
                  <strong>NAMBA YA SIMU</strong>{" "}
                  {formData.buyerWitnessPhone || "____________________"}
                </p>
                <p>
                  <strong>MAKAZI</strong>{" "}
                  {formData.buyerWitnessAddress || "____________________"}
                </p>
                <p>
                  <strong>SAHIHI</strong>{" "}
                  {formData.buyerWitnessSignature || "____________________"}
                </p>
              </div>
            </div>

            {/* Legal Professional Section */}
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">
                IMESHUHUDIWA NA KUTIWA SAHIHI LEO TAREHE{" "}
                {formData.witnessDate || "____________________"} MWEZI{" "}
                {new Date().toLocaleDateString("sw-TZ", { month: "long" })}{" "}
                MWAKA {new Date().getFullYear()}
              </p>
              <div className="pl-4">
                <p className="font-semibold mb-2">NA MWANASHERIA/WAKILI</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p>
                      <strong>JINA</strong>{" "}
                      {formData.lawyerName || "____________________"}
                    </p>
                    <p>
                      <strong>MAWASILIANO</strong>{" "}
                      {formData.lawyerContact || "____________________"}
                    </p>
                    <p>
                      <strong>SAHIHI</strong>{" "}
                      {formData.lawyerSignature || "____________________"}
                    </p>
                  </div>
                  <div>
                    <div className="border-2 border-blue-300 bg-blue-50 h-24 flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-semibold">
                        mwasheria/wakili
                      </span>
                    </div>
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
