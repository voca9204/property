import { useState } from 'react';
import PropTypes from 'prop-types';
import FileUploader from './FileUploader';
import { usePropertyImageUpload } from '../../hooks';

/**
 * PropertyImageUploader component for uploading property images
 */
const PropertyImageUploader = ({
  propertyId,
  onImagesUploaded,
  className = '',
  maxFiles = 10,
  maxSize = 5242880, // 5MB
  showExistingImages = true
}) => {
  const {
    uploadImages,
    getPropertyImages,
    deleteImage,
    uploading,
    progress,
    error,
    images
  } = usePropertyImageUpload();
  
  const [uploadError, setUploadError] = useState(null);
  
  // Load existing images when property ID changes
  useState(() => {
    if (propertyId && showExistingImages) {
      loadExistingImages();
    }
  }, [propertyId]);
  
  /**
   * Load existing property images
   */
  const loadExistingImages = async () => {
    if (!propertyId) return;
    
    try {
      await getPropertyImages(propertyId);
    } catch (err) {
      console.error('Error loading existing images:', err);
      setUploadError('Failed to load existing images');
    }
  };
  
  /**
   * Handle file upload
   * @param {Array<File>} files - Files to upload
   */
  const handleUpload = async (files) => {
    if (!propertyId) {
      setUploadError('Property ID is required');
      return;
    }
    
    try {
      setUploadError(null);
      const results = await uploadImages(files, propertyId);
      
      if (onImagesUploaded) {
        onImagesUploaded(results);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setUploadError(err.message || 'Failed to upload images');
    }
  };
  
  /**
   * Handle image deletion
   * @param {string} path - Image path
   */
  const handleDeleteImage = async (path) => {
    try {
      await deleteImage(path);
    } catch (err) {
      console.error('Error deleting image:', err);
      setUploadError('Failed to delete image');
    }
  };
  
  return (
    <div className={className}>
      {/* Upload component */}
      <FileUploader
        onUploadStart={handleUpload}
        onUploadError={(error) => setUploadError(error.message)}
        multiple={true}
        accept="image/*"
        maxSize={maxSize}
        maxFiles={maxFiles}
        label="Upload Property Images"
        showPreview={true}
        disabled={uploading || !propertyId}
      />
      
      {/* Upload progress */}
      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading: {Math.round(progress)}%
          </p>
        </div>
      )}
      
      {/* Error message */}
      {(error || uploadError) && (
        <div className="mt-2 text-sm text-red-600">
          {error?.message || uploadError}
        </div>
      )}
      
      {/* Existing images */}
      {showExistingImages && images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Property Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.fullPath || index} className="relative group">
                <img
                  src={image.url}
                  alt={`Property ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image.fullPath)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

PropertyImageUploader.propTypes = {
  propertyId: PropTypes.string.isRequired,
  onImagesUploaded: PropTypes.func,
  className: PropTypes.string,
  maxFiles: PropTypes.number,
  maxSize: PropTypes.number,
  showExistingImages: PropTypes.bool
};

export default PropertyImageUploader;
