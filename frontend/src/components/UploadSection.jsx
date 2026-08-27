export default function UploadSection() {
  return (
    <div className="max-w-4xl mx-auto">

      <div className="bg-slate-800 rounded-2xl p-10 shadow-xl">

        <h2 className="text-3xl font-bold text-center mb-8">
          Upload Your Notes
        </h2>

        <div className="border-2 border-dashed border-slate-500 rounded-xl p-16 text-center">

          <p className="text-slate-300">
            Drag & Drop your handwritten notes here
          </p>

          <p className="text-slate-500 mt-2">
            or
          </p>

          <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl transition">
            Browse Files
          </button>

        </div>

      </div>

    </div>
  );
}