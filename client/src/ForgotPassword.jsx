import React, { useState } from "react";

const ForgotPassword = ({ setAuthView }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const body = { email };
      const response = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const parseRes = await response.json();
      setMessage(parseRes);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="container mt-2 text-center">
      <h2>Forgot Password</h2>
      <p style={{ color: "#666" }}>Enter your email to receive a reset link.</p>
      
      <form onSubmit={onSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
        <input
          type="email"
          placeholder="Email Address"
          className="form-control"
          style={{ width: "80%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button style={{ width: "80%", padding: "10px", backgroundColor: "#FF5E17", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          Send Reset Link
        </button>
      </form>

      {message && <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e0f7fa", color: "#006064", borderRadius: "5px" }}>{message}</div>}
      
      <p className="toggle-text" onClick={() => setAuthView("login")} style={{ marginTop: "20px", cursor: "pointer", color: "#FF5E17", textDecoration: "underline" }}>
        Back to Login
      </p>
    </div>
  );
};

export default ForgotPassword;