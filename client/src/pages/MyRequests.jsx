import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import TableWithSearch from '../components/TableWithSearch';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { FiEye, FiClock, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMyRequests();
  }, [filter]);

  const fetchMyRequests = async () => {
    try {
      const params = { requestedBy: user._id || user.id };
      
      if (filter !== 'all') {
        if (filter === 'pending') {
          params.status = 'pending_sales,pending_admin';
        } else {
          params.status = filter;
        }
      }
      
      const response = await axios.get('/api/approvals/my-requests', { params });
      setRequests(response.data);
    } catch (error) {
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_sales: { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'Pending Sales Review',
        icon: <FiClock className="inline mr-1" />
      },
      pending_admin: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Pending Admin Approval',
        icon: <FiClock className="inline mr-1" />
      },
      approved: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Approved & Completed',
        icon: <FiCheck className="inline mr-1" />
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        label: 'Rejected',
        icon: <FiX className="inline mr-1" />
      }
    };
    
    const badge = badges[status] || badges.pending_sales;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      sales_contract: 'Sales Contract',
      purchase_contract: 'Purchase Contract',
      motorcycle_price_change: 'Price Change',
      motorcycle_edit: 'Motorcycle Edit',
      contract_edit: 'Contract Edit',
      contract_delete: 'Contract Delete',
      repair_create: 'New Repair',
      repair_edit: 'Repair Cost Update',
      repair_complete: 'Repair Completion'
    };
    
    return labels[type] || type;
  };

  const getStatusDetails = (request) => {
    if (request.status === 'pending_sales') {
      return {
        icon: <FiClock className="text-yellow-600 text-2xl" />,
        title: 'Waiting for Sales Review',
        description: 'Your request has been submitted and is waiting for sales team approval.',
        nextStep: 'Sales team will review and approve/reject your request.'
      };
    } else if (request.status === 'pending_admin') {
      return {
        icon: <FiClock className="text-blue-600 text-2xl" />,
        title: 'Waiting for Admin Approval',
        description: 'Sales team has approved. Now waiting for final admin approval.',
        nextStep: 'Admin will review and make the final decision.'
      };
    } else if (request.status === 'approved') {
      return {
        icon: <FiCheck className="text-green-600 text-2xl" />,
        title: 'Approved & Completed',
        description: 'Your request has been approved by both sales and admin.',
        nextStep: 'The change has been executed in the system.'
      };
    } else if (request.status === 'rejected') {
      return {
        icon: <FiX className="text-red-600 text-2xl" />,
        title: 'Rejected',
        description: 'Your request has been rejected.',
        nextStep: 'Check the rejection reason below. You may submit a new request if needed.'
      };
    }
  };

  const columns = [
    {
      header: 'Type',
      render: (row) => (
        <div>
          <div className="font-medium">{getTypeLabel(row.approvalType)}</div>
          <div className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      )
    },
    { 
      header: 'Description', 
      accessor: 'description',
      render: (row) => (
        <div className="max-w-xs truncate" title={row.description}>
          {row.description}
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Priority',
      render: (row) => {
        const colors = {
          low: 'bg-gray-100 text-gray-800',
          medium: 'bg-blue-100 text-blue-800',
          high: 'bg-orange-100 text-orange-800',
          urgent: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors[row.priority] || colors.medium}`}>
            {row.priority.toUpperCase()}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleView(row)}
          className="text-blue-600 hover:text-blue-800"
          title="View Details"
        >
          <FiEye />
        </button>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Approval Requests</h1>
          <p className="text-gray-600 mt-1">Track the status of your submitted requests</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FiAlertCircle className="text-blue-600 text-xl mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">About Approval Requests</h3>
            <p className="text-sm text-blue-800 mt-1">
              Sensitive changes (like repairs with costs, price changes, contracts) require approval. 
              Your requests go through Sales review, then Admin final approval before being executed.
            </p>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiClock className="inline mr-2" />
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiCheck className="inline mr-2" />
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'rejected'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiX className="inline mr-2" />
            Rejected
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <FiAlertCircle className="text-gray-400 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No requests found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === 'pending' ? 'You have no pending approval requests' :
               filter === 'approved' ? 'You have no approved requests' :
               filter === 'rejected' ? 'You have no rejected requests' :
               'You haven\'t submitted any approval requests yet'}
            </p>
          </div>
        ) : (
          <TableWithSearch 
            columns={columns} 
            data={requests}
            searchKeys={['description', 'approvalType']}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center space-x-4">
                {getStatusDetails(selectedRequest).icon}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getStatusDetails(selectedRequest).title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getStatusDetails(selectedRequest).description}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 font-medium">
                    Next: {getStatusDetails(selectedRequest).nextStep}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Request Type</label>
                <p className="text-gray-900 mt-1">{getTypeLabel(selectedRequest.approvalType)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <p className="text-gray-900 mt-1 capitalize">{selectedRequest.priority}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted On</label>
                <p className="text-gray-900 mt-1">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900">{selectedRequest.description}</p>
            </div>

            {/* Proposed Changes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Changes</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap text-gray-700">
                  {JSON.stringify(selectedRequest.proposedData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Approval Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Approval Timeline</label>
              <div className="space-y-3">
                {/* Submitted */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Request Submitted</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Sales Review */}
                {selectedRequest.salesApprovedBy && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiCheck className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Sales Approved</p>
                      <p className="text-sm text-gray-600">
                        By {selectedRequest.salesApprovedBy?.fullName} on {new Date(selectedRequest.salesApprovedAt).toLocaleString()}
                      </p>
                      {selectedRequest.salesComments && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{selectedRequest.salesComments}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Review */}
                {selectedRequest.adminApprovedBy && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiCheck className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Admin Approved</p>
                      <p className="text-sm text-gray-600">
                        By {selectedRequest.adminApprovedBy?.fullName} on {new Date(selectedRequest.adminApprovedAt).toLocaleString()}
                      </p>
                      {selectedRequest.adminComments && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{selectedRequest.adminComments}"</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection */}
                {selectedRequest.rejectedBy && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <FiX className="text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Rejected</p>
                      <p className="text-sm text-gray-600">
                        By {selectedRequest.rejectedBy?.fullName} on {new Date(selectedRequest.rejectedAt).toLocaleString()}
                      </p>
                      <div className="bg-red-50 p-3 rounded mt-2">
                        <p className="text-sm font-medium text-red-800">Reason:</p>
                        <p className="text-sm text-red-700 mt-1">{selectedRequest.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending indicators */}
                {selectedRequest.status === 'pending_sales' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <FiClock className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Waiting for Sales Review</p>
                      <p className="text-sm text-gray-600">Sales team will review your request soon</p>
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'pending_admin' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiClock className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Waiting for Admin Approval</p>
                      <p className="text-sm text-gray-600">Admin will make the final decision</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6">
              <Button onClick={() => setModalOpen(false)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyRequests;

