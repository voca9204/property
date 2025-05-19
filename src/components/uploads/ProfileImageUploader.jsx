import { useState } from 'react';
import PropTypes from 'prop-types';
import FileUploader from './FileUploader';
import { useProfileImageUpload } from '../../hooks';

/**
 * ProfileImageUploader component for uploading profile images
 */
const ProfileImageUploader = ({
  userId,
  onImageUploaded,
  className = '',
  maxSize = 5242880, // 5MB
  showExistingImage = true
}) => {
  const {
    uploadProfileImage,
    getProfileImageURL,
    deleteProfileImage,
    uploading,
    progress,
    error,
    profileUrl
  } = useProfileImageUpload();
  
  const [uploadError, setUploadError] = useState(null);
  
  // Load existing profile image when user ID changes
  useState(() => {
    if (userId && showExistingImage) {
      loadExistingImage();
    }
  }, [userId]);
  
  /**
   * Load existing profile image
   */
  const loadExistingImage = async () => {
    if (!userId) return;
    
    try {
      await getProfileImageURL(userId);
    } catch (err) {
      console.error('Error loading profile image:', err);
      setUploadError('Failed to load profile image');
    }
  };
  
  /**
   * Handle file upload
   * @param {Array<File>} files - Files to upload
   */
  const handleUpload = async (files) => {
    if (!userId) {
      setUploadError('User ID is required');
      return;
    }
    
    if (!files || files.length === 0) {
      return;
    }
    
    try {
      setUploadError(null);
      const result = await uploadProfileImage(files[0], userId);
      
      if (onImageUploaded) {
        onImageUploaded(result);
      }
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setUploadError(err.message || 'Failed to upload profile image');
    }
  };
  
  /**
   * Handle image deletion
   */
  const handleDeleteImage = async () => {
    if (!userId) return;
    
    try {
      await deleteProfileImage(userId);
    } catch (err) {
      console.error('Error deleting profile image:', err);
      setUploadError('Failed to delete profile image');
    }
  };
  
  return (
    <div className={className}>
      {/* Current profile image */}
      {showExistingImage && profileUrl && (
        <div className="mb-4 flex items-center">
          <div className="relative group w-32 h-32">
            <img
              src={profileUrl}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-full border border-gray-200"
            />
            <button
              type="button"
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDeleteImage}
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
          <div className="ml-4">
            <p className="text-sm text-gray-600">
              Current profile photo
            </p>
          </div>
        </div>
      )}
      
      {/* Upload component */}
      <FileUploader
        onUploadStart={handleUpload}
        onUploadError={(error) => setUploadError(error.message)}
        multiple={false}
        accept="image/*"
        maxSize={maxSize}
        label="Upload Profile Photo"
        showPreview={true}
        disabled={uploading || !userId}
        uploaderClassName="p-4 flex flex-col items-center justify-center"
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            Click to upload a profile photo
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </FileUploader>
      
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
    </div>
  );
};

ProfileImageUploader.propTypes = {
  userId: PropTypes.string.isRequired,
  onImageUploaded: PropTypes.func,
  className: PropTypes.string,
  maxSize: PropTypes.number,
  showExistingImage: PropTypes.bool
};

export default ProfileImageUploader;
