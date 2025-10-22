import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import TableWithSearch from '../components/TableWithSearch';
import { FiPlus, FiEdit, FiCheck } from 'react-icons/fi';

const Transport = () => {
  const [transports, setTransports] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    motorcycle: '',
    customer: '',
    driver: '',
    pickupLocation: 'MR PIKIPIKI TRADING - Ubungo Riverside',
    deliveryLocation: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    transportCost: 0,
    notes: ''
  });

  useEffect(() => {
    fetchTransports();
    fetchData();
  }, []);

  const fetchTransports = async () => {
    try {
      const response = await axios.get('/api/transport');
      setTransports(response.data);
    } catch (error) {
      console.error('Error fetching transports:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [bikesRes, customersRes, driversRes] = await Promise.all([
        axios.get('/api/motorcycles?status=sold'),
        axios.get('/api/customers'),
        axios.get('/api/users/by-role/transport')
      ]);
      setMotorcycles(bikesRes.data);
      setCustomers(customersRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transport', formData);
      fetchTransports();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create transport record');
    }
  };

  const handleDeliver = async (id) => {
    if (window.confirm('Mark this delivery as completed?')) {
      try {
        await axios.post(`/api/transport/${id}/deliver`, {});
        fetchTransports();
      } catch (error) {
        alert('Failed to mark as delivered');
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData({
      motorcycle: '',
      customer: '',
      driver: '',
      pickupLocation: 'MR PIKIPIKI TRADING - Ubungo Riverside',
      deliveryLocation: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      transportCost: 0,
      notes: ''
    });
  };

  const columns = [
    { 
      header: 'Motorcycle', 
      render: (row) => `${row.motorcycle?.brand} ${row.motorcycle?.model}` 
    },
    { 
      header: 'Customer', 
      render: (row) => row.customer?.fullName || 'N/A'
    },
    { 
      header: 'Driver', 
      render: (row) => row.driver?.fullName || 'N/A'
    },
    { header: 'Delivery Location', accessor: 'deliveryLocation' },
    { 
      header: 'Scheduled Date', 
      render: (row) => new Date(row.scheduledDate).toLocaleDateString()
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          row.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
          row.status === 'delivered' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {row.status.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          {row.status !== 'delivered' && (
            <button
              onClick={() => handleDeliver(row._id)}
              className="text-green-600 hover:text-green-800"
              title="Mark as Delivered"
            >
              <FiCheck />
            </button>
          )}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">Transport & Delivery</h1>
            <p className="text-gray-600">Schedule and manage motorcycle deliveries</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <FiPlus className="inline mr-2" />
            Schedule Transport
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <Card>
          <TableWithSearch 
            columns={columns} 
            data={transports}
            searchKeys={['motorcycle.brand', 'motorcycle.model', 'customer.fullName', 'driver.fullName', 'pickupLocation', 'deliveryLocation']}
          />
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Schedule Transport"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
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
            label="Customer"
            value={formData.customer}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            options={customers.map(c => ({ 
              value: c._id, 
              label: `${c.fullName} - ${c.phone}` 
            }))}
            required
          />
          <Select
            label="Driver"
            value={formData.driver}
            onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
            options={drivers.map(d => ({ 
              value: d._id, 
              label: d.fullName 
            }))}
            required
          />
          <Input
            label="Pickup Location"
            value={formData.pickupLocation}
            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
            required
          />
          <Input
            label="Delivery Location"
            value={formData.deliveryLocation}
            onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
            required
          />
          <Input
            label="Scheduled Date"
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            required
          />
          <Input
            label="Transport Cost (TZS)"
            type="number"
            value={formData.transportCost}
            onChange={(e) => setFormData({ ...formData, transportCost: e.target.value })}
          />
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
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transport;


