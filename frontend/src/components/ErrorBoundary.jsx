import React from 'react'

/**
 * Error Boundary Component
 * Menangkap errors dari child components dan menampilkan fallback UI
 * 
 * Module 13: Reliability - Graceful Degradation
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: 'generic'
    }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Determine error type
    let errorType = 'generic'
    if (error.type === 'SERVICE_UNAVAILABLE') {
      errorType = 'service_unavailable'
    } else if (error.type === 'UNAUTHORIZED') {
      errorType = 'unauthorized'
    }

    this.setState({
      error,
      errorInfo,
      errorType,
    })

    // Log ke console untuk debugging
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorType={this.state.errorType}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// Convert functional component to class for error boundary

// Wrapper untuk class component
export default function ErrorBoundaryWrapper({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

/**
 * Error Fallback UI Component
 */
function ErrorFallback({ error, errorType, onReset }) {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'service_unavailable':
        return {
          title: 'Service Temporarily Unavailable',
          message: 'The service is currently experiencing issues. Please try again in a few moments.',
          icon: '',
          color: 'bg-red-900/20 border-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        }
      case 'unauthorized':
        return {
          title: 'Authentication Required',
          message: 'Your session has expired. Please log in again.',
          icon: '',
          color: 'bg-yellow-900/20 border-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        }
      default:
        return {
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again or contact support.',
          icon: '',
          color: 'bg-gray-900/20 border-gray-800',
          buttonColor: 'bg-gray-600 hover:bg-gray-700',
        }
    }
  }

  const config = getErrorConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 flex items-center justify-center p-4">
      <div 
        className={`border rounded-lg p-8 max-w-md w-full ${config.color}`}
        role="alert" 
        aria-live="assertive"
      >
        {/* Icon */}
        <div className="text-5xl text-center mb-4">{config.icon}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-3">{config.title}</h1>

        {/* Message */}
        <p className="text-slate-300 text-center mb-6">{config.message}</p>

        {/* Error Details (dev mode) */}
        {import.meta.env.DEV && error && (
          <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-6 text-xs font-mono max-h-32 overflow-y-auto">
            <p className="text-red-300 font-semibold mb-2">Error Details:</p>
            <p className="text-slate-300 break-words">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onReset}
            className={`${config.buttonColor} text-white py-2 px-4 rounded font-semibold transition`}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded font-semibold transition"
          >
            Go Home
          </button>
        </div>

        {/* Support Message */}
        <div className="mt-6 pt-6 border-t border-slate-700 text-xs text-slate-400 text-center">
          If this problem persists, please check the{' '}
          <a href="/status" className="text-blue-400 hover:text-blue-300 underline">
            system status page
          </a>
          .
        </div>
      </div>
    </div>
  )
}
