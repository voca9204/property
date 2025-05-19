import React, { Suspense } from 'react';
import PropTypes from 'prop-types';

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 'md', message = '로딩 중...' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size] || 'w-8 h-8';
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${sizeClass} border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin`}></div>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  message: PropTypes.string
};

/**
 * Error boundary component for catching render errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to analytics
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-medium text-red-800">문제가 발생했습니다</h3>
          <p className="mt-2 text-sm text-red-700">
            페이지를 다시 로드하거나 나중에 다시 시도해주세요.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func
};

/**
 * Lazy loading component with Suspense and ErrorBoundary
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Lazy loaded component
 */
const LazyLoad = ({
  component,
  loading = <LoadingSpinner />,
  error,
  onError,
  ...props
}) => {
  return (
    <ErrorBoundary fallback={error} onError={onError}>
      <Suspense fallback={loading}>
        {React.createElement(component, props)}
      </Suspense>
    </ErrorBoundary>
  );
};

LazyLoad.propTypes = {
  component: PropTypes.elementType.isRequired,
  loading: PropTypes.node,
  error: PropTypes.node,
  onError: PropTypes.func
};

export { LazyLoad, LoadingSpinner, ErrorBoundary };
