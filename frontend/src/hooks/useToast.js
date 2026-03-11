import { useState, useCallback } from "react"

/**
 * Custom hook untuk mengelola toast notifications
 * 
 * @returns {Object} { toast, showToast, hideToast }
 * 
 * Usage:
 * const { toast, showToast } = useToast()
 * showToast("Item berhasil ditambahkan!", "success")
 */
export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  return {
    toast,
    showToast,
    hideToast,
  }
}
