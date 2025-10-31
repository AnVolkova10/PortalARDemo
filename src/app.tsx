import { Route, Routes } from "react-router-dom";
import Landing from "./routes/Landing";
import PortalRoute from "./routes/Portal";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/portal" element={<PortalRoute />} />
    </Routes>
  );
}

export default App;
