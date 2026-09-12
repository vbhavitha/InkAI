export default function AIToolCard({
  title,
  description,
  icon,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border p-4 text-left",
        "transition-all",
        "hover:shadow-md",
        active
          ? "border-blue-500"
          : "border-gray-200",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="text-xl">
            {icon}
          </span>
        )}

        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="mt-1 text-sm opacity-70">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}