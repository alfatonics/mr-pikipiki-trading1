import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import TableWithSearch from '../components/TableWithSearch';
import { 
  FiPlus, FiEdit, FiCheck, FiPlay, FiCheckCircle, FiXCircle, 
  FiClipboard, FiClock, FiEye, FiX 
} from 'react-icons/fi';

const Repairs = () => {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [selectedRepair, setSelectedRepair] = useState(null);
  
  const [formData, setFormData] = useState({
    motorcycle: '',
    mechanic: '',
    description: '',
    repairType: 'routine_maintenance',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [detailsData, setDetailsData] = useState({
    spareParts: [{ name: '', quantity: 1, cost: 0 }],
    laborHours: 0,
    laborCost: 0,
    workDescription: '',
    issuesFound: '',
    recommendations: ''
  });

  useEffect(() => {
    fetchRepairs();
    fetchData();
  }, []);


  const fetchRepairs = async () => {
    try {
      const response = await axios.get('/api/repairs');
      setRepairs(response.data);
    } catch (error) {
      console.error('Error fetching repairs:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [bikesRes, mechanicsRes] = await Promise.all([
        axios.get('/api/motorcycles'),
        axios.get('/api/users/by-role/mechanic')
      ]);
      setMotorcycles(bikesRes.data);
      setMechanics(mechanicsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Helper function to get initial form data
  const getInitialFormData = () => {
    return {
      motorcycle: '',
      mechanic: '',
      description: '',
      repairType: 'routine_maintenance',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.motorcycle) {
      alert('Please select a motorcycle');
      return;
    }
    
    if (!formData.mechanic) {
      alert('Please select a mechanic to assign this repair');
      return;
    }
    
    if (!formData.description || formData.description.trim() === '') {
      alert('Please provide a repair description');
      return;
    }
    
    try {
      console.log('Submitting repair assignment:', formData);
      
      if (editingRepair) {
        // Update repair assignment (no costs involved)
        const response = await axios.put(`/api/repairs/${editingRepair._id}`, formData);
        console.log('Repair updated successfully:', response.data);
        alert('Repair assignment updated successfully!');
      } else {
        // Create new repair assignment (NO costs - just assignment)
        const response = await axios.post('/api/repairs', formData);
        console.log('Repair created successfully:', response.data);
        alert('Repair assigned successfully!\n\nMechanic can now work on it and register details.');
      }
      
      fetchRepairs();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving repair:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save repair';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleStartWork = async (repairId) => {
    if (window.confirm('Start working on this repair?')) {
      try {
        await axios.post(`/api/repairs/${repairId}/start-work`);
        fetchRepairs();
        alert('Repair status changed to In Progress. You can now start working!');
      } catch (error) {
        alert('Failed to start repair: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleRegisterDetails = (repair) => {
    setSelectedRepair(repair);
    setDetailsData({
      spareParts: [{ name: '', quantity: 1, cost: 0 }],
      laborHours: 0,
      laborCost: 0,
      workDescription: '',
      issuesFound: '',
      recommendations: ''
    });
    setDetailsModalOpen(true);
  };

  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    
    if (!detailsData.workDescription || detailsData.workDescription.trim() === '') {
      alert('Please provide a work description');
      return;
    }
    
    if (parseFloat(detailsData.laborCost) <= 0) {
      alert('Please enter labor cost');
      return;
    }
    
    try {
      const response = await axios.post(`/api/repairs/${selectedRepair._id}/register-details`, detailsData);
      console.log('Repair details submitted:', response.data);
      
      fetchRepairs();
      setDetailsModalOpen(false);
      alert('Repair details submitted for approval!\n\nYour repair costs will be reviewed by Sales → Admin');
    } catch (error) {
      console.error('Error submitting details:', error);
      alert('Failed to submit details: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleMarkComplete = async (repairId) => {
    if (window.confirm('Mark this repair as completed?\n\nThe motorcycle will be returned to stock.')) {
      try {
        await axios.post(`/api/repairs/${repairId}/complete`);
        fetchRepairs();
        alert('Repair marked as completed! Motorcycle is now back in stock.');
      } catch (error) {
        alert('Failed to complete repair: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleStatusChange = async (repairId, newStatus) => {
    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    if (window.confirm(`Change repair status to "${statusLabels[newStatus]}"?`)) {
      try {
        if (newStatus === 'completed') {
          await axios.post(`/api/repairs/${repairId}/complete`);
        } else {
          await axios.put(`/api/repairs/${repairId}`, { status: newStatus });
        }
        fetchRepairs();
        alert(`Repair status changed to "${statusLabels[newStatus]}" successfully!`);
      } catch (error) {
        console.error('Error changing repair status:', error);
        alert('Failed to change repair status');
      }
    }
  };

  const handleEdit = (repair) => {
    setEditingRepair(repair);
    setFormData({
      motorcycle: repair.motorcycle._id,
      mechanic: repair.mechanic._id,
      description: repair.description,
      repairType: repair.repairType,
      startDate: new Date(repair.startDate).toISOString().split('T')[0],
      laborCost: repair.laborCost,
      spareParts: repair.spareParts || [],
      notes: repair.notes || '',
      status: repair.status || 'pending'
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRepair(null);
    setFormData(getInitialFormData());
  };

  const addSparePartRow = () => {
    setDetailsData({
      ...detailsData,
      spareParts: [...detailsData.spareParts, { name: '', quantity: 1, cost: 0 }]
    });
  };

  const removeSparePartRow = (index) => {
    const newParts = detailsData.spareParts.filter((_, i) => i !== index);
    setDetailsData({ ...detailsData, spareParts: newParts });
  };

  const updateSparePart = (index, field, value) => {
    const newParts = [...detailsData.spareParts];
    newParts[index][field] = value;
    setDetailsData({ ...detailsData, spareParts: newParts });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      awaiting_details_approval: { color: 'bg-orange-100 text-orange-800', label: 'Awaiting Approval' },
      details_approved: { color: 'bg-purple-100 text-purple-800', label: 'Details Approved' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const badge = badges[status] || badges.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Motorcycle', 
      render: (row) => `${row.motorcycle?.brand} ${row.motorcycle?.model}` 
    },
    { 
      header: 'Mechanic', 
      render: (row) => row.mechanic?.fullName || 'N/A'
    },
    { 
      header: 'Type', 
      render: (row) => row.repairType.replace('_', ' ').toUpperCase()
    },
    { header: 'Description', accessor: 'description' },
    { 
      header: 'Cost', 
      render: (row) => `TZS ${row.totalCost.toLocaleString()}`
    },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
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
          
          {/* Start Work button - for pending repairs */}
          {row.status === 'pending' && (user?.role === 'mechanic' || user?.role === 'admin') && (
            <button
              onClick={() => handleStatusChange(row._id, 'in_progress')}
              className="text-orange-600 hover:text-orange-800"
              title="Start Work"
            >
              <FiPlay />
            </button>
          )}
          
          {/* Register Details button - for in_progress repairs */}
          {row.status === 'in_progress' && (user?.role === 'mechanic' || user?.role === 'admin') && (
            <button
              onClick={() => handleRegisterDetails(row)}
              className="text-purple-600 hover:text-purple-800"
              title="Register Repair Details"
            >
              <FiClipboard />
            </button>
          )}
          
          {/* Awaiting approval indicator */}
          {row.status === 'awaiting_details_approval' && (
            <button
              className="text-orange-600 cursor-not-allowed"
              title="Awaiting approval from Sales → Admin"
              disabled
            >
              <FiClock />
            </button>
          )}
          
          {/* Mark Complete button - for details_approved repairs */}
          {row.status === 'details_approved' && (user?.role === 'mechanic' || user?.role === 'admin') && (
            <button
              onClick={() => handleMarkComplete(row._id)}
              className="text-green-600 hover:text-green-800"
              title="Mark as Completed"
            >
              <FiCheckCircle />
            </button>
          )}
          
          {/* Cancel button - for non-completed repairs */}
          {row.status !== 'completed' && row.status !== 'cancelled' && user?.role === 'admin' && (
            <button
              onClick={() => handleStatusChange(row._id, 'cancelled')}
              className="text-red-600 hover:text-red-800"
              title="Cancel Repair"
            >
              <FiXCircle />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Repairs & Maintenance</h1>
        <Button onClick={() => {
          setFormData(getInitialFormData());
          setModalOpen(true);
        }}>
          <FiPlus className="inline mr-2" />
          Add Repair
        </Button>
      </div>

      <Card>
        <TableWithSearch 
          columns={columns} 
          data={repairs}
          searchKeys={['description', 'motorcycle.brand', 'motorcycle.model', 'motorcycle.chassisNumber', 'mechanic.fullName', 'repairType']}
        />
      </Card>

      {/* Add/Edit Repair Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingRepair ? 'Edit Repair' : 'Add New Repair'}
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
            label="Assign to Mechanic"
            value={formData.mechanic}
            onChange={(e) => setFormData({ ...formData, mechanic: e.target.value })}
            options={mechanics.map(m => ({ 
              value: m._id, 
              label: m.fullName 
            }))}
            required
          />
          <Select
            label="Repair Type"
            value={formData.repairType}
            onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
            options={[
              { value: 'routine_maintenance', label: 'Routine Maintenance' },
              { value: 'engine_repair', label: 'Engine Repair' },
              { value: 'body_repair', label: 'Body Repair' },
              { value: 'electrical', label: 'Electrical' },
              { value: 'other', label: 'Other' }
            ]}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Special instructions or notes for the mechanic..."
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg mt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Costs will be registered by the mechanic after completing the work. This form is just to assign the repair job.
            </p>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRepair ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Register Repair Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Register Repair Details"
        size="lg"
      >
        <form onSubmit={handleSubmitDetails}>
          {/* Spare Parts Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Spare Parts Used</label>
              <button
                type="button"
                onClick={addSparePartRow}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                + Add Part
              </button>
            </div>
            
            {detailsData.spareParts.map((part, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Part name"
                    value={part.name}
                    onChange={(e) => updateSparePart(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(index, 'quantity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    placeholder="Cost (TZS)"
                    value={part.cost}
                    onChange={(e) => updateSparePart(index, 'cost', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="0"
                  />
                </div>
                <div className="col-span-1">
                  {detailsData.spareParts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSparePartRow(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Labor Information */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Labor Hours *"
              type="number"
              step="0.5"
              value={detailsData.laborHours}
              onChange={(e) => setDetailsData({ ...detailsData, laborHours: e.target.value })}
              required
            />
            <Input
              label="Labor Cost (TZS) *"
              type="number"
              value={detailsData.laborCost}
              onChange={(e) => setDetailsData({ ...detailsData, laborCost: e.target.value })}
              required
            />
          </div>

          {/* Work Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Description *</label>
            <textarea
              value={detailsData.workDescription}
              onChange={(e) => setDetailsData({ ...detailsData, workDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Describe what work was done..."
              required
            />
          </div>

          {/* Issues Found */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Issues Found (Optional)</label>
            <textarea
              value={detailsData.issuesFound}
              onChange={(e) => setDetailsData({ ...detailsData, issuesFound: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Any issues discovered during repair..."
            />
          </div>

          {/* Recommendations */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations (Optional)</label>
            <textarea
              value={detailsData.recommendations}
              onChange={(e) => setDetailsData({ ...detailsData, recommendations: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Future maintenance recommendations..."
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These details will be sent for approval (Sales → Admin) before the repair can be marked as complete.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setDetailsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Repairs;
