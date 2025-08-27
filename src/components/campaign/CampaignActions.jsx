// src/components/CampaignActions.jsx
export default function CampaignActions(props) {
  const {
    onConfigureDevices,
    onUploadContent,
    disabled = false,       // safe default
    className = "",         // safe default
  } = props || {};

  // build container classes safely
  const containerCls = ["flex flex-wrap items-center gap-2", className]
    .filter(Boolean)
    .join(" ");

  const btnCls =
    "inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 " +
    "bg-white shadow-sm hover:bg-gray-100 hover:shadow-md " +
    "transition focus:outline-none focus:ring-2 focus:ring-blue-500 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const iconCls = "h-4 w-4 opacity-80";

  return (
    <div className={containerCls}>
      {onConfigureDevices && (
        <button
          type="button"
          onClick={onConfigureDevices}
          className={btnCls}
          disabled={disabled}
          title="Configure devices"
        >
          {/* small inline icon */}
          <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d="M10.5 6h3M4 7h4m8 0h4M6 12h12M8 17h8" />
          </svg>
          <span>Configure devices</span>
        </button>
      )}

      {onUploadContent && (
        <button
          type="button"
          onClick={onUploadContent}
          className={btnCls}
          disabled={disabled}
          title="Upload content"
        >
          <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
          </svg>
          <span>Upload content</span>
        </button>
      )}
    </div>
  );
}
