import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RichTextEditor from "../components/editor/RichTextEditor";

function EditorPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">
              Document Editor
            </h1>

            <p className="text-slate-400 mt-2">
              Edit and format your converted document.
            </p>
          </div>

          <RichTextEditor />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default EditorPage;