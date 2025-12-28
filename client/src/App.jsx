import { useState, useEffect } from 'react';
import './App.css';
import Login from "./Login";
import Register from "./Register";
import EventBoard from "./EventBoard";
import OrgDashboard from "./OrgDashboard";
import MySignups from "./MySignups";

import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  
  // 1. NEW STATE: Store the stats here
  const [userStats, setUserStats] = useState({ count: 0, hours: 0 }); 

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserName(""); 
    setUserRole("");
    setUserStats({ count: 0, hours: 0 }); // Reset stats
  };

  useEffect(() => {
    const getName = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", {
          method: "GET",
          headers: { token: localStorage.getItem("token") }
        });

        if (!response.ok) {
            handleLogout(); 
            return; 
        }

        const parseRes = await response.json();

        setUserName(parseRes.full_name);
        setUserRole(parseRes.role);
        
        // 2. SAVE STATS: Store the data coming from the backend
        setUserStats({
            count: parseRes.event_count,
            hours: parseRes.total_hours
        });

      } catch (err) {
        console.error(err.message);
        handleLogout();
      }
    };

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

              {/* 3. NEW STATS BAR (Only show for volunteers) */}
              {userRole !== "organization" && (
                  <div style={{ 
                      display: "flex", 
                      justifyContent: "center", 
                      gap: "20px", 
                      marginTop: "20px" 
                  }}>
                      {/* Box 1: Hours */}
                      <div style={{ 
                          backgroundColor: "#fff3e0", 
                          padding: "15px 30px", 
                          borderRadius: "10px", 
                          textAlign: "center",
                          border: "1px solid #fff3e0",
                          minWidth: "150px"
                      }}>
                          <h2 style={{ margin: 0, color: "#e65100", fontSize: "2rem" }}>
                              {Number(userStats.hours).toFixed(1)}
                          </h2>
                          <p style={{ margin: 0, color: "#e65100", fontWeight: "bold" }}>Hours Earned</p>
                      </div>

                      {/* Box 2: Events Attended */}
                      <div style={{ 
                          backgroundColor: "#fff3e0", /* Very light orange background */
                          padding: "15px 30px", 
                          borderRadius: "10px", 
                          textAlign: "center",
                          border: "1px solid #ffcc80", /* Light orange border */
                          minWidth: "150px"
                      }}>
                          {/* Text Color: Dark Orange */}
                          <h2 style={{ margin: 0, color: "#e65100", fontSize: "2rem" }}>
                              {userStats.count}
                          </h2>
                          <p style={{ margin: 0, color: "#e65100", fontWeight: "bold" }}>Events Attended</p>
                      </div>
                  </div>
              )}
            </div>

            {/* LOGIC: Show different dashboards based on Role */}
            {userRole === "organization" ? (
              <OrgDashboard />
            ) : (
              // VOLUNTEER VIEW
              <div style={{ width: "100%" }}>
                  <EventBoard 
                      refreshTrigger={refreshTrigger} 
                      onSignupSuccess={() => setRefreshTrigger(!refreshTrigger)} 
                  />
                  
                  <MySignups 
                      refreshTrigger={refreshTrigger} 
                      onUnregisterSuccess={() => setRefreshTrigger(!refreshTrigger)} 
                  />

              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. ADD THIS AT THE VERY BOTTOM (Inside the outer div) */}
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}

export default App;