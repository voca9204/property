import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * FileUploader component for uploading files
 */
const FileUploader = ({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onFilesSelected,
  multiple = false,
  accept = 'image/*',
  maxSize = 5242880, // 5MB
  maxFiles = 10,
  label = 'Upload Files',
  className = '',
  inputClassName = '',
  uploaderClassName = '',
  showPreview = true,
  uploadImmediately = false,
  disabled = false,
  children
}) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  /**
   * Handle file selection
   * @param {FileList} fileList - Selected files
   */
  const handleFileSelection = (fileList) => {
    setError(null);

    // Convert FileList to array
    const fileArray = Array.from(fileList);
    
    // Check number of files
    if (multiple && fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Filter files by size and type
    const validFiles = fileArray.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`);
        return false;
      }

      // Check file type
      if (accept !== '*' && !file.type.match(accept.replace(/\*/g, '.*'))) {
        setError(`File ${file.name} has an invalid type. Accepted: ${accept}`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Set selected files
    const newFiles = multiple ? [...files, ...validFiles] : validFiles;
    setFiles(newFiles);

    // Generate previews for images
    if (showPreview) {
      const newPreviews = validFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));

      setPreviews(prevPreviews => 
        multiple 
          ? [...prevPreviews, ...newPreviews] 
          : newPreviews
      );
    }

    // Call onFilesSelected callback
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }

    // Upload immediately if required
    if (uploadImmediately && onUploadStart) {
      onUploadStart(newFiles);
    }
  };

  /**
   * Handle file input change
   * @param {Event} e - Change event
   */
  const handleInputChange = (e) => {
    handleFileSelection(e.target.files);
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle drag events
   * @param {Event} e - Drag event
   * @param {boolean} isDragActive - Whether drag is active
   */
  const handleDrag = (e, isDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isDragActive);
  };

  /**
   * Handle file drop
   * @param {Event} e - Drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  /**
   * Remove a file
   * @param {number} index - File index
   */
  const removeFile = (index) => {
    // Remove file from files array
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    // Remove preview
    if (showPreview && previews[index]) {
      URL.revokeObjectURL(previews[index].url);
      const newPreviews = [...previews];
      newPreviews.splice(index, 1);
      setPreviews(newPreviews);
    }

    // Call onFilesSelected callback with updated files
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  /**
   * Open file dialog
   */
  const openFileDialog = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  /**
   * Trigger upload
   */
  const upload = () => {
    if (files.length > 0 && onUploadStart) {
      onUploadStart(files);
    }
  };

  /**
   * Clear all files
   */
  const clearFiles = () => {
    // Release preview URLs
    previews.forEach(preview => URL.revokeObjectURL(preview.url));
    
    setFiles([]);
    setPreviews([]);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Call onFilesSelected callback with empty array
    if (onFilesSelected) {
      onFilesSelected([]);
    }
  };

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        className={`hidden ${inputClassName}`}
        disabled={disabled}
      />

      {/* Drag area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${uploaderClassName}`}
        onClick={openFileDialog}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragOver={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
      >
        {children || (
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              className="w-12 h-12 mb-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {accept === 'image/*'
                ? 'PNG, JPG, GIF up to '
                : 'Files up to '}
              {Math.round(maxSize / 1024 / 1024)}MB
              {multiple && ` (max ${maxFiles} files)`}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}

      {/* File previews */}
      {showPreview && previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={`${preview.name}-${index}`}
              className="relative group rounded-lg overflow-hidden border border-gray-200"
            >
              {preview.type.startsWith('image/') ? (
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              )}
              <button
                type="button"
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
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
              <div className="p-2 text-xs truncate">{preview.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && !uploadImmediately && (
        <div className="mt-4 flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={upload}
            disabled={disabled || files.length === 0}
          >
            Upload {multiple && files.length > 1 ? `(${files.length} files)` : ''}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={clearFiles}
            disabled={disabled || files.length === 0}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

FileUploader.propTypes = {
  onUploadStart: PropTypes.func,
  onUploadProgress: PropTypes.func,
  onUploadComplete: PropTypes.func,
  onUploadError: PropTypes.func,
  onFilesSelected: PropTypes.func,
  multiple: PropTypes.bool,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  maxFiles: PropTypes.number,
  label: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  uploaderClassName: PropTypes.string,
  showPreview: PropTypes.bool,
  uploadImmediately: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node
};

export default FileUploader;
