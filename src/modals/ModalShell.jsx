import React from "react"

export default function ModalShell({ open, title, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-xl bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-gray-100">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
          <div className="px-5 py-3 border-t flex items-center justify-end">
            {footer ?? (
              <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
