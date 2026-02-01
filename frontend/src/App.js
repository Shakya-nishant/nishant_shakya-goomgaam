import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/users/Login";
import Signup from "./pages/users/Signup";
import Home from "./pages/users/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* User Home */}
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
