import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UploadPage from "./pages/UploadPage";
import OCRResultsPage from "./pages/OCRResultsPage";
import EditorPage from "./pages/EditorPage";
import HandwritingGeneratorPage from "./pages/HandwritingGeneratorPage";
import AssignmentPage from "./pages/AssignmentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/upload" element={<UploadPage />} />

        <Route path="/ocr-results" element={<OCRResultsPage />} />

        <Route path="/editor" element={<EditorPage />} />

        <Route path="/handwriting" element={<HandwritingGeneratorPage />} />

        <Route path="/assignment" element={<AssignmentPage />}/>


      </Routes>
    </BrowserRouter>
  );
}

export default App;