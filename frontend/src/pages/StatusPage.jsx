import { useServiceStatus, getStatusDisplay, formatUptime, formatErrorRate } from '../hooks/useServiceStatus'

/**
 * StatusPage - Monitoring Dashboard
 * Menampilkan health dan metrics dari Auth Service dan Item Service
 * Auto-refresh setiap 10 detik
 * 
 * Module 14: Observability & Monitoring
 */
export default function StatusPage() {
  const {
    authStatus,
    itemsStatus,
    authMetrics,
    itemsMetrics,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useServiceStatus(10000)

  const authDisplay = getStatusDisplay(authStatus?.status)
  const itemsDisplay = getStatusDisplay(itemsStatus?.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">System Status</h1>
            <p className="text-slate-400">Real-time monitoring dashboard for microservices</p>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition flex items-center gap-2"
          >
            {isLoading ? '⏳ Updating...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-sm text-slate-400 mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">⚠️ Error: {error}</p>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Auth Service */}
          <ServiceCard
            title="Auth Service"
            status={authStatus}
            display={authDisplay}
            metrics={authMetrics}
          />

          {/* AI Service */}
          <ServiceCard
            title="AI Service"
            status={itemsStatus}
            display={itemsDisplay}
            metrics={itemsMetrics}
          />
        </div>

        {/* Metrics Summary */}
        <MetricsSummary authMetrics={authMetrics} itemsMetrics={itemsMetrics} />

        {/* Troubleshooting Guide */}
        <TroubleshootingGuide authStatus={authStatus} itemsStatus={itemsStatus} />
      </div>
    </div>
  )
}

/**
 * Service Card Component
 */
function ServiceCard({ title, status, display, metrics }) {
  if (!status) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-2xl">{display.icon}</span>
      </div>

      {/* Status Badge */}
      <div className={`${display.color} px-3 py-1 rounded-full text-sm font-medium w-fit mb-4`}>
        {display.label}
      </div>

      {/* Metrics */}
      <div className="space-y-3 text-sm">
        {status.uptime !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-400">Uptime:</span>
            <span className="font-mono font-medium">{formatUptime(status.uptime)}</span>
          </div>
        )}

        {status.error_rate !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-400">Error Rate:</span>
            <span className="font-mono font-medium">{formatErrorRate(status.error_rate)}</span>
          </div>
        )}

        {status.request_count !== undefined && (
          <div className="flex justify-between">
            <span className="text-slate-400">Total Requests:</span>
            <span className="font-mono font-medium">{status.request_count}</span>
          </div>
        )}

        {metrics && (
          <>
            {metrics.avg_response_time && (
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Response Time:</span>
                <span className="font-mono font-medium">{metrics.avg_response_time.toFixed(2)}ms</span>
              </div>
            )}

            {metrics.p95_response_time && (
              <div className="flex justify-between">
                <span className="text-slate-400">P95 Response Time:</span>
                <span className="font-mono font-medium">{metrics.p95_response_time.toFixed(2)}ms</span>
              </div>
            )}

            {metrics.p99_response_time && (
              <div className="flex justify-between">
                <span className="text-slate-400">P99 Response Time:</span>
                <span className="font-mono font-medium">{metrics.p99_response_time.toFixed(2)}ms</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Message */}
      {status.error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded text-sm text-red-200">
          {status.error}
        </div>
      )}
    </div>
  )
}

/**
 * Metrics Summary Component
 */
function MetricsSummary({ authMetrics, itemsMetrics }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox
          label="Auth Requests"
          value={authMetrics?.total_requests || 0}
        />
        <MetricBox
          label="AI Requests"
          value={itemsMetrics?.total_requests || 0}
        />
        <MetricBox
          label="Avg Auth Latency"
          value={authMetrics?.latency?.avg_ms ? `${authMetrics.latency.avg_ms.toFixed(0)}ms` : 'N/A'}
        />
        <MetricBox
          label="Avg AI Latency"
          value={itemsMetrics?.latency?.avg_ms ? `${itemsMetrics.latency.avg_ms.toFixed(0)}ms` : 'N/A'}
        />
      </div>
    </div>
  )
}

/**
 * Single Metric Box
 */
function MetricBox({ label, value }) {
  return (
    <div className="bg-slate-700/30 rounded p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  )
}

/**
 * Troubleshooting Guide Component
 */
function TroubleshootingGuide({ authStatus, itemsStatus }) {
  const authDown = authStatus?.status === 'unhealthy' || authStatus?.status === 'error'
  const itemsDown = itemsStatus?.status === 'unhealthy' || itemsStatus?.status === 'error'

  if (!authDown && !itemsDown) {
    return null
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-200 mb-3">⚠️ Troubleshooting</h3>

      <ul className="space-y-2 text-sm text-yellow-100">
        {authDown && (
          <li>
            <span className="font-semibold">Auth Service is down:</span> Login and registration features are unavailable.
            Check if the Auth Service container is running with{' '}
            <code className="bg-slate-700/50 px-2 py-1 rounded">docker-compose ps</code>
          </li>
        )}

        {itemsDown && (
          <li>
            <span className="font-semibold">AI Service is down:</span> Chat and AI processing features are unavailable.
            Check if the AI Service container is running.
          </li>
        )}

        {(authDown || itemsDown) && (
          <li>
            <span className="font-semibold">To restart services:</span>
            <code className="bg-slate-700/50 px-2 py-1 rounded block mt-1">docker-compose up -d</code>
          </li>
        )}
      </ul>
    </div>
  )
}
