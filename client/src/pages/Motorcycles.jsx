import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import TableWithSearch from '../components/TableWithSearch';
import { FiPlus, FiEdit, FiTrash2, FiFileText } from 'react-icons/fi';

const Motorcycles = () => {
  const [motorcycles, setMotorcycles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState(null);
  const [formData, setFormData] = useState({
    chassisNumber: '',
    engineNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    purchasePrice: '',
    sellingPrice: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'in_stock',
    registrationNumber: '',
    notes: ''
  });

  useEffect(() => {
    fetchMotorcycles();
    fetchSuppliers();
  }, []);

  const fetchMotorcycles = async () => {
    try {
      const response = await axios.get('/api/motorcycles');
      setMotorcycles(response.data);
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
    }
  };

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
      if (editingMotorcycle) {
        await axios.put(`/api/motorcycles/${editingMotorcycle._id}`, formData);
      } else {
        await axios.post('/api/motorcycles', formData);
      }
      fetchMotorcycles();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save motorcycle');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this motorcycle?')) {
      try {
        await axios.delete(`/api/motorcycles/${id}`);
        fetchMotorcycles();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete motorcycle');
      }
    }
  };

  const handleEdit = (motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setFormData({
      chassisNumber: motorcycle.chassisNumber,
      engineNumber: motorcycle.engineNumber,
      brand: motorcycle.brand,
      model: motorcycle.model,
      year: motorcycle.year,
      color: motorcycle.color,
      purchasePrice: motorcycle.purchasePrice,
      sellingPrice: motorcycle.sellingPrice || '',
      supplier: motorcycle.supplier._id,
      purchaseDate: new Date(motorcycle.purchaseDate).toISOString().split('T')[0],
      status: motorcycle.status,
      registrationNumber: motorcycle.registrationNumber || '',
      notes: motorcycle.notes || ''
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMotorcycle(null);
    setFormData({
      chassisNumber: '',
      engineNumber: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      purchasePrice: '',
      sellingPrice: '',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'in_stock',
      registrationNumber: '',
      notes: ''
    });
  };

  const columns = [
    { header: 'Brand', accessor: 'brand' },
    { header: 'Model', accessor: 'model' },
    { header: 'Chassis No', accessor: 'chassisNumber' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'in_stock' ? 'bg-green-100 text-green-800' :
          row.status === 'sold' ? 'bg-blue-100 text-blue-800' :
          row.status === 'in_repair' ? 'bg-yellow-100 text-yellow-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {row.status.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    { 
      header: 'Purchase Price', 
      render: (row) => `TZS ${row.purchasePrice.toLocaleString()}`
    },
    { 
      header: 'Supplier', 
      render: (row) => row.supplier?.name || 'N/A'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FiEdit />
          </button>
          {row.status === 'in_stock' && (
            <button
              onClick={() => window.open(`/contracts?create=sale&motorcycle=${row._id}`, '_blank')}
              className="text-green-600 hover:text-green-800"
              title="Create Sale Contract"
            >
              <FiFileText />
            </button>
          )}
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
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
        <h1 className="text-3xl font-bold text-gray-900">Motorcycles</h1>
        <Button onClick={() => setModalOpen(true)}>
          <FiPlus className="inline mr-2" />
          Add Motorcycle
        </Button>
      </div>

      <Card>
        <TableWithSearch 
          columns={columns} 
          data={motorcycles}
          searchKeys={['brand', 'model', 'chassisNumber', 'engineNumber', 'color', 'supplier.name']}
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingMotorcycle ? 'Edit Motorcycle' : 'Add New Motorcycle'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chassis Number"
              value={formData.chassisNumber}
              onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
              required
            />
            <Input
              label="Engine Number"
              value={formData.engineNumber}
              onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
              required
            />
            <Input
              label="Brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
            />
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
            <Input
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
            />
            <Input
              label="Purchase Price"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              required
            />
            <Input
              label="Selling Price"
              type="number"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            />
            <Select
              label="Supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              options={suppliers.map(s => ({ value: s._id, label: s.name }))}
              required
            />
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'in_stock', label: 'In Stock' },
                { value: 'sold', label: 'Sold' },
                { value: 'in_repair', label: 'In Repair' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'reserved', label: 'Reserved' }
              ]}
            />
            <Input
              label="Registration Number"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
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
              {editingMotorcycle ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Motorcycles;


