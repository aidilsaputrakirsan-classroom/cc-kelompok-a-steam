import { useState, useEffect } from 'react'
import { fetchAuthHealth } from '../services/api'

/**
 * Degraded Mode Banner
 * Menampilkan banner ketika Auth Service down
 * Disembunyikan ketika services healthy
 * 
 * Module 13: Reliability - Graceful Degradation
 */
export function DegradedModeBanner() {
  const [isAuthDown, setIsAuthDown] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const checkAuthService = async () => {
      const authHealth = await fetchAuthHealth()
      const isDown = !authHealth || authHealth.status !== 'healthy'
      setIsAuthDown(isDown)
    }

    // Check on mount
    checkAuthService()

    // Auto-check every 10 seconds
    const interval = setInterval(checkAuthService, 10000)

    return () => clearInterval(interval)
  }, [])

  // Don't show if dismissed or service is up
  if (isDismissed || !isAuthDown) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-900/90 border-b border-yellow-700 text-yellow-100 px-4 py-3 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Degraded Mode</p>
            <p className="text-sm opacity-90">
              Authentication service is temporarily unavailable. Some features may be limited.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/status"
            className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-sm font-medium transition whitespace-nowrap"
          >
            View Status
          </a>
          <button
            onClick={() => setIsDismissed(true)}
            className="px-2 py-1 text-yellow-200 hover:text-yellow-100 transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook untuk check apakah sistem dalam degraded mode
 * (ketika Auth Service down atau item service down)
 */
export function useDegradedMode() {
  const [isDegraded, setIsDegraded] = useState(false)
  const [degradedServices, setDegradedServices] = useState([])

  useEffect(() => {
    const checkServices = async () => {
      const authHealth = await fetchAuthHealth()
      const authIsDown = !authHealth || authHealth.status !== 'healthy'

      if (authIsDown) {
        setIsDegraded(true)
        setDegradedServices(['auth'])
      } else {
        setIsDegraded(false)
        setDegradedServices([])
      }
    }

    checkServices()
    const interval = setInterval(checkServices, 10000)
    return () => clearInterval(interval)
  }, [])

  return {
    isDegraded,
    degradedServices,
  }
}
