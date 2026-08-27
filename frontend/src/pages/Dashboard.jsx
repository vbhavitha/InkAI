import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-8 py-4">
        <h1 className="text-2xl font-bold text-indigo-400">
          InkAI Dashboard
        </h1>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        <h2 className="text-4xl font-bold">
          Welcome 👋
        </h2>

        <p className="text-slate-400 mt-2">
          Ready to convert your handwritten notes into digital text?
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">

          <div className="bg-slate-900 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Documents</h3>
            <p className="text-4xl mt-4 font-bold">0</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Storage Used</h3>
            <p className="text-4xl mt-4 font-bold">0 MB</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">OCR History</h3>
            <p className="text-4xl mt-4 font-bold">0</p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Account</h3>
            <p className="text-xl mt-4">Free</p>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="mt-12">

          <h2 className="text-2xl font-bold mb-6">
            Quick Actions
          </h2>

          <div className="flex gap-4 flex-wrap">

            <button
              onClick={() => navigate("/upload")}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl font-semibold transition"
            >
              Upload Notes
            </button>

            <button
              className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition"
            >
              OCR History
            </button>

            <button
              className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition"
            >
              Profile
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;