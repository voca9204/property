import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  createBrowserRouter, 
  RouterProvider,
  Route,
  createRoutesFromElements
} from 'react-router-dom';
import App from './App';
import './index.css';

// React Router with future flags enabled
const router = createBrowserRouter([
  {
    path: "/*",
    element: <App />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

// Service worker registration
// Only importing this in production
if (import.meta.env.PROD) {
  import('../public/js/serviceWorkerRegistration')
    .then(({ register }) => {
      register({
        onUpdate: (registration) => {
          // Show a notification or UI to prompt user to refresh
          if (window.confirm('새로운 버전이 있습니다. 새로고침 하시겠습니까?')) {
            window.location.reload();
          }
        },
      });
    })
    .catch(err => console.error('Service worker registration failed:', err));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

// Performance monitoring for metrics
if (import.meta.env.PROD) {
  // Report web vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(metric => console.log('CLS:', metric.value));
    getFID(metric => console.log('FID:', metric.value));
    getFCP(metric => console.log('FCP:', metric.value));
    getLCP(metric => console.log('LCP:', metric.value));
    getTTFB(metric => console.log('TTFB:', metric.value));
  });
}
