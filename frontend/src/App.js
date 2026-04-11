import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/users/Login";
import Signup from "./pages/users/Signup";
import Home from "./pages/users/Home";
import ForgetPassword from "./pages/users/ForgetPassword";
import Profile from "./pages/users/Profile";
import EditProfile from "./pages/users/EditProfile";
import ShareTrek from "./pages/users/ShareTrek";
import ExploreTrek from "./pages/users/ExploreTrek";
import UserDetail from "./pages/admin/UserDetail";
import Analytics from "./pages/admin/Analytics";
import ProfileTrek from "./pages/users/ProfileTrek";
import ChatPage from "./pages/users/ChatPage";
import FullPost from "./pages/users/FullPost";
import Notification from "./pages/users/Notification";

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

        {/* User Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/explore-trek" element={<ExploreTrek />} />
        <Route path="/share-trek" element={<ShareTrek />} />
        <Route path="/share-trek/:id" element={<ShareTrek />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<ProfileTrek />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/fullpost/:id" element={<FullPost />} />

        {/* Admin Routes */}
        <Route path="/users" element={<UserDetail />} />
        <Route path="/admin/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;