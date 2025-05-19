import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { usePerformance } from '../../hooks/useAnalytics';

/**
 * Optimized image component with lazy loading and fallback
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Optimized image component
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder = 'blur',
  fallback = '/images/placeholder.svg',
  onLoad,
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(placeholder === 'blur' ? fallback : src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { startTrace } = usePerformance();
  
  useEffect(() => {
    // Reset state when src changes
    if (src) {
      setImgSrc(placeholder === 'blur' ? fallback : src);
      setIsLoaded(false);
      setError(false);
    }
  }, [src, fallback, placeholder]);
  
  const handleLoad = (e) => {
    // Start performance trace
    const imageLoadTrace = startTrace('image_load');
    if (imageLoadTrace) imageLoadTrace.start();
    
    // Set actual image source if using blur placeholder
    if (placeholder === 'blur' && !isLoaded) {
      setImgSrc(src);
    }
    
    setIsLoaded(true);
    
    // Stop trace
    if (imageLoadTrace) {
      imageLoadTrace.putAttribute('success', 'true');
      imageLoadTrace.putAttribute('image_size', String(e.target.naturalWidth * e.target.naturalHeight));
      imageLoadTrace.stop();
    }
    
    if (onLoad) onLoad(e);
  };
  
  const handleError = (e) => {
    setError(true);
    setImgSrc(fallback);
    
    if (onError) onError(e);
  };
  
  // Determine image size based on props or defaults
  const imgWidth = width ? `${width}px` : 'auto';
  const imgHeight = height ? `${height}px` : 'auto';
  
  // Generate srcSet for responsive images if needed
  const generateSrcSet = () => {
    if (!src || error || src.includes('data:')) return undefined;
    
    // For firebase storage URLs, we can generate different sizes
    if (src.includes('firebasestorage.googleapis.com')) {
      // Extract base URL and add size parameters
      const baseUrl = src.split('?')[0];
      const queryParams = new URLSearchParams(src.split('?')[1] || '');
      
      // Generate different sizes
      return [256, 512, 1024, 2048]
        .map(size => `${baseUrl}?width=${size}&${queryParams.toString()} ${size}w`)
        .join(', ');
    }
    
    return undefined;
  };
  
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      style={{ width: imgWidth, height: imgHeight }}
      width={width}
      height={height}
      loading={loading}
      srcSet={generateSrcSet()}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loading: PropTypes.oneOf(['lazy', 'eager']),
  placeholder: PropTypes.oneOf(['blur', 'empty']),
  fallback: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default OptimizedImage;
