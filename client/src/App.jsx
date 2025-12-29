import { useState, useEffect } from 'react';
import './App.css';
import Login from "./Login";
import Register from "./Register";
import EventBoard from "./EventBoard";
import OrgDashboard from "./OrgDashboard";
import MySignups from "./MySignups";
import Leaderboard from "./Leaderboard"; // <--- IMPORT
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStats, setUserStats] = useState({ count: 0, hours: 0 }); 

  // NEW: View State (dashboard | leaderboard)
  const [currentView, setCurrentView] = useState("dashboard");

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserName(""); 
    setUserRole("");
    setUserStats({ count: 0, hours: 0 });
    setCurrentView("dashboard"); // Reset view
  };

  useEffect(() => {
    const getName = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", {
          method: "GET",
          headers: { token: localStorage.getItem("token") }
        });

        if (!response.ok) { handleLogout(); return; }

        const parseRes = await response.json();
        setUserName(parseRes.full_name);
        setUserRole(parseRes.role);
        setUserStats({ count: parseRes.event_count, hours: parseRes.total_hours });

      } catch (err) {
        console.error(err.message);
        handleLogout();
      }
    };

    if (token) getName();
  }, [token]);

  const [refreshTrigger, setRefreshTrigger] = useState(false);
  
  // Navigation Link Styles
  const navLinkStyle = {
      color: "white", 
      textDecoration: "none", 
      marginRight: "20px", 
      fontWeight: "bold", 
      cursor: "pointer",
      opacity: 0.9
  };

  const activeLinkStyle = {
      ...navLinkStyle,
      textDecoration: "underline",
      opacity: 1
  };

  return (
    <div>
      {/* BANNER WITH NAVIGATION */}
      <div className="banner">
        <div style={{ display: "flex", alignItems: "center" }}>
            <h1 style={{ marginRight: "40px" }}>VolunteerConnect</h1>
            
            {/* NEW: Navigation Menu (Only show if logged in) */}
            {token && (
                <nav>
                    <span 
                        onClick={() => setCurrentView("dashboard")} 
                        style={currentView === "dashboard" ? activeLinkStyle : navLinkStyle}
                    >
                        Dashboard
                    </span>
                    <span 
                        onClick={() => setCurrentView("leaderboard")} 
                        style={currentView === "leaderboard" ? activeLinkStyle : navLinkStyle}
                    >
                        Leaderboard
                    </span>
                </nav>
            )}
        </div>

        {token && (
          <button 
            onClick={handleLogout} 
            style={{ padding: "5px 15px", cursor: "pointer", backgroundColor: "white", color: "#FF5E17", border: "none", borderRadius: "20px", fontWeight: "bold" }}
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
            {isLogin ? <Login setToken={handleAuthSuccess} /> : <Register setToken={handleAuthSuccess} />}
            <p className="toggle-text" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? <>Don't have an account? <span>Sign Up</span></> : <>Already have an account? <span>Login</span></>}
            </p>
          </div>
        ) : (
          /* MAIN CONTENT AREA */
          <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            
            {/* VIEW 1: LEADERBOARD */}
              {currentView === "leaderboard" ? (
                  // Pass the user's full name here
                  <Leaderboard currentUser={userName} />
            ) : (
                /* VIEW 2: DASHBOARD */
                <>
                    <div style={{ textAlign: "center", marginBottom: "30px" }}>
                      <h1>Welcome back, {userName}!</h1>
                      <p style={{ color: "#666" }}>
                        Account Type: <strong style={{ textTransform: "capitalize" }}>{userRole}</strong>
                      </p>

                      {/* STATS BAR (Volunteers Only) */}
                      {userRole !== "organization" && (
                          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                              {/* Box 1: Hours */}
                              <div style={{ backgroundColor: "#fff3e0", padding: "15px 30px", borderRadius: "10px", textAlign: "center", border: "1px solid #ffcc80", minWidth: "150px" }}>
                                  <h2 style={{ margin: 0, color: "#e65100", fontSize: "2rem" }}>{Number(userStats.hours).toFixed(1)}</h2>
                                  <p style={{ margin: 0, color: "#e65100", fontWeight: "bold" }}>Hours Earned</p>
                              </div>
                              {/* Box 2: Events */}
                              <div style={{ backgroundColor: "#fff3e0", padding: "15px 30px", borderRadius: "10px", textAlign: "center", border: "1px solid #ffcc80", minWidth: "150px" }}>
                                  <h2 style={{ margin: 0, color: "#e65100", fontSize: "2rem" }}>{userStats.count}</h2>
                                  <p style={{ margin: 0, color: "#e65100", fontWeight: "bold" }}>Events Attended</p>
                              </div>
                          </div>
                      )}
                    </div>

                    {/* ROLE BASED DASHBOARDS */}
                    {userRole === "organization" ? (
                      <OrgDashboard />
                    ) : (
                      <div style={{ width: "100%" }}>
                          <EventBoard 
                              refreshTrigger={refreshTrigger} 
                              onSignupSuccess={() => setRefreshTrigger(!refreshTrigger)} 
                          />
                          <MySignups 
                              userName={userName}
                              refreshTrigger={refreshTrigger} 
                              onUnregisterSuccess={() => setRefreshTrigger(!refreshTrigger)} 
                          />
                      </div>
                    )}
                </>
            )}
          </div>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}

export default App;