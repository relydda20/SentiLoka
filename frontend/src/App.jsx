import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import CaseStudies from "./pages/CaseStudies"; // ⬅️ tambahin import ini

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/case-studies" element={<CaseStudies />} /> {/* ⬅️ route baru */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
