import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/users/Login";
import Signup from "./pages/users/Signup";
import Home from "./pages/users/Home";
import ForgetPassword from "./pages/users/ForgetPassword";
import Profile from "./pages/users/Profile";
import EditProfile from "./pages/users/EditProfile";
import ShareTrek from "./pages/users/ShareTrek";
import ExploreTrek from "./pages/users/ExploreTrek"; // ✅ import new page
import UserDetail from "./pages/admin/UserDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        {/* User & Admin Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/explore-trek" element={<ExploreTrek />} />{" "}
        {/* ✅ new route */}
        <Route path="/share-trek" element={<ShareTrek />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/users" element={<UserDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
