"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemoveAction: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: "border-2 border-green-300 bg-green-50 text-green-800 shadow-lg",
  error: "border-2 border-red-300 bg-red-50 text-red-800 shadow-lg",
  warning: "border-2 border-yellow-300 bg-yellow-50 text-yellow-800 shadow-lg",
  info: "border-2 border-orange-300 bg-orange-50 text-orange-800 shadow-lg",
}

export function ToastComponent({ toast, onRemoveAction }: ToastProps) {
  const Icon = toastIcons[toast.type || "info"]

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemoveAction(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemoveAction])

  return (
    <div
      className={cn(
        "pointer-events-auto w-full rounded-xl p-4 transition-all animate-in slide-in-from-bottom-full",
        toastStyles[toast.type || "info"]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="text-sm font-bold capitalize">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm font-medium mt-1">{toast.description}</div>
          )}
        </div>
        <button
          onClick={() => onRemoveAction(toast.id)}
          className="flex-shrink-0 rounded-lg p-1.5 hover:bg-white/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 11)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const contextValue = React.useMemo(
    () => ({ addToast, removeToast }),
    [addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 flex flex-col-reverse gap-3 pointer-events-none p-4 w-full max-w-md">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemoveAction={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ToastContext = React.createContext<{
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
} | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}