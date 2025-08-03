# Frontend Integration Guide

This document provides a comprehensive guide for integrating the frontend React application with our backend API services.

## Table of Contents

1. [Overview](#overview)
2. [API Services](#api-services)
3. [React Query Hooks](#react-query-hooks)
4. [Socket.IO Integration](#socketio-integration)
5. [Authentication Flow](#authentication-flow)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)
8. [Environment Configuration](#environment-configuration)
9. [Best Practices](#best-practices)

## Overview

The frontend integration provides a complete set of services and hooks for interacting with our backend API. It includes:

- **API Services**: Type-safe service classes for all backend endpoints
- **React Query Hooks**: Optimized data fetching and caching
- **Socket.IO Integration**: Real-time communication
- **Authentication Management**: Token handling and user state
- **Error Handling**: Consistent error management across the app

## API Services

### Core Services

All services are located in `src/services/` and provide type-safe interfaces for backend communication.

#### 1. Base API Client (`api.ts`)

```typescript
import { api } from '../services';

// Direct API calls
const response = await api.auth.login(credentials);
const user = await api.users.getProfile();
```

#### 2. Service-Specific Services

```typescript
import { 
  authService, 
  serviceRequestService, 
  offerService, 
  paymentService,
  reviewService,
  notificationService,
  verificationService 
} from '../services';

// Authentication
const user = await authService.getCurrentUser();
const profile = await authService.updateProfile(data);

// Service Requests
const requests = await serviceRequestService.getAllServiceRequests(filters);
const request = await serviceRequestService.createServiceRequest(data);

// Offers
const offers = await offerService.getAllOffers(filters);
const offer = await offerService.createOffer(data);

// Payments
const payment = await paymentService.createPayment(data);
const transactions = await paymentService.getMyTransactions();

// Reviews
const reviews = await reviewService.getProviderReviews(providerId);
const review = await reviewService.createReview(data);

// Notifications
const notifications = await notificationService.getNotifications();
const unreadCount = await notificationService.getUnreadCount();

// Verification
const status = await verificationService.getVerificationStatus();
const steps = await verificationService.getVerificationSteps();
```

## React Query Hooks

### Setup

First, wrap your app with `QueryClient`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```

### Available Hooks

#### Authentication Hooks

```typescript
import { 
  useCurrentUser, 
  useLogin, 
  useRegister, 
  useUpdateProfile,
  useLogout 
} from '../hooks/useApi';

function LoginComponent() {
  const login = useLogin();
  
  const handleLogin = async (credentials) => {
    try {
      const result = await login.mutateAsync(credentials);
      if (result.success) {
        // Redirect or update UI
      }
    } catch (error) {
      // Handle error
    }
  };
}

function ProfileComponent() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.data?.name.first}</h1>
      {/* Profile form */}
    </div>
  );
}
```

#### Service Request Hooks

```typescript
import { 
  useServiceRequests, 
  useServiceRequest, 
  useCreateServiceRequest,
  useMyServiceRequests 
} from '../hooks/useApi';

function ServiceRequestsList() {
  const { data, isLoading, error } = useServiceRequests({
    category: 'plumbing',
    status: 'open'
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.data?.data.map(request => (
        <ServiceRequestCard key={request._id} request={request} />
      ))}
    </div>
  );
}

function CreateServiceRequest() {
  const createRequest = useCreateServiceRequest();
  
  const handleSubmit = async (formData) => {
    try {
      await createRequest.mutateAsync(formData);
      // Show success message
    } catch (error) {
      // Handle error
    }
  };
}
```

#### Offer Hooks

```typescript
import { 
  useOffers, 
  useOffer, 
  useCreateOffer, 
  useAcceptOffer,
  useNegotiateOffer 
} from '../hooks/useApi';

function OffersList({ requestId }) {
  const { data: offers } = useOffersByRequest(requestId);
  const acceptOffer = useAcceptOffer();
  const negotiateOffer = useNegotiateOffer();
  
  const handleAccept = async (offerId) => {
    await acceptOffer.mutateAsync(offerId);
  };
  
  const handleNegotiate = async (offerId, message) => {
    await negotiateOffer.mutateAsync({ offerId, data: { message } });
  };
  
  return (
    <div>
      {offers?.data?.data.map(offer => (
        <OfferCard 
          key={offer._id} 
          offer={offer}
          onAccept={() => handleAccept(offer._id)}
          onNegotiate={(message) => handleNegotiate(offer._id, message)}
        />
      ))}
    </div>
  );
}
```

#### Payment Hooks

```typescript
import { 
  usePayment, 
  useMyTransactions, 
  useCreatePayment 
} from '../hooks/useApi';

function PaymentHistory() {
  const { data: transactions } = useMyTransactions({
    status: 'completed',
    page: 1,
    limit: 20
  });
  
  return (
    <div>
      {transactions?.data?.data.map(payment => (
        <PaymentCard key={payment._id} payment={payment} />
      ))}
    </div>
  );
}
```

#### Review Hooks

```typescript
import { 
  useProviderReviews, 
  useProviderReviewStats, 
  useCreateReview 
} from '../hooks/useApi';

function ProviderReviews({ providerId }) {
  const { data: reviews } = useProviderReviews(providerId);
  const { data: stats } = useProviderReviewStats(providerId);
  const createReview = useCreateReview();
  
  return (
    <div>
      <ReviewStats stats={stats?.data} />
      {reviews?.data?.data.map(review => (
        <ReviewCard key={review._id} review={review} />
      ))}
    </div>
  );
}
```

#### Notification Hooks

```typescript
import { 
  useNotifications, 
  useUnreadNotificationCount,
  useMarkNotificationAsRead 
} from '../hooks/useApi';

function NotificationBell() {
  const { data: unreadCount } = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  
  return (
    <div className="relative">
      <button onClick={() => markAsRead.mutate(notificationId)}>
        🔔 {unreadCount?.data?.count > 0 && (
          <span className="badge">{unreadCount.data.count}</span>
        )}
      </button>
    </div>
  );
}
```

## Socket.IO Integration

### Setup

```typescript
import { socketService } from '../services';

// Connect to socket when user logs in
useEffect(() => {
  if (user) {
    socketService.connect();
    socketService.joinNotifications(user._id);
  }
  
  return () => {
    socketService.disconnect();
  };
}, [user]);
```

### Event Listeners

```typescript
import { socketService } from '../services';

function NotificationHandler() {
  useEffect(() => {
    // Listen for new notifications
    socketService.on('notify:newNotification', (data) => {
      // Show toast notification
      toast.success(data.notification.message);
    });
    
    // Listen for offer updates
    socketService.on('offer:created', (data) => {
      // Update offers list
      queryClient.invalidateQueries(['offers']);
    });
    
    // Listen for payment updates
    socketService.on('payment:completed', (data) => {
      // Update payment status
      queryClient.invalidateQueries(['payments']);
    });
    
    return () => {
      socketService.off('notify:newNotification');
      socketService.off('offer:created');
      socketService.off('payment:completed');
    };
  }, []);
}
```

### Room Management

```typescript
// Join offer-specific room for real-time updates
useEffect(() => {
  if (offerId) {
    socketService.joinOffer(offerId);
  }
  
  return () => {
    if (offerId) {
      socketService.leaveOffer(offerId);
    }
  };
}, [offerId]);

// Join chat room
useEffect(() => {
  if (chatId) {
    socketService.joinChat(chatId);
  }
  
  return () => {
    if (chatId) {
      socketService.leaveChat(chatId);
    }
  };
}, [chatId]);
```

## Authentication Flow

### Login Process

```typescript
function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  
  const handleLogin = async (credentials) => {
    try {
      const result = await login.mutateAsync(credentials);
      if (result.success) {
        // Tokens are automatically stored by the hook
        navigate('/dashboard');
      }
    } catch (error) {
      // Handle login error
    }
  };
}
```

### Protected Routes

```typescript
import { useCurrentUser } from '../hooks/useApi';

function ProtectedRoute({ children }) {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!user?.success) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

### Token Refresh

```typescript
import { useRefreshToken } from '../hooks/useApi';

function TokenRefreshHandler() {
  const refreshToken = useRefreshToken();
  
  useEffect(() => {
    // Set up automatic token refresh
    const interval = setInterval(async () => {
      try {
        await refreshToken.mutateAsync();
      } catch (error) {
        // Token refresh failed, redirect to login
        navigate('/login');
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes
    
    return () => clearInterval(interval);
  }, []);
}
```

## Error Handling

### API Error Handling

```typescript
import { ApiError } from '../services';

function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);
  
  if (error) {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'UNAUTHORIZED':
          return <Navigate to="/login" />;
        case 'FORBIDDEN':
          return <div>Access denied</div>;
        default:
          return <div>Error: {error.message}</div>;
      }
    }
  }
  
  return children;
}
```

### Query Error Handling

```typescript
function ServiceRequestsList() {
  const { data, error, isLoading } = useServiceRequests();
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading service requests</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
  
  // ... rest of component
}
```

### Mutation Error Handling

```typescript
function CreateServiceRequest() {
  const createRequest = useCreateServiceRequest();
  
  useEffect(() => {
    if (createRequest.error) {
      toast.error(createRequest.error.message);
    }
  }, [createRequest.error]);
  
  // ... rest of component
}
```

## Usage Examples

### Complete Service Request Flow

```typescript
function ServiceRequestFlow() {
  const [filters, setFilters] = useState({});
  const { data: requests } = useServiceRequests(filters);
  const createRequest = useCreateServiceRequest();
  const { data: user } = useCurrentUser();
  
  const handleCreateRequest = async (formData) => {
    try {
      await createRequest.mutateAsync(formData);
      toast.success('Service request created successfully!');
    } catch (error) {
      toast.error('Failed to create service request');
    }
  };
  
  return (
    <div>
      <CreateServiceRequestForm onSubmit={handleCreateRequest} />
      <ServiceRequestsList requests={requests?.data?.data} />
    </div>
  );
}
```

### Complete Offer Management

```typescript
function OfferManagement({ requestId }) {
  const { data: offers } = useOffersByRequest(requestId);
  const createOffer = useCreateOffer();
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  
  const handleCreateOffer = async (offerData) => {
    try {
      await createOffer.mutateAsync({ ...offerData, requestId });
      toast.success('Offer submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit offer');
    }
  };
  
  const handleAcceptOffer = async (offerId) => {
    try {
      await acceptOffer.mutateAsync(offerId);
      toast.success('Offer accepted!');
    } catch (error) {
      toast.error('Failed to accept offer');
    }
  };
  
  return (
    <div>
      <CreateOfferForm onSubmit={handleCreateOffer} />
      <OffersList 
        offers={offers?.data?.data}
        onAccept={handleAcceptOffer}
        onReject={rejectOffer.mutate}
      />
    </div>
  );
}
```

## Environment Configuration

Create a `.env` file in your frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Feature Flags
VITE_ENABLE_SOCKET=true
VITE_ENABLE_NOTIFICATIONS=true

# Development
VITE_DEBUG=true
```

## Best Practices

### 1. Query Optimization

```typescript
// Use appropriate stale times
const { data } = useServiceRequests(filters, {
  staleTime: 2 * 60 * 1000, // 2 minutes for frequently changing data
});

const { data: user } = useCurrentUser({
  staleTime: 5 * 60 * 1000, // 5 minutes for user data
});
```

### 2. Error Boundaries

```typescript
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Your routes */}
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 3. Loading States

```typescript
function ServiceRequestsList() {
  const { data, isLoading, isError, error } = useServiceRequests();
  
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {data?.data?.data.map(request => (
        <ServiceRequestCard key={request._id} request={request} />
      ))}
    </div>
  );
}
```

### 4. Optimistic Updates

```typescript
function AcceptOfferButton({ offerId }) {
  const queryClient = useQueryClient();
  const acceptOffer = useAcceptOffer();
  
  const handleAccept = async () => {
    // Optimistic update
    queryClient.setQueryData(['offers', 'byId', offerId], (old) => ({
      ...old,
      data: { ...old.data, status: 'accepted' }
    }));
    
    try {
      await acceptOffer.mutateAsync(offerId);
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries(['offers', 'byId', offerId]);
    }
  };
  
  return <button onClick={handleAccept}>Accept Offer</button>;
}
```

### 5. Socket Event Cleanup

```typescript
function ChatComponent({ chatId }) {
  useEffect(() => {
    socketService.joinChat(chatId);
    
    const handleMessage = (data) => {
      // Handle new message
    };
    
    socketService.on('chat:message', handleMessage);
    
    return () => {
      socketService.leaveChat(chatId);
      socketService.off('chat:message', handleMessage);
    };
  }, [chatId]);
}
```

This integration provides a robust foundation for building a modern, real-time service marketplace application with excellent user experience and performance. 