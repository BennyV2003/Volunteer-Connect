import { useState, useEffect } from 'react';
import './App.css';
import Login from "./Login";
import Register from "./Register";
import EventBoard from "./EventBoard";
import OrgDashboard from "./OrgDashboard";
import MySignups from "./MySignups";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);

  // State to store user info
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserName(""); // Clear name on logout
    setUserRole("");
  };

  // Effect to fetch user data whenever the token changes
  useEffect(() => {
    const getName = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", {
          method: "GET",
          headers: { token: localStorage.getItem("token") }
        });

        const parseRes = await response.json();

        // Save the name and role to state
        setUserName(parseRes.full_name);
        setUserRole(parseRes.role);

      } catch (err) {
        console.error(err.message);
      }
    };

    // Only try to fetch if we actually have a token
    if (token) {
      getName();
    }
  }, [token]);

  const [refreshTrigger, setRefreshTrigger] = useState(false);
  
  return (
    <div>
      <div className="banner">
        <h1>VolunteerConnect</h1>
        {token && (
          <button 
            onClick={handleLogout} 
            style={{ padding: "5px 10px", cursor: "pointer" }}
          >
            Logout
          </button>
        )}
      </div>

      <div className="main-container">
        {!token ? (
          <div className="auth-box">
            <h2>{isLogin ? "Welcome Back" : "Join Us"}</h2>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              {isLogin ? "Login to access your dashboard" : "Create an account to get started"}
            </p>

            {isLogin ? (
              <Login setToken={handleAuthSuccess} />
            ) : (
              <Register setToken={handleAuthSuccess} />
            )}

            <p className="toggle-text" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? (
                <>Don't have an account? <span>Sign Up</span></>
              ) : (
                <>Already have an account? <span>Login</span></>
              )}
            </p>
          </div>
        ) : (
          /* DASHBOARD SECTION */
          <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <h1>Welcome back, {userName}!</h1>
              <p style={{ color: "#666" }}>
                Account Type: <strong style={{ textTransform: "capitalize" }}>{userRole}</strong>
              </p>
            </div>

            {/* LOGIC: Show different dashboards based on Role */}
            {userRole === "organization" ? (
              // If Org: Show the Management Dashboard (Create + My Events)
              <OrgDashboard />
            ) : (
              // VOLUNTEER VIEW
              <div style={{ width: "100%" }}>
                  {/* 2. Pass the signal to MySignups (so it listens) */}
                  <MySignups refreshTrigger={refreshTrigger} />
           
                  {/* 3. Pass the 'ringer' to EventBoard (so it can trigger the update) */}
                  <EventBoard onSignupSuccess={() => setRefreshTrigger(!refreshTrigger)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;