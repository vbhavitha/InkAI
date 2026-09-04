function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
}) {
  return (
    <button
      type="button"
      className={`inkai-toolbar-button ${
        active ? "active" : ""
      }`}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export default ToolbarButton;