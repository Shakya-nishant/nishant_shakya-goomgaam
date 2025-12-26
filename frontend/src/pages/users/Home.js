import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove token
    navigate("/"); // redirect to login
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>This is home page. Welcome to GoomGaam.</h2>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Home;
