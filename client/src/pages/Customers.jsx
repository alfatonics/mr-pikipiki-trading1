import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import TableWithSearch from '../components/TableWithSearch';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    idType: 'NIDA',
    idNumber: '',
    address: '',
    city: 'Dar es Salaam',
    region: '',
    occupation: '',
    notes: '',
    // Sales/Pricing Information
    budgetRange: '',
    preferredCurrency: 'TZS',
    creditLimit: '',
    paymentTerms: 'cash',
    salesNotes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer._id}`, formData);
      } else {
        await axios.post('/api/customers', formData);
      }
      fetchCustomers();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/api/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete customer');
      }
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email || '',
      idType: customer.idType,
      idNumber: customer.idNumber,
      address: customer.address,
      city: customer.city || 'Dar es Salaam',
      region: customer.region || '',
      occupation: customer.occupation || '',
      notes: customer.notes || ''
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      idType: 'NIDA',
      idNumber: '',
      address: '',
      city: 'Dar es Salaam',
      region: '',
      occupation: '',
      notes: ''
    });
  };

  const columns = [
    { header: 'Full Name', accessor: 'fullName' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Budget Range', 
      render: (row) => {
        const ranges = {
          'under-500k': 'Under 500K',
          '500k-1m': '500K - 1M',
          '1m-2m': '1M - 2M',
          '2m-5m': '2M - 5M',
          '5m-10m': '5M - 10M',
          'over-10m': 'Over 10M'
        };
        return ranges[row.budgetRange] || 'Not specified';
      }
    },
    { header: 'Currency', accessor: 'preferredCurrency' },
    { header: 'Payment Terms', 
      render: (row) => {
        const terms = {
          'cash': 'Cash',
          'installment': 'Installment',
          'credit': 'Credit',
          'lease': 'Lease'
        };
        return terms[row.paymentTerms] || 'Cash';
      }
    },
    { header: 'City', accessor: 'city' },
    { 
      header: 'Total Purchases', 
      render: (row) => row.totalPurchases || 0
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 sm:p-0"
            title="Edit"
          >
            <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-800 p-1 sm:p-0"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">Customers</h1>
            <p className="text-gray-600">Manage customer information and contacts</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card>
          <TableWithSearch 
            columns={columns} 
            data={customers}
            searchKeys={['fullName', 'phone', 'email', 'address', 'idNumber']}
          />
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Select
              label="ID Type"
              value={formData.idType}
              onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
              options={[
                { value: 'NIDA', label: 'NIDA' },
                { value: 'Passport', label: 'Passport' },
                { value: 'Driving License', label: 'Driving License' },
                { value: 'Voter ID', label: 'Voter ID' }
              ]}
              required
            />
            <Input
              label="ID Number"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              required
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            />
            <Input
              label="Occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>

          {/* Sales/Pricing Information Section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Pricing Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Budget Range"
                value={formData.budgetRange}
                onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                options={[
                  { value: '', label: 'Select budget range...' },
                  { value: 'under-500k', label: 'Under 500,000 TZS' },
                  { value: '500k-1m', label: '500,000 - 1,000,000 TZS' },
                  { value: '1m-2m', label: '1,000,000 - 2,000,000 TZS' },
                  { value: '2m-5m', label: '2,000,000 - 5,000,000 TZS' },
                  { value: '5m-10m', label: '5,000,000 - 10,000,000 TZS' },
                  { value: 'over-10m', label: 'Over 10,000,000 TZS' }
                ]}
              />
              <Select
                label="Preferred Currency"
                value={formData.preferredCurrency}
                onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                options={[
                  { value: 'TZS', label: 'Tanzanian Shilling (TZS)' },
                  { value: 'USD', label: 'US Dollar (USD)' },
                  { value: 'EUR', label: 'Euro (EUR)' }
                ]}
              />
              <Input
                label="Credit Limit (TZS)"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="Enter credit limit amount"
              />
              <Select
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                options={[
                  { value: 'cash', label: 'Cash Payment' },
                  { value: 'installment', label: 'Installment Plan' },
                  { value: 'credit', label: 'Credit Account' },
                  { value: 'lease', label: 'Lease Agreement' }
                ]}
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Notes</label>
              <textarea
                value={formData.salesNotes}
                onChange={(e) => setFormData({ ...formData, salesNotes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="Additional sales information, preferences, or special requirements..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="General customer notes and information..."
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCustomer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;


