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
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
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
    { header: 'ID Type', accessor: 'idType' },
    { header: 'ID Number', accessor: 'idNumber' },
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
            className="text-blue-600 hover:text-blue-800"
          >
            <FiEdit />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-800"
          >
            <FiTrash2 />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <Button onClick={() => setModalOpen(true)}>
          <FiPlus className="inline mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <TableWithSearch 
          columns={columns} 
          data={customers}
          searchKeys={['fullName', 'phone', 'email', 'address', 'idNumber']}
        />
      </Card>

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
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
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


