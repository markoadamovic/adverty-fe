const ActionButton = ({ label, title, variant = "default", onClick }) => {
    const base =
      "px-2 py-1 text-xs rounded-md border transition focus:outline-none focus:ring-2 focus:ring-offset-1"
    const styles = {
      default: `${base} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`,
      success: `${base} bg-green-600 text-white border-green-600 hover:bg-green-700`,
      warn: `${base} bg-orange-600 text-white border-orange-600 hover:bg-orange-700`,
      danger: `${base} bg-rose-600 text-white border-rose-600 hover:bg-rose-700`,
    }
    return (
      <button
        type="button"
        title={title}
        className={styles[variant] || styles.default}
        onClick={onClick}
      >
        {label}
      </button>
    )
  }