import React, { useRef, useState } from "react"
import Spinner from "./Spinner.jsx"

/**
 * Reusable drag & drop + click-to-pick area.
 *
 * Props:
 * - onFiles(files: File[])         REQUIRED
 * - accept="image/*,video/*"       input accept attribute
 * - multiple=true                  allow multi select
 * - disabled=false                 disables interaction
 * - busy=false                     shows overlay spinner
 * - className                      additional classes
 * - children                       content inside the dropzone
 */
export default function Dropzone({
  onFiles,
  accept = "image/*,video/*",
  multiple = true,
  disabled = false,
  busy = false,
  className = "",
  children,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function toFiles(list) {
    return Array.from(list || [])
  }

  function handlePick(e) {
    const files = toFiles(e.target.files)
    if (files.length) onFiles(files)
    // allow picking same file again later
    e.target.value = ""
  }

  function handleDrop(e) {
    e.preventDefault()
    if (disabled) return
    setDragging(false)
    const files = toFiles(e.dataTransfer?.files)
    if (files.length) onFiles(files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled || busy}
      onKeyDown={(e) => {
        if (disabled || busy) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onClick={() => { if (!disabled && !busy) inputRef.current?.click() }}
      onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDragging(true) } }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        "relative rounded-xl border-2 border-dashed p-20 text-center cursor-pointer select-none",
        dragging ? "border-indigo-400 bg-indigo-50/40" : "border-gray-300",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className,
      ].join(" ")}
    >
      {/* content */}
      {children ?? (
        <>
          <p className="mb-2">Drag & drop files here</p>
          <p className="text-sm text-gray-500 mb-4">…or click to choose from your computer</p>
        </>
      )}

      {/* hidden input */}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={handlePick}
        disabled={disabled}
      />

      {/* busy overlay */}
      {busy && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Spinner />
          <span className="sr-only">Uploading…</span>
        </div>
      )}
    </div>
  )
}
