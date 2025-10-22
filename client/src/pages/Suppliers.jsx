import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import TableWithSearch from '../components/TableWithSearch';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    taxId: '',
    rating: 5,
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`/api/suppliers/${editingSupplier._id}`, formData);
      } else {
        await axios.post('/api/suppliers', formData);
      }
      fetchSuppliers();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save supplier');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`/api/suppliers/${id}`);
        fetchSuppliers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete supplier');
      }
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      company: supplier.company || '',
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address,
      city: supplier.city || 'Dar es Salaam',
      country: supplier.country || 'Tanzania',
      taxId: supplier.taxId || '',
      rating: supplier.rating || 5,
      notes: supplier.notes || ''
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      taxId: '',
      rating: 5,
      notes: ''
    });
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Company', accessor: 'company' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'City', accessor: 'city' },
    { 
      header: 'Total Supplied', 
      render: (row) => row.totalSupplied || 0
    },
    { 
      header: 'Rating', 
      render: (row) => '⭐'.repeat(row.rating || 5)
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
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <FiPlus className="inline mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Supplier</span>
        </Button>
      </div>

      <Card>
        <TableWithSearch 
          columns={columns} 
          data={suppliers}
          searchKeys={['name', 'company', 'phone', 'email', 'address']}
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
            <Input
              label="Tax ID"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
            <Input
              label="Rating (1-5)"
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
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
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;


