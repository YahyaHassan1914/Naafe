import React, { Component, type ReactNode } from 'react';
import Button from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: { componentStack: string };
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service in production
    console.error('Error caught by boundary:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    if (error) {
      // In a real app, you'd send this to your error reporting service
      console.log('Reporting error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Show success message
      alert('تم إرسال التقرير بنجاح. شكراً لك!');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-warm-cream flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-text-secondary mb-6">
              عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو تحديث الصفحة.
            </p>
            
            <div className="space-y-3">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleRetry}
                className="w-full"
              >
                المحاولة مرة أخرى
              </Button>
              
              <Button
                variant="secondary"
                size="md"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                تحديث الصفحة
              </Button>
              
              <Button
                variant="outline"
                size="md"
                onClick={this.handleReportError}
                className="w-full"
              >
                الإبلاغ عن المشكلة
              </Button>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                  عرض تفاصيل الخطأ
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>الخطأ:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 