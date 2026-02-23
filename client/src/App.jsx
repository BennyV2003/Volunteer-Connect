import { useState, useEffect } from 'react';
import './App.css';
import Login from "./Login";
import Register from "./Register";
import EventBoard from "./EventBoard";
import OrgDashboard from "./OrgDashboard";
import MySignups from "./MySignups";
import Leaderboard from "./Leaderboard"; 
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import { calculateLevelInfo } from "./utils/gamification";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  
  // CHANGED: We now use a string to track which auth screen to show
  const [authView, setAuthView] = useState("login"); // "login", "register", "forgot", "reset"
  const [urlResetToken, setUrlResetToken] = useState("");

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStats, setUserStats] = useState({ count: 0, hours: 0 }); 
  const [currentView, setCurrentView] = useState("dashboard");

  // --- GAMIFICATION LOGIC ---
  const levelInfo = calculateLevelInfo(userStats.hours || 0);

  // NEW: Catch the reset link from the URL when the app loads
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/reset-password/")) {
      const tokenFromUrl = path.split("/")[2]; // Grabs the token part of the URL
      setUrlResetToken(tokenFromUrl);
      setAuthView("reset");
    }
  }, []);

  const handleAuthSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    // Reset the URL so the reset token disappears from the top bar
    window.history.replaceState(null, "", "/"); 
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserName(""); 
    setUserRole("");
    setUserStats({ count: 0, hours: 0 });
    setCurrentView("dashboard");
    setAuthView("login");
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
        setUserStats({ count: parseRes.event_count, hours: Number(parseRes.total_hours) });

      } catch (err) {
        console.error(err.message);
        handleLogout();
      }
    };

    if (token) getName();
  }, [token]);

  const [refreshTrigger, setRefreshTrigger] = useState(false);
  
  const navLinkStyle = { color: "white", textDecoration: "none", marginRight: "20px", fontWeight: "bold", cursor: "pointer", opacity: 0.9 };
  const activeLinkStyle = { ...navLinkStyle, textDecoration: "underline", opacity: 1 };

  return (
    <div>
      {/* BANNER WITH NAVIGATION */}
      <div className="banner">
        <div style={{ display: "flex", alignItems: "center" }}>
            <h1 style={{ marginRight: "40px" }}>VolunteerConnect</h1>
            {token && (
                <nav>
                    <span onClick={() => setCurrentView("dashboard")} style={currentView === "dashboard" ? activeLinkStyle : navLinkStyle}>Dashboard</span>
                    <span onClick={() => setCurrentView("leaderboard")} style={currentView === "leaderboard" ? activeLinkStyle : navLinkStyle}>Leaderboard</span>
                </nav>
            )}
        </div>
        {token && (
          <button onClick={handleLogout} style={{ padding: "5px 15px", cursor: "pointer", backgroundColor: "white", color: "#FF5E17", border: "none", borderRadius: "20px", fontWeight: "bold" }}>
            Logout
          </button>
        )}
      </div>

      <div className="main-container">
        {!token ? (
          <div className="auth-box">
            
            {/* AUTHENTICATION ROUTING LOGIC */}
            {authView === "login" && (
              <>
                <h2>Welcome Back</h2>
                <p style={{ marginBottom: "20px", color: "#666" }}>Login to access your dashboard</p>
                <Login setToken={handleAuthSuccess} />
                <p className="toggle-text" onClick={() => setAuthView("register")}>
                  Don't have an account? <span>Sign Up</span>
                </p>
                <p className="toggle-text" onClick={() => setAuthView("forgot")} style={{ marginTop: "-10px" }}>
                  <span>Forgot Password?</span>
                </p>
              </>
            )}

            {authView === "register" && (
              <>
                <h2>Join Us</h2>
                <p style={{ marginBottom: "20px", color: "#666" }}>Create an account to get started</p>
                <Register setToken={handleAuthSuccess} />
                <p className="toggle-text" onClick={() => setAuthView("login")}>
                  Already have an account? <span>Login</span>
                </p>
              </>
            )}

            {authView === "forgot" && <ForgotPassword setAuthView={setAuthView} />}
            {authView === "reset" && <ResetPassword resetToken={urlResetToken} setAuthView={setAuthView} />}

          </div>
        ) : (
          /* MAIN CONTENT AREA */
          <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            
            {currentView === "leaderboard" ? (
                <Leaderboard currentUser={userName} />
            ) : (
                /* DASHBOARD VIEW */
                <>
                    <div style={{ textAlign: "center", marginBottom: "30px" }}>
                      <h1 style={{ marginBottom: "10px" }}>Welcome back, {userName}!</h1>
                      
                      {/* LEVEL & TITLE DISPLAY */}
                      {userRole !== "organization" && (
                          <div style={{ marginBottom: "25px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#555" }}>
                                  Level {levelInfo.currentLevel} - <span style={{ color: levelInfo.tierColor, fontWeight: "900" }}>{levelInfo.currentTitle}</span>
                              </div>

                              {/* PROGRESS BAR */}
                              <div style={{ 
                                  width: "100%", maxWidth: "400px", height: "12px", 
                                  backgroundColor: "#e0e0e0", borderRadius: "10px", 
                                  marginTop: "10px", position: "relative", overflow: "hidden" 
                              }}>
                                  <div style={{ 
                                      height: "100%", 
                                      width: `${levelInfo.progressPercent}%`, 
                                      backgroundColor: levelInfo.tierColor,
                                      borderRadius: "10px",
                                      transition: "width 0.5s ease-in-out" 
                                  }}></div>
                              </div>
                              <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "5px" }}>
                                  {levelInfo.currentLevel < 100 
                                    ? `${(levelInfo.nextLevelHours - userStats.hours).toFixed(1)} hours to next level` 
                                    : "Max Level Reached!"}
                              </p>
                          </div>
                      )}
                      
                      <p style={{ color: "#666" }}>
                        Account Type: <strong style={{ textTransform: "capitalize" }}>{userRole}</strong>
                      </p>

                      {/* STATS BAR */}
                      {userRole !== "organization" && (
                          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                              <div style={{ backgroundColor: "#fff3e0", padding: "15px 30px", borderRadius: "10px", textAlign: "center", border: "1px solid #ffcc80", minWidth: "150px" }}>
                                  <h2 style={{ margin: 0, color: "#e65100", fontSize: "2rem" }}>{Number(userStats.hours).toFixed(1)}</h2>
                                  <p style={{ margin: 0, color: "#e65100", fontWeight: "bold" }}>Hours Earned</p>
                              </div>
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