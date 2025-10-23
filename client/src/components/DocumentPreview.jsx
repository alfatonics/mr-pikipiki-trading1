import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiZoomIn, FiZoomOut, FiRotateCw, FiFileText, FiImage } from 'react-icons/fi';

const DocumentPreview = ({ isOpen, onClose, documentUrl, documentName, documentType = 'pdf' }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && documentUrl) {
      setLoading(true);
      setError(null);
    }
  }, [isOpen, documentUrl]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setZoom(100);
    setRotation(0);
    setLoading(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-75" onClick={handleClose}></div>
      
      {/* Modal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {documentType === 'pdf' ? (
                <FiFileText className="w-6 h-6 text-red-500" />
              ) : (
                <FiImage className="w-6 h-6 text-blue-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {documentName || 'Document Preview'}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {documentType.toUpperCase()} Document
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="Zoom Out"
                >
                  <FiZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="Zoom In"
                >
                  <FiZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>

              {/* Rotate Control */}
              <button
                onClick={handleRotate}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Rotate"
              >
                <FiRotateCw className="w-4 h-4" />
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Download Document"
              >
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Close Preview"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading document...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Error</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {documentType === 'pdf' && documentUrl && (
              <div className="h-full w-full">
                <iframe
                  src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=${zoom}&view=FitH`}
                  className="w-full h-full border-0"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load PDF document. Please try downloading instead.');
                  }}
                  title="PDF Preview"
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              </div>
            )}

            {documentType === 'image' && documentUrl && (
              <div className="h-full w-full flex items-center justify-center p-4">
                <img
                  src={documentUrl}
                  alt={documentName || 'Document'}
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                    transition: 'transform 0.3s ease'
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load image document. Please try downloading instead.');
                  }}
                />
              </div>
            )}

            {documentType === 'other' && documentUrl && (
              <div className="h-full w-full flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Preview Not Available</h3>
                  <p className="text-gray-600 mb-4">
                    This document type cannot be previewed in the browser.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <FiDownload className="w-5 h-5" />
                    <span>Download Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Zoom: {zoom}%</span>
                {rotation > 0 && <span>Rotation: {rotation}°</span>}
              </div>
              <div className="flex items-center space-x-4">
                <span>Use mouse wheel to scroll</span>
                <span>•</span>
                <span>Click and drag to pan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
