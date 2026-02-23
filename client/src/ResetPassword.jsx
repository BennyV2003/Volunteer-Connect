import React, { useState } from "react";

const ResetPassword = ({ resetToken, setAuthView }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); // NEW: Tracks if reset was successful

  const onSubmitForm = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match! Please try again.");
      return; 
    }

    try {
      const body = { token: resetToken, newPassword };
      const response = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const parseRes = await response.json();
      setMessage(parseRes); 

      // NEW: If the server returns a successful response, hide the form!
      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="container mt-2 text-center">
      <h2>Reset Password</h2>
      
      {/* CONDITIONAL RENDERING: If NOT successful yet, show the form */}
      {!isSuccess ? (
        <>
          <p style={{ color: "#666" }}>Please enter your new password below.</p>
          <form onSubmit={onSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", marginTop: "15px" }}>
            <input
              type="password"
              placeholder="New Password"
              className="form-control"
              style={{ width: "80%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6" 
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="form-control"
              style={{ width: "80%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
              autoComplete="new-password"
            />
            <button style={{ width: "80%", padding: "10px", backgroundColor: "#FF5E17", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>
              Confirm Password Reset
            </button>
          </form>

          {/* Error message ONLY (Turns red) */}
          {message && (
            <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "5px" }}>
              {message}
            </div>
          )}

          <p className="toggle-text" onClick={() => setAuthView("login")} style={{ marginTop: "20px", cursor: "pointer", color: "#FF5E17", textDecoration: "underline" }}>
            Go to Login
          </p>
        </>
      ) : (
        /* CONDITIONAL RENDERING: If successful, hide the form and show this instead */
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "80%", padding: "20px", backgroundColor: "#e0f7fa", color: "#006064", borderRadius: "5px", marginBottom: "20px", border: "1px solid #b2ebf2" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Success!</h4>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
          
          {/* Replaced the text link with a nice big button to go back to login */}
          <button 
            onClick={() => setAuthView("login")} 
            style={{ width: "80%", padding: "10px", backgroundColor: "#FF5E17", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;