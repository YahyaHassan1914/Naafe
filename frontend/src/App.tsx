
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OfferProvider } from './contexts/OfferContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ServiceCategoriesPage from './components/ServiceCategoriesPage';
import SearchPage from './pages/SearchPage';
import TestPage from './components/TestPage';
import MinimalTest from './components/MinimalTest';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLayout from './admin/components/Layout/Layout';
import AdminOverview from './admin/pages/AdminOverview';
import AdminManageUsers from './admin/pages/AdminManageUsers';
import AdminManageCategories from './admin/pages/AdminManageCategories';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import PostServiceForm from './components/PostServiceForm';
import RequestServiceForm from './components/RequestServiceForm';
import RequestServiceDetailsPage from './pages/RequestServiceDetailsPage';
import ServiceResponseForm from './components/ServiceResponseForm';
import AdminUpgradeRequests from './admin/pages/AdminUpgradeRequests';
import HelpCenterPage from './pages/HelpCenterPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import NotificationPage from './pages/NotificationPage';
import ChatPage from './pages/ChatPage';
import ConversationsPage from './pages/ConversationsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
      <AuthProvider>
          <OfferProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/minimal" element={<MinimalTest />} />
              <Route path="/categories" element={<ServiceCategoriesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/me" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/post-service" element={
                  <ProtectedRoute requiredRoles={['provider']}>
                    <PostServiceForm />
                  </ProtectedRoute>
                } />
                <Route path="/request-service" element={
                  <ProtectedRoute requiredRoles={['seeker']}>
                    <RequestServiceForm />
                  </ProtectedRoute>
                } />
                <Route path="/requests/:id" element={<RequestServiceDetailsPage />} />
                <Route path="/requests/:id/respond" element={<ServiceResponseForm />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationPage />
                </ProtectedRoute>
              } />
              <Route path="/conversations" element={
                <ProtectedRoute>
                  <ConversationsPage />
                </ProtectedRoute>
              } />
              <Route path="/chat/:chatId" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/payment/success" element={
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              } />
              <Route path="/provider/:id" element={<div className="min-h-screen bg-warm-cream flex items-center justify-center"><p className="text-2xl text-text-secondary">Provider Details Page (Coming Soon)</p></div>} />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminManageUsers />} />
                <Route path="categories" element={<AdminManageCategories />} />
                <Route path="upgrade-requests" element={<AdminUpgradeRequests />} />
              </Route>
              {/* Fallback routes for footer links */}
              <Route path="/services" element={<Navigate to="/categories" replace />} />
              <Route path="/explore" element={<Navigate to="/categories" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          </OfferProvider>
        </AuthProvider>
        </Router>
    </ErrorBoundary>
  );
}

export default App;