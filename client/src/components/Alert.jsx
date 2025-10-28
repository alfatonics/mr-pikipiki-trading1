import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const Alert = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  showCancel = false, 
  onConfirm, 
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  if (!isOpen) return null;

  // Auto close after delay if enabled
  if (autoClose) {
    setTimeout(() => {
      onClose();
    }, autoCloseDelay);
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <FiXCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
      default:
        return <FiInfo className="w-6 h-6 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-200',
          bg: 'bg-green-50',
          button: 'bg-green-600 hover:bg-green-700 text-white',
          cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
        };
      case 'error':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
        };
      case 'warning':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
        };
      case 'info':
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
        };
    }
  };

  const colors = getColorClasses();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Alert Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full max-w-md">
          <div className={`bg-white px-4 py-3 sm:px-6 sm:py-4 border-b ${colors.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getIcon()}
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
          
          <div className={`px-4 py-3 sm:px-6 sm:py-4 ${colors.bg}`}>
            <div className="text-sm text-gray-700 mb-4">
              {message}
            </div>
            
            <div className="flex justify-end space-x-3">
              {showCancel && (
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${colors.cancelButton}`}
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${colors.button}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
