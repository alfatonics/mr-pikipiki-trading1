import { useState, useEffect, useRef } from 'react';
import { FiZoomIn, FiZoomOut, FiRotateCw, FiDownload, FiX } from 'react-icons/fi';

const PDFViewer = ({ documentUrl, documentName, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (documentUrl) {
      setLoading(true);
      setError(null);
    }
  }, [documentUrl]);

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
    link.download = documentName || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load PDF document. Please try downloading instead.');
  };

  // Add a timeout to handle cases where iframe doesn't load
  useEffect(() => {
    if (documentUrl && loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('PDF preview is taking too long to load. Please try downloading instead.');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [documentUrl, loading]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-75" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">PDF</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {documentName || 'PDF Document'}
                </h3>
                <p className="text-sm text-gray-500">PDF Document Preview</p>
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
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Close Preview"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden bg-gray-50 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF document...</p>
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
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download Instead
                  </button>
                </div>
              </div>
            )}

            {documentUrl && !error && (
              <div 
                className="h-full w-full overflow-auto"
                style={{ 
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.3s ease'
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={documentUrl}
                  className="w-full h-full border-0"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title="PDF Preview"
                  style={{
                    width: `${100 / (zoom / 100)}%`,
                    height: `${100 / (zoom / 100)}%`
                  }}
                />
              </div>
            )}

            {!documentUrl && !error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF document...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your document</p>
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
                <span>•</span>
                <span>Use mouse wheel to scroll</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Click and drag to pan</span>
                <span>•</span>
                <span>Use zoom controls to adjust view</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
