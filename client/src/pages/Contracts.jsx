import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import TableWithSearch from '../components/TableWithSearch';
import { FiDownload, FiEye, FiPlus } from 'react-icons/fi';

const Contracts = () => {
  const [searchParams] = useSearchParams();
  const [contracts, setContracts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [motorcycles, setMotorcycles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    type: 'sale',
    motorcycle: '',
    party: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    installmentDetails: {
      downPayment: '',
      monthlyPayment: '',
      duration: ''
    },
    terms: ''
  });

  useEffect(() => {
    fetchContracts();
    fetchData();
    
    // Check for URL parameters to pre-fill form
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
  }, [filter, searchParams]);

  const fetchContracts = async () => {
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await axios.get('/api/contracts', { params });
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [bikesRes, suppliersRes, customersRes] = await Promise.all([
        axios.get('/api/motorcycles'),
        axios.get('/api/suppliers'),
        axios.get('/api/customers')
      ]);
      setMotorcycles(bikesRes.data);
      setSuppliers(suppliersRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleDownloadPDF = async (contractId, contractNumber) => {
    try {
      console.log('Downloading PDF for contract:', contractId);
      
      const response = await axios.get(`/api/contracts/${contractId}/pdf`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      });
      
      console.log('PDF response received:', response.status);
      
      if (response.status === 200 && response.data) {
        // Create blob URL
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `contract-${contractNumber}.pdf`;
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(url);
        
        console.log('PDF download initiated successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      
      if (error.code === 'ECONNABORTED') {
        alert('PDF download timed out. Please try again.');
      } else if (error.response?.status === 404) {
        alert('Contract not found.');
      } else if (error.response?.status === 500) {
        alert('Server error generating PDF. Please try again.');
      } else {
        alert(`Failed to download contract: ${error.message}`);
      }
    }
  };

  const handleMarkPrinted = async (contractId) => {
    try {
      await axios.post(`/api/contracts/${contractId}/print`);
      fetchContracts();
    } catch (error) {
      alert('Failed to mark contract as printed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.motorcycle || !formData.party || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (formData.paymentMethod === 'installment') {
      if (!formData.installmentDetails.downPayment || 
          !formData.installmentDetails.monthlyPayment || 
          !formData.installmentDetails.duration) {
        alert('Please fill in all installment details');
        return;
      }
    }

    try {
      const contractData = {
        ...formData,
        amount: parseFloat(formData.amount),
        partyModel: formData.type === 'purchase' ? 'Supplier' : 'Customer',
        installmentDetails: formData.paymentMethod === 'installment' ? {
          downPayment: parseFloat(formData.installmentDetails.downPayment),
          monthlyPayment: parseFloat(formData.installmentDetails.monthlyPayment),
          duration: parseInt(formData.installmentDetails.duration)
        } : undefined
      };

      console.log('Creating contract with data:', contractData);
      
      const response = await axios.post('/api/contracts', contractData);
      console.log('Contract created successfully:', response.data);
      
      fetchContracts();
      handleCloseModal();
      alert('Contract created successfully!');
    } catch (error) {
      console.error('Contract creation error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create contract';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({
      type: 'sale',
      motorcycle: '',
      party: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      installmentDetails: {
        downPayment: '',
        monthlyPayment: '',
        duration: ''
      },
      terms: ''
    });
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
      render: (row) => `TZS ${row.amount.toLocaleString()}`
    },
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' :
          row.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadPDF(row._id, row.contractNumber)}
            className="text-blue-600 hover:text-blue-800"
            title="Download PDF"
          >
            <FiDownload />
          </button>
          {!row.printedAt && (
            <button
              onClick={() => handleMarkPrinted(row._id)}
              className="text-green-600 hover:text-green-800"
              title="Mark as Printed"
            >
              <FiEye />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Create Contract
          </Button>
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
        </div>
      </div>

      <Card>
        <TableWithSearch 
          columns={columns} 
          data={contracts}
          searchKeys={['contractNumber', 'party.name', 'party.fullName', 'motorcycle.brand', 'motorcycle.model', 'motorcycle.chassisNumber']}
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Create New Contract"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Contract Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'purchase', label: 'Purchase Contract' },
                { value: 'sale', label: 'Sales Contract' }
              ]}
              required
            />
            <Select
              label="Motorcycle"
              value={formData.motorcycle}
              onChange={(e) => setFormData({ ...formData, motorcycle: e.target.value })}
              options={motorcycles.map(m => ({ 
                value: m._id, 
                label: `${m.brand} ${m.model} - ${m.chassisNumber}` 
              }))}
              required
            />
            <Select
              label={formData.type === 'purchase' ? 'Supplier' : 'Customer'}
              value={formData.party}
              onChange={(e) => setFormData({ ...formData, party: e.target.value })}
              options={
                formData.type === 'purchase' 
                  ? suppliers.map(s => ({ value: s._id, label: s.name }))
                  : customers.map(c => ({ value: c._id, label: c.fullName }))
              }
              required
            />
            <Input
              label="Amount (TZS)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input
              label="Contract Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                { value: 'installment', label: 'Installment' }
              ]}
              required
            />
          </div>

          {formData.paymentMethod === 'installment' && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-3">Installment Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Down Payment (TZS)"
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
                  label="Monthly Payment (TZS)"
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
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms and Conditions</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="4"
              placeholder="Enter contract terms and conditions..."
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              Create Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Contracts;


