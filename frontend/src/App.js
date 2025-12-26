import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/users/Login";
import Signup from "./pages/users/Signup";
import Home from "./pages/users/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
