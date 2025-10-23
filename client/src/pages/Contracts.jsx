import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import TableWithSearch from '../components/TableWithSearch';
import { 
  FiDownload, FiEye, FiPlus, FiEdit, FiTrash2, FiUpload, 
  FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiPrinter, FiSearch, FiCheck 
} from 'react-icons/fi';
import DocumentPreview from '../components/DocumentPreview';
import DocumentManager from '../components/DocumentManager';
import PDFViewer from '../components/PDFViewer';

const Contracts = () => {
  const [searchParams] = useSearchParams();
  const [contracts, setContracts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [documentManagerOpen, setDocumentManagerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [motorcycles, setMotorcycles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [formData, setFormData] = useState({
    type: 'sale',
    motorcycle: '',
    party: '',
    amount: '',
    currency: 'TZS',
    date: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    paymentMethod: 'cash',
    installmentDetails: {
      downPayment: '',
      monthlyPayment: '',
      duration: '',
      interestRate: ''
    },
    terms: '',
    warranties: [],
    penalties: []
  });

  // New state for document-first workflow
  const [signedDocument, setSignedDocument] = useState(null);
  const [documentDescription, setDocumentDescription] = useState('');

  // Retry mechanism for failed requests
  const retryRequest = useCallback(async (requestFn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Request attempt ${i + 1} failed:`, error.message);
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      console.log('Fetching contracts with filter:', filter);
      const params = filter !== 'all' ? { type: filter } : {};
      
      const response = await retryRequest(() => 
        axios.get('/api/contracts', { 
          params,
          timeout: 10000
        })
      );
      
      console.log('Contracts response:', response.data);
      const contractsData = Array.isArray(response.data.contracts) ? response.data.contracts : [];
      console.log(`Received ${contractsData.length} contracts`);
      setContracts(contractsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Failed to load contracts. Please check your connection and try again.');
      setContracts([]);
    }
  }, [filter, retryRequest]);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching motorcycles, suppliers, and customers...');
      
      const [bikesRes, suppliersRes, customersRes] = await Promise.all([
        retryRequest(() => axios.get('/api/motorcycles', { timeout: 10000 })),
        retryRequest(() => axios.get('/api/suppliers', { timeout: 10000 })),
        retryRequest(() => axios.get('/api/customers', { timeout: 10000 }))
      ]);
      
      // Handle different response structures
      const motorcyclesData = Array.isArray(bikesRes.data) ? bikesRes.data : [];
      const suppliersData = Array.isArray(suppliersRes.data) ? suppliersRes.data : [];
      const customersData = Array.isArray(customersRes.data) ? customersRes.data : [];
      
      console.log('Data loaded successfully:', {
        motorcycles: motorcyclesData.length,
        suppliers: suppliersData.length,
        customers: customersData.length
      });
      
      setMotorcycles(motorcyclesData);
      setSuppliers(suppliersData);
      setCustomers(customersData);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load required data. Some features may not work properly.');
      setMotorcycles([]);
      setSuppliers([]);
      setCustomers([]);
    }
  }, [retryRequest]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRetryCount(0);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Contracts loading timeout - setting loading to false');
        setLoading(false);
      }, 15000); // 15 second timeout
      
      await Promise.all([fetchContracts(), fetchData()]);
      clearTimeout(timeoutId);
    } catch (err) {
      console.error('Error loading contracts page:', err);
      setError('Failed to load contracts data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchContracts, fetchData]);

  useEffect(() => {
    loadData();
    
    const createType = searchParams.get('create');
    const motorcycleId = searchParams.get('motorcycle');
    
    if (createType && motorcycleId) {
      setFormData(prev => ({
        ...prev,
        type: createType,
        motorcycle: motorcycleId
      }));
      setModalOpen(true);
    }
  }, [filter, searchParams, loadData]);

  // Debug effect to monitor data changes
  useEffect(() => {
    console.log('Motorcycles state changed:', motorcycles);
    console.log('Suppliers state changed:', suppliers);
    console.log('Customers state changed:', customers);
  }, [motorcycles, suppliers, customers]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadData();
  };

  const handlePreviewPDF = async (contractId, contractNumber) => {
    try {
      console.log('Previewing PDF for contract:', contractId);
      
      // Show loading state
      setPreviewDocument({
        url: null,
        name: `contract-${contractNumber}.pdf`,
        type: 'pdf'
      });
      setPdfViewerOpen(true);
      
      // Fetch the PDF content with authentication
      const response = await axios.get(`/api/contracts/${contractId}/pdf/preview`, {
        responseType: 'blob',
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('PDF response status:', response.status);
      console.log('PDF response data size:', response.data?.size);
      console.log('PDF response headers:', response.headers);
      
      if (response.status === 200 && response.data && response.data.size > 0) {
        // Create blob URL for preview
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        
        console.log('Created blob URL:', blobUrl);
        
        setPreviewDocument({
          url: blobUrl,
          name: `contract-${contractNumber}.pdf`,
          type: 'pdf'
        });
      } else {
        throw new Error('Invalid or empty PDF response from server');
      }
    } catch (error) {
      console.error('Error previewing PDF:', error);
      console.error('Error details:', error.response?.data);
      
      // Close the preview modal on error
      setPdfViewerOpen(false);
      setPreviewDocument(null);
      
      // Show user-friendly error message with retry option
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        const retry = confirm('Network error: Unable to connect to server. Would you like to try again?');
        if (retry) {
          // Retry the preview
          setTimeout(() => handlePreviewPDF(contractId, contractNumber), 1000);
        }
      } else if (error.response?.status === 401) {
        alert('Authentication error: Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        alert('Contract not found. Please refresh the page and try again.');
      } else {
        const retry = confirm(`Failed to preview PDF: ${error.message}. Would you like to try again?`);
        if (retry) {
          // Retry the preview
          setTimeout(() => handlePreviewPDF(contractId, contractNumber), 1000);
        }
      }
    }
  };

  const handleDownloadPDF = async (contractId, contractNumber) => {
    try {
      console.log('Downloading PDF for contract:', contractId);
      
      const response = await axios.get(`/api/contracts/${contractId}/pdf`, {
        responseType: 'blob',
        timeout: 30000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('PDF download response status:', response.status);
      console.log('PDF download response data size:', response.data?.size);
      console.log('PDF download response headers:', response.headers);
      
      if (response.status === 200 && response.data && response.data.size > 0) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        console.log('Created download URL:', url);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `contract-${contractNumber}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL after a short delay
        setTimeout(() => {
        window.URL.revokeObjectURL(url);
        }, 1000);
        
        console.log('PDF download initiated successfully');
      } else {
        throw new Error('Invalid or empty PDF response from server');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to download PDF. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication error: Please log in again.';
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        errorMessage = 'Contract not found. Please refresh the page and try again.';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
      } else if (error.response?.data?.error) {
        errorMessage = `Server error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Download error: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const handlePreviewDocument = async (contractId, documentId, documentName, documentType) => {
    try {
      console.log('Previewing document:', documentId);
      
      const previewUrl = `/api/contracts/${contractId}/documents/${documentId}/preview`;
      setPreviewDocument({
        url: previewUrl,
        name: documentName,
        type: documentType
      });
      setPreviewModalOpen(true);
    } catch (error) {
      console.error('Error previewing document:', error);
      alert('Failed to preview document. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Form data being submitted:', formData);
      console.log('Selected motorcycle:', formData.motorcycle);
      console.log('Selected party:', formData.party);
      
      // Check if signed document is uploaded
      if (!signedDocument) {
        alert('Please upload the signed and stamped contract document before creating the contract.');
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add contract data
      Object.keys(formData).forEach(key => {
        if (key === 'installmentDetails') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'warranties' || key === 'penalties') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add document
      formDataToSend.append('document', signedDocument);
      formDataToSend.append('documentType', 'signed_contract');
      formDataToSend.append('description', documentDescription || 'Signed and stamped contract document');
      formDataToSend.append('status', 'active'); // Contract is active since it's signed

      console.log('Contract data being sent with document');
      await axios.post('/api/contracts/with-document', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
    setModalOpen(false);
    setFormData({
      type: 'sale',
      motorcycle: '',
      party: '',
      amount: '',
        currency: 'TZS',
      date: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      paymentMethod: 'cash',
      installmentDetails: {
        downPayment: '',
        monthlyPayment: '',
          duration: '',
          interestRate: ''
        },
        terms: '',
        warranties: [],
        penalties: []
      });
      setSignedDocument(null);
      setDocumentDescription('');
      fetchContracts();
      alert('Contract created successfully with signed document!');
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract. Please try again.');
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('document', e.target.document.files[0]);
      formData.append('documentType', 'signed_contract');
      formData.append('description', e.target.description.value);

      await axios.post(`/api/contracts/${selectedContract._id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadModalOpen(false);
      setSelectedContract(null);
      fetchContracts();
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FiFileText },
      pending_signature: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      active: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiAlertCircle },
      breached: { color: 'bg-red-100 text-red-800', icon: FiAlertCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase().replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    { header: 'Contract No', accessor: 'contractNumber' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.type === 'purchase' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.type.toUpperCase()}
        </span>
      )
    },
    { 
      header: 'Motorcycle', 
      render: (row) => `${row.motorcycle?.brand} ${row.motorcycle?.model}` 
    },
    { 
      header: 'Party', 
      render: (row) => row.party?.name || row.party?.fullName || 'N/A'
    },
    { 
      header: 'Amount', 
      render: (row) => `${row.currency} ${row.amount?.toLocaleString() || '0'}`
    },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    { 
      header: 'Date', 
      render: (row) => row.date ? new Date(row.date).toLocaleDateString() : 'N/A'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handlePreviewPDF(row._id, row.contractNumber)}
            className="p-1 sm:p-0 text-indigo-600 hover:text-indigo-800 transition-colors"
            title="Preview Contract"
          >
            <FiSearch className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleDownloadPDF(row._id, row.contractNumber)}
            className="p-1 sm:p-0 text-blue-600 hover:text-blue-800 transition-colors"
            title="Download PDF"
          >
            <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedContract(row);
              setSignatureModalOpen(true);
            }}
            className="p-1 sm:p-0 text-green-600 hover:text-green-800 transition-colors"
            title="Manage Signatures"
          >
            <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedContract(row);
              setDocumentManagerOpen(true);
            }}
            className="p-1 sm:p-0 text-purple-600 hover:text-purple-800 transition-colors"
            title="View Documents"
          >
            <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
            <button
            onClick={() => {
              setSelectedContract(row);
              setUploadModalOpen(true);
            }}
            className="p-1 sm:p-0 text-orange-600 hover:text-orange-800 transition-colors"
            title="Upload Document"
          >
            <FiUpload className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contracts...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Contracts</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full">
              Try Again {retryCount > 0 && `(${retryCount})`}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">Contracts</h1>
            <p className="text-gray-600">Professional contract management with legal compliance</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Create Contract
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'purchase' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('purchase')}
          >
            Purchase
          </Button>
          <Button 
            variant={filter === 'sale' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('sale')}
          >
            Sales
          </Button>
          <Button 
            variant={filter === 'pending_signature' ? 'primary' : 'outline'} 
            size="sm"
            onClick={() => setFilter('pending_signature')}
          >
            Pending Signature
          </Button>
      </div>

      <Card>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` (filtered by ${filter})`}
            </p>
          </div>
        <TableWithSearch 
          columns={columns} 
          data={contracts}
          searchKeys={['contractNumber', 'party.name', 'party.fullName', 'motorcycle.brand', 'motorcycle.model', 'motorcycle.chassisNumber']}
        />
      </Card>
      </div>

      {/* Create Contract Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Professional Contract"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debug Information */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p><strong>Data Status:</strong></p>
            <p>Motorcycles: {motorcycles.length} loaded</p>
            <p>Suppliers: {suppliers.length} loaded</p>
            <p>Customers: {customers.length} loaded</p>
            <p><strong>Debug Info:</strong></p>
            <p>Motorcycles type: {typeof motorcycles}</p>
            <p>Motorcycles is array: {Array.isArray(motorcycles)}</p>
            <p>Suppliers type: {typeof suppliers}</p>
            <p>Suppliers is array: {Array.isArray(suppliers)}</p>
            <p>Customers type: {typeof customers}</p>
            <p>Customers is array: {Array.isArray(customers)}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Contract Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'sale', label: 'Sale Agreement' },
                { value: 'purchase', label: 'Purchase Agreement' },
                { value: 'service', label: 'Service Agreement' },
                { value: 'maintenance', label: 'Maintenance Contract' }
              ]}
              required
            />
            
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={[
                { value: 'TZS', label: 'Tanzanian Shilling (TZS)' },
                { value: 'USD', label: 'US Dollar (USD)' },
                { value: 'EUR', label: 'Euro (EUR)' }
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Motorcycle"
              value={formData.motorcycle}
              onChange={(e) => setFormData({ ...formData, motorcycle: e.target.value })}
              options={[
                { value: '', label: 'Select a motorcycle...' },
                ...motorcycles.map(bike => ({
                  value: bike._id,
                  label: `${bike.brand} ${bike.model} - ${bike.chassisNumber}`
                }))
              ]}
              required
            />
            
            <Select
              label="Party"
              value={formData.party}
              onChange={(e) => setFormData({ ...formData, party: e.target.value })}
              options={[
                { value: '', label: 'Select a party...' },
                ...suppliers.map(supplier => ({
                  value: supplier._id,
                  label: `Supplier: ${supplier.name}`
                })),
                ...customers.map(customer => ({
                  value: customer._id,
                  label: `Customer: ${customer.fullName}`
                }))
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'mobile_money', label: 'Mobile Money' },
                { value: 'installment', label: 'Installment' },
                { value: 'cheque', label: 'Cheque' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contract Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            
            <Input
              label="Effective Date"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              required
            />
          </div>

          {formData.paymentMethod === 'installment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                label="Down Payment"
                  type="number"
                  value={formData.installmentDetails.downPayment}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    installmentDetails: { 
                      ...formData.installmentDetails, 
                      downPayment: e.target.value 
                    } 
                  })}
                />
                <Input
                label="Monthly Payment"
                  type="number"
                  value={formData.installmentDetails.monthlyPayment}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    installmentDetails: { 
                      ...formData.installmentDetails, 
                      monthlyPayment: e.target.value 
                    } 
                  })}
                />
                <Input
                  label="Duration (Months)"
                  type="number"
                  value={formData.installmentDetails.duration}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    installmentDetails: { 
                      ...formData.installmentDetails, 
                      duration: e.target.value 
                    } 
                  })}
                />
              <Input
                label="Interest Rate (%)"
                type="number"
                step="0.1"
                value={formData.installmentDetails.interestRate}
                onChange={(e) => setFormData({
                  ...formData,
                  installmentDetails: {
                    ...formData.installmentDetails,
                    interestRate: e.target.value
                  }
                })}
              />
            </div>
          )}

          <Input
            label="Terms & Conditions"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            multiline
            rows={4}
            placeholder="Enter specific terms and conditions for this contract..."
          />

          {/* Document Upload Section - Required for Contract Creation */}
          <div className="border-t pt-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUpload className="w-5 h-5 text-blue-600" />
              Signed Contract Document (Required)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload the signed and stamped contract document. The contract will only be saved after the document is uploaded.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Document *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSignedDocument(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                {signedDocument && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <FiCheck className="w-4 h-4" />
                    Document selected: {signedDocument.name}
                  </p>
                )}
              </div>
              
              <Input
                label="Document Description (Optional)"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Brief description of the contract document..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Create Contract
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Signed Contract"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Signed Contract Document
            </label>
            <input
              type="file"
              name="document"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, JPG, PNG (Max 10MB)
            </p>
          </div>
          
          <Input
            label="Description"
            value=""
            onChange={() => {}}
            placeholder="Brief description of the document..."
          />

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* PDF Viewer Modal */}
      {pdfViewerOpen && (
        <PDFViewer
          documentUrl={previewDocument?.url}
          documentName={previewDocument?.name}
          onClose={() => {
            // Clean up blob URL to prevent memory leaks
            if (previewDocument?.url && previewDocument.url.startsWith('blob:')) {
              window.URL.revokeObjectURL(previewDocument.url);
            }
            setPdfViewerOpen(false);
            setPreviewDocument(null);
          }}
        />
      )}

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewDocument(null);
        }}
        documentUrl={previewDocument?.url}
        documentName={previewDocument?.name}
        documentType={previewDocument?.type}
      />

      {/* Document Manager Modal */}
      <DocumentManager
        contractId={selectedContract?._id}
        isOpen={documentManagerOpen}
        onClose={() => {
          setDocumentManagerOpen(false);
          setSelectedContract(null);
        }}
      />
    </div>
  );
};

export default Contracts;