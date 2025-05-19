import { Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from './firebase/config';
import { userService } from './firebase/services';
import { analyticsService } from './firebase/services/analytics/analytics.service';
import { usePageTracking } from './hooks/useAnalytics';

// Performance components
import { LoadingSpinner, ErrorBoundary, AnalyticsConsent } from './components/performance';

// Guide components
import { GuideList, GuideForm, GuideView } from './components/guide';

// Eagerly load essential components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const Clients = lazy(() => import('./pages/Clients'));
const Showcases = lazy(() => import('./pages/Showcases'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize page tracking
  usePageTracking();
  
  // 구글 리디렉션 로그인 결과 처리
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        // 리디렉션 결과 확인
        const result = await getRedirectResult(auth);
        
        if (result) {
          // 로그인 성공
          await userService._processGoogleAuthResult(result);
          
          // 리디렉션 전 URL로 이동
          const redirectURL = sessionStorage.getItem('authRedirectURL') || '/dashboard';
          sessionStorage.removeItem('authRedirectURL');
          navigate(redirectURL);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };
    
    handleRedirectResult();
  }, [navigate]);
  
  // Set up authentication tracking
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Track user auth state for analytics
      if (currentUser) {
        analyticsService.setUserId(currentUser.uid);
        analyticsService.setUserProperties({
          user_id: currentUser.uid,
          email_verified: currentUser.emailVerified,
          account_created: currentUser.metadata.creationTime
        });
        
        // Log login event if this is a new session
        const lastLoginTime = localStorage.getItem('last_login_time');
        const currentTime = Date.now();
        if (!lastLoginTime || (currentTime - parseInt(lastLoginTime, 10)) > 3600000) {
          analyticsService.logEvent('login', {
            method: 'Firebase Auth'
          });
          localStorage.setItem('last_login_time', currentTime.toString());
        }
      } else {
        // Clear user ID when logged out
        analyticsService.setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Track navigation changes
  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Full URL:', window.location.href);
    console.log('Guides component routes:', 
      '/guides -> GuideList', 
      '/guides/new -> GuideForm',
      '/guides/:id -> GuideView'
    );
    console.log('Routes debugging:', {
      guideRouteMatches: location.pathname.match(/^\/guides(\/.*)?$/),
      pathSegments: location.pathname.split('/'),
      isGuideDetail: location.pathname.match(/^\/guides\/[^/]+$/)
    });
    
    analyticsService.logEvent('page_view', {
      page_path: location.pathname,
      page_title: document.title || location.pathname,
      page_location: window.location.href
    });
  }, [location]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        analyticsService.logEvent('app_error', {
          error_message: error.message,
          error_stack: error.stack,
          location: location.pathname
        });
      }}
    >
      <AnalyticsConsent />
      <Routes>
        <Route path="/" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Home />
          </Suspense>
        } />
        
        <Route path="/login" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Login />
          </Suspense>
        } />
        
        <Route path="/register" element={
          <Suspense fallback={<LoadingSpinner />}>
            <Register />
          </Suspense>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/properties/*" element={
          <ProtectedRoute user={user}>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Properties />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/clients/*" element={
          <ProtectedRoute user={user}>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Clients />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/showcases/*" element={
          <ProtectedRoute user={user}>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Showcases />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Guides 라우팅을 개별적으로 정의 */}
        <Route path="/guides" element={
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <GuideList />
            </Suspense>
          </Layout>
        } />
        
        {/* 가이드 생성 경로 - 구체적인 경로를 먼저 정의해야 함 */}
        <Route path="/guides/new" element={
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <GuideForm />
            </Suspense>
          </Layout>
        } />
        
        {/* 가이드 상세 보기 - ID를 포함한 와일드카드 패턴은 나중에 정의 */}
        <Route path="/guides/:id" element={
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <GuideView />
            </Suspense>
          </Layout>
        } />
        
        <Route path="*" element={
          <Suspense fallback={<LoadingSpinner />}>
            <NotFound />
          </Suspense>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
