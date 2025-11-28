import { useState, useRef, useEffect } from "react";
import { FiCamera, FiImage, FiX, FiChevronDown } from "react-icons/fi";

const ImageUploader = ({ label, value, onChange, disabled = false }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const filesInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    setShowMenu(false);
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleFilesClick = () => {
    filesInputRef.current?.click();
  };

  const startCamera = async () => {
    setShowMenu(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Back camera for mobile
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Haiwezekani kufungua kamera. Hakikisha umeipa ruhusa ya kutumia kamera."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      onChange(dataUrl);
      stopCamera();
    }
  };

  const removeImage = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (disabled) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        {value ? (
          <div className="relative inline-block">
            <img
              src={value}
              alt="Preview"
              className="max-w-full h-32 object-contain border border-gray-300 rounded"
            />
          </div>
        ) : (
          <span className="text-gray-400 text-sm">N/A</span>
        )}
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value && (
        <div className="mb-3 relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-32 object-contain border border-gray-300 rounded"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            title="Futa picha"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {!showCamera ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-semibold"
          >
            <FiImage className="w-4 h-4" />
            Chagua Picha
            <FiChevronDown className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
              <button
                type="button"
                onClick={startCamera}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-sm"
              >
                <FiCamera className="w-4 h-4 text-green-600" />
                Piga Picha
              </button>
              <button
                type="button"
                onClick={handleGalleryClick}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-sm border-t border-gray-100"
              >
                <FiImage className="w-4 h-4 text-blue-600" />
                Gallery
              </button>
              <button
                type="button"
                onClick={handleFilesClick}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-sm border-t border-gray-100"
              >
                <FiImage className="w-4 h-4 text-blue-600" />
                Files
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-md mx-auto rounded"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex gap-2 mt-4 justify-center">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Chukua Picha
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
            >
              Ghairi
            </button>
          </div>
        </div>
      )}

      {/* Gallery input - for mobile gallery access */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Files input - for file system access */}
      <input
        ref={filesInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
