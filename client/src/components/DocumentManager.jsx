import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEye, FiDownload, FiFileText, FiImage, FiX, FiUpload } from 'react-icons/fi';
import DocumentPreview from './DocumentPreview';

const DocumentManager = ({ contractId, isOpen, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    if (isOpen && contractId) {
      fetchDocuments();
    }
  }, [isOpen, contractId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/contracts/${contractId}/documents`);
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (document) => {
    try {
      const documentType = getDocumentType(document.originalName);
      
      // Fetch the document content with authentication
      const response = await axios.get(`/api/contracts/${contractId}/documents/${document._id}/preview`, {
        responseType: 'blob',
        timeout: 30000
      });
      
      if (response.status === 200 && response.data) {
        // Create blob URL for preview
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
        const blobUrl = window.URL.createObjectURL(blob);
        
        setPreviewDocument({
          url: blobUrl,
          name: document.originalName,
          type: documentType
        });
        setPreviewModalOpen(true);
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      alert('Failed to preview document. Please try again.');
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(`/api/contracts/${contractId}/documents/${document._id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const getDocumentType = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
  };

  const getDocumentIcon = (document) => {
    const type = getDocumentType(document.originalName);
    if (type === 'pdf') return <FiFileText className="w-5 h-5 text-red-500" />;
    if (type === 'image') return <FiImage className="w-5 h-5 text-blue-500" />;
    return <FiFileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        {/* Modal */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Contract Documents</h3>
                <p className="text-sm text-gray-500">View and manage contract documents</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading documents...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Documents</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                      onClick={fetchDocuments}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents</h3>
                    <p className="text-gray-600">No documents have been uploaded for this contract yet.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((document) => (
                      <div
                        key={document._id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getDocumentIcon(document)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {document.originalName}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {document.type?.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown date'}
                            </p>
                            {document.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {document.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePreview(document)}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Preview Document"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(document)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download Document"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} found
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={fetchDocuments}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={previewModalOpen}
        onClose={() => {
          // Clean up blob URL to prevent memory leaks
          if (previewDocument?.url && previewDocument.url.startsWith('blob:')) {
            window.URL.revokeObjectURL(previewDocument.url);
          }
          setPreviewModalOpen(false);
          setPreviewDocument(null);
        }}
        documentUrl={previewDocument?.url}
        documentName={previewDocument?.name}
        documentType={previewDocument?.type}
      />
    </>
  );
};

export default DocumentManager;
