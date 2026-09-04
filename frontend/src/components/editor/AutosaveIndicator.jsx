import { useState } from "react";

function AutosaveIndicator({
  status,
  lastSavedAt,
}) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusText = () => {
    switch (status) {
      case "saving":
        return "Saving...";

      case "error":
        return "Save failed";

      case "offline":
        return "Saved locally";

      case "saved":
      default:
        return "Saved";
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case "saving":
        return "inkai-save-status saving";

      case "error":
        return "inkai-save-status error";

      case "offline":
        return "inkai-save-status offline";

      case "saved":
      default:
        return "inkai-save-status saved";
    }
  };

  const formatTime = () => {
    if (!lastSavedAt) {
      return "Not saved yet";
    }

    return lastSavedAt.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="inkai-autosave-wrapper">
      <button
        type="button"
        className={getStatusClass()}
        onClick={() => setShowDetails((previous) => !previous)}
        title="Click to view save information"
      >
        <span className="inkai-save-dot" />
        <span>{getStatusText()}</span>
      </button>

      {showDetails && (
        <div className="inkai-save-details">
          <div className="inkai-save-details-title">
            Last saved:
          </div>

          <div className="inkai-save-details-time">
            {formatTime()}
          </div>
        </div>
      )}
    </div>
  );
}

export default AutosaveIndicator;