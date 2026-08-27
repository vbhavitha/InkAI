import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OCRPage() {

    return (

        <div className="min-h-screen bg-slate-950 flex flex-col">

            <Navbar />

            <main className="flex-1">

                <section className="max-w-7xl mx-auto px-6 py-12">

                    <h1 className="text-4xl font-bold text-white">
                        OCR Processing
                    </h1>

                    <p className="text-slate-400 mt-3">
                        Your uploaded documents are ready for OCR processing.
                    </p>

                    <div
                        className="
                            mt-10
                            p-10
                            rounded-2xl
                            bg-slate-900
                            border
                            border-slate-800
                            text-center
                        "
                    >

                        <p className="text-slate-300">
                            OCR processing will be implemented here.
                        </p>

                    </div>

                </section>

            </main>

            <Footer />

        </div>

    );

}

export default OCRPage;