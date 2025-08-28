import React, { useId } from "react"
import MultiSelectDropdown from ".././MultiSelectDropdown.jsx"

export default function DevicesFilters({
  filters,
  selected,
  onChangeSelected,     // (nextSelected) => void
  searchTerm,
  onChangeSearch,       // (value) => void
  onClearAll,           // () => void
}) {
  const activeOnlyId = useId()

  return (
    <div className="bg-white rounded-xl mb-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search + Active */}
        <div>
          <div className="relative">
            <img
              src={`${import.meta.env.BASE_URL}search.svg`}
              alt=""
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Search"
              className="w-full border rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search devices"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              id={activeOnlyId}
              type="checkbox"
              checked={selected.activeOnly}
              onChange={(e) =>
                onChangeSelected({ ...selected, activeOnly: e.target.checked })
              }
              className="h-4 w-4"
            />
            <label htmlFor={activeOnlyId} className="text-sm">Active only</label>
          </div>

          <button
            onClick={onClearAll}
            className="mt-3 text-sm text-blue-700 hover:underline"
          >
            Clear all
          </button>
        </div>

        {/* Locations */}
        <div>
          <MultiSelectDropdown
            options={filters.locationNames}
            selectedValues={selected.locationNames}
            onChange={(nextSet) =>
              onChangeSelected({ ...selected, locationNames: nextSet })
            }
            placeholder="Location"
          />
        </div>

        {/* Campaigns */}
        <div>
          <MultiSelectDropdown
            options={filters.campaignNames}
            selectedValues={selected.campaignNames}
            onChange={(nextSet) =>
              onChangeSelected({ ...selected, campaignNames: nextSet })
            }
            placeholder="Campaign"
          />
        </div>

        {/* Statuses */}
        <div>
          <MultiSelectDropdown
            options={filters.campaignStatuses}
            selectedValues={selected.campaignStatuses}
            onChange={(nextSet) =>
              onChangeSelected({ ...selected, campaignStatuses: nextSet })
            }
            placeholder="Status"
          />
        </div>
      </div>
    </div>
  )
}
