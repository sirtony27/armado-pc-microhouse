'use client'
import { useEffect } from 'react'

export type ToastData = { type?: 'success'|'error'|'info'; message: string }

export default function Toast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  const color = toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
  return (
    <div className={`fixed bottom-4 right-4 z-50 text-white px-4 py-2 rounded shadow-lg ${color}`}> {toast.message} </div>
  )
}
