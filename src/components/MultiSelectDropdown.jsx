import React, { useEffect, useRef, useState } from "react";

export default function MultiSelectDropdown({
  options = [],
  selectedValues = new Set(),
  onChange,                  // (nextSet: Set<string>) => void
  placeholder = "Select...",
  buttonClassName = "",
  menuClassName = "",
  maxMenuHeight = 240,       // px
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleValue = (val) => {
    const next = new Set(selectedValues);
    next.has(val) ? next.delete(val) : next.add(val);
    onChange(next);
  };

  // Button label: placeholder if none; otherwise count or list
  const label =
    selectedValues.size === 0
      ? placeholder
      : selectedValues.size === 1
      ? Array.from(selectedValues)[0]
      : `${selectedValues.size} selected`;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full border rounded-lg px-3 py-2 bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 ${buttonClassName}`}
      >
        <span className={selectedValues.size === 0 ? "text-gray-400" : ""}>{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-20 mt-2 w-full bg-white border rounded-lg shadow ${menuClassName}`}
          style={{ maxHeight: maxMenuHeight, overflowY: "auto" }}
        >
          {options.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No options</div>
          ) : (
            <ul className="py-2">
              {options.map((opt) => {
                const checked = selectedValues.has(opt);
                return (
                  <li key={opt}>
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleValue(opt)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-gray-50">
            <button
              className="text-sm text-gray-600 hover:underline"
              onClick={() => onChange(new Set())}
            >
              Clear
            </button>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
