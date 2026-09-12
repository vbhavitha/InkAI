export default function AIResult({
  result,
  loading = false,
  error = null,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border p-4">
        <p>AI is working...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-red-500">
          {error}
        </p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="rounded-xl border p-4">
      <pre className="whitespace-pre-wrap text-sm">
        {typeof result === "string"
          ? result
          : JSON.stringify(
              result,
              null,
              2
            )}
      </pre>
    </div>
  );
}