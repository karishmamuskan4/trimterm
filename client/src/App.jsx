import { Navigate, Route, Routes } from "react-router-dom";
import ExplorePage from "./pages/ExplorePage";
import PracticePage from "./pages/PracticePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ExplorePage />} />
      <Route path="/practice/:id" element={<PracticePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
