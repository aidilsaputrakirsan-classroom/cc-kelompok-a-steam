import { useState, useEffect, useCallback } from 'react'
import {
  fetchAuthHealth,
  fetchItemsHealth,
  fetchAuthMetrics,
  fetchItemsMetrics,
} from '../services/api'

/**
 * Hook untuk monitor health dan metrics dari services
 * Digunakan di StatusPage dashboard
 * 
 * Returns:
 * - authStatus: { status, uptime, errorRate, ... }
 * - itemsStatus: { status, uptime, errorRate, ... }
 * - authMetrics: raw metrics object
 * - itemsMetrics: raw metrics object
 * - isLoading: sedang fetch
 * - error: error message jika ada
 */
export function useServiceStatus(refreshInterval = 10000) {
  const [authStatus, setAuthStatus] = useState(null)
  const [itemsStatus, setItemsStatus] = useState(null)
  const [authMetrics, setAuthMetrics] = useState(null)
  const [itemsMetrics, setItemsMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch dari semua services secara parallel
      const [authHealthData, itemsHealthData, authMetricsData, itemsMetricsData] = await Promise.all([
        fetchAuthHealth(),
        fetchItemsHealth(),
        fetchAuthMetrics(),
        fetchItemsMetrics(),
      ])

      // Parse status
      setAuthStatus(authHealthData || { status: 'unhealthy', uptime: 0, error_rate: 0 })
      setItemsStatus(itemsHealthData || { status: 'unhealthy', uptime: 0, error_rate: 0 })
      setAuthMetrics(authMetricsData)
      setItemsMetrics(itemsMetricsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
      setAuthStatus({ status: 'error' })
      setItemsStatus({ status: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-refresh setiap refreshInterval ms
  useEffect(() => {
    // Fetch immediately on mount
    fetchStatus()

    // Setup interval
    const interval = setInterval(fetchStatus, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, fetchStatus])

  return {
    authStatus,
    itemsStatus,
    authMetrics,
    itemsMetrics,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchStatus,
  }
}

/**
 * Helper function untuk determine status color dan icon
 */
export function getStatusDisplay(status) {
  switch (status) {
    case 'healthy':
      return { color: 'bg-green-100 text-green-800', icon: '🟢', label: 'Healthy' }
    case 'degraded':
      return { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', label: 'Degraded' }
    case 'unhealthy':
    case 'error':
      return { color: 'bg-red-100 text-red-800', icon: '🔴', label: 'Offline' }
    default:
      return { color: 'bg-gray-100 text-gray-800', icon: '⚪', label: 'Unknown' }
  }
}

/**
 * Format uptime untuk display (dalam seconds)
 */
export function formatUptime(seconds) {
  if (!seconds) return 'N/A'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

/**
 * Format error rate sebagai percentage
 */
export function formatErrorRate(rate) {
  if (!rate && rate !== 0) return 'N/A'
  return `${(parseFloat(rate) * 100).toFixed(2)}%`
}
