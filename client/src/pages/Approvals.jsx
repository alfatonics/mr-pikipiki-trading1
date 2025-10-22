import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TableWithSearch from '../components/TableWithSearch';
import { FiCheck, FiX, FiEye, FiClock, FiAlertCircle } from 'react-icons/fi';

const Approvals = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject'
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [filter, user]);

  const fetchApprovals = async () => {
    try {
      const params = {};
      
      if (filter !== 'all') {
        if (filter === 'pending') {
          // For sales: show pending_sales (need their action)
          // For admin: show pending_admin (need their action)
          params.status = user?.role === 'admin' ? 'pending_admin' : 'pending_sales';
        } else if (filter === 'awaiting_admin') {
          // Sales can see requests they approved that are now awaiting admin
          params.status = 'pending_admin';
        } else {
          params.status = filter;
        }
      }
      
      const response = await axios.get('/api/approvals', { params });
      setApprovals(response.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const handleView = (approval) => {
    setSelectedApproval(approval);
    setModalOpen(true);
    setActionType(null);
    setComments('');
    setRejectionReason('');
  };

  const handleApprove = async () => {
    try {
      const endpoint = user.role === 'admin' 
        ? `/api/approvals/${selectedApproval._id}/admin-approve`
        : `/api/approvals/${selectedApproval._id}/sales-approve`;
      
      await axios.post(endpoint, { comments });
      
      fetchApprovals();
      setModalOpen(false);
      alert(user.role === 'admin' 
        ? 'Approved and executed successfully!' 
        : 'Approved and forwarded to admin!');
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await axios.post(`/api/approvals/${selectedApproval._id}/reject`, {
        reason: rejectionReason
      });
      
      fetchApprovals();
      setModalOpen(false);
      alert('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_sales: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Sales' },
      pending_admin: { color: 'bg-blue-100 text-blue-800', label: 'Pending Admin' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    const badge = badges[status] || badges.pending_sales;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
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

  const columns = [
    {
      header: 'Type',
      render: (row) => getTypeLabel(row.approvalType)
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Requested By',
      render: (row) => row.requestedBy?.fullName || 'N/A'
    },
    {
      header: 'Status',
      render: (row) => (
        <div>
          {getStatusBadge(row.status)}
          {/* Show sales approver when in awaiting_admin tab */}
          {filter === 'awaiting_admin' && row.salesApprovedBy && (
            <div className="text-xs text-gray-600 mt-1">
              Approved by: {row.salesApprovedBy.fullName}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Date',
      render: (row) => (
        <div>
          <div>{new Date(row.createdAt).toLocaleDateString()}</div>
          {/* Show approval date when in awaiting_admin tab */}
          {filter === 'awaiting_admin' && row.salesApprovedAt && (
            <div className="text-xs text-green-600">
              Sales: {new Date(row.salesApprovedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row)}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <FiEye />
          </button>
          
          {/* Show approve/reject buttons only for pending items */}
          {((row.status === 'pending_sales' && user?.role === 'sales') ||
            (row.status === 'pending_admin' && user?.role === 'admin')) && (
            <>
              <button
                onClick={() => {
                  setSelectedApproval(row);
                  setActionType('approve');
                  setModalOpen(true);
                }}
                className="text-green-600 hover:text-green-800"
                title="Approve"
              >
                <FiCheck />
              </button>
              <button
                onClick={() => {
                  setSelectedApproval(row);
                  setActionType('reject');
                  setModalOpen(true);
                }}
                className="text-red-600 hover:text-red-800"
                title="Reject"
              >
                <FiX />
              </button>
            </>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans tracking-tight">Approval Requests</h1>
            {user?.role === 'sales' && (
              <p className="text-gray-600">
                Review requests → Approve/Reject → Track in "Awaiting Admin" until final approval
              </p>
            )}
            {user?.role === 'admin' && (
              <p className="text-gray-600">
                Final approval for requests already reviewed by Sales team
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">

      {/* Info Card for Sales */}
      {user?.role === 'sales' && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-blue-600 text-xl mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Sales Approval Workflow</h3>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Step 1:</strong> Review requests in "Pending My Review" tab<br />
                <strong>Step 2:</strong> Approve or reject with comments<br />
                <strong>Step 3:</strong> After approval, track in "Awaiting Admin" tab to see when Admin makes final decision<br />
                <strong>Step 4:</strong> Once Admin approves, find in "Approved" tab with full execution details
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiClock className="inline mr-2" />
            {user?.role === 'admin' ? 'Pending My Approval' : 'Pending My Review'}
          </button>
          
          {/* Awaiting Admin tab - only for Sales */}
          {user?.role === 'sales' && (
            <button
              onClick={() => setFilter('awaiting_admin')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'awaiting_admin'
                  ? 'bg-primary-600 text-white'
                  : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
              }`}
            >
              <FiAlertCircle className="inline mr-2" />
              Awaiting Admin
            </button>
          )}
          
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

      <Card>
        <TableWithSearch 
          columns={columns} 
          data={approvals}
          searchKeys={['description', 'approvalType', 'requestedBy.fullName', 'requestedBy.username']}
        />
      </Card>

      {/* Detail/Action Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedApproval(null);
          setActionType(null);
          setComments('');
          setRejectionReason('');
        }}
        title={
          actionType === 'approve' ? 'Approve Request' :
          actionType === 'reject' ? 'Reject Request' :
          'Approval Details'
        }
        size="lg"
      >
        {selectedApproval && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-gray-900">{getTypeLabel(selectedApproval.approvalType)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                {getStatusBadge(selectedApproval.status)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Requested By</label>
                <p className="text-gray-900">{selectedApproval.requestedBy?.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">{new Date(selectedApproval.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900">{selectedApproval.description}</p>
            </div>

            {/* Proposed Changes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Changes</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(selectedApproval.proposedData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Approval History */}
            {selectedApproval.salesApprovedBy && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✓ Sales Approved by {selectedApproval.salesApprovedBy?.fullName}
                </p>
                {selectedApproval.salesComments && (
                  <p className="text-sm text-green-700 mt-1">{selectedApproval.salesComments}</p>
                )}
              </div>
            )}

            {selectedApproval.adminApprovedBy && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✓ Admin Approved by {selectedApproval.adminApprovedBy?.fullName}
                </p>
                {selectedApproval.adminComments && (
                  <p className="text-sm text-green-700 mt-1">{selectedApproval.adminComments}</p>
                )}
              </div>
            )}

            {selectedApproval.rejectedBy && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  ✗ Rejected by {selectedApproval.rejectedBy?.fullName}
                </p>
                <p className="text-sm text-red-700 mt-1">{selectedApproval.rejectionReason}</p>
              </div>
            )}

            {/* Action Forms */}
            {actionType === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Add any comments..."
                />
              </div>
            )}

            {actionType === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Explain why this request is being rejected..."
                  required
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setModalOpen(false);
                  setActionType(null);
                }}
              >
                {actionType ? 'Cancel' : 'Close'}
              </Button>

              {actionType === 'approve' && (
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  <FiCheck className="inline mr-2" />
                  Approve
                </Button>
              )}

              {actionType === 'reject' && (
                <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                  <FiX className="inline mr-2" />
                  Reject
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default Approvals;

