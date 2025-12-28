import { useState } from "react";

// CHANGE 1: Accept the setToken prop
const Register = ({ setToken }) => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "volunteer" // Default role
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.token) {
                // CHANGE 2: Instead of just alerting, we log them in immediately!
                setToken(data.token);
                // You can remove this alert if you want it to be seamless
                alert("Registration Successful! logging you in..."); 
            } else {
                alert(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ marginTop: "20px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input 
                    type="text" name="full_name" placeholder="Full Name" onChange={handleChange} required 
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input 
                    type="email" name="email" placeholder="Email" onChange={handleChange} required 
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input 
                    type="password" name="password" placeholder="Password" onChange={handleChange} required 
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <select 
                    name="role" onChange={handleChange} 
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                >
                    <option value="volunteer">Volunteer</option>
                    <option value="organization">Organization</option>
                </select>
                <button 
                    type="submit"
                    style={{ 
                        padding: "10px", 
                        backgroundColor: "#FF5E17", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "5px", 
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Register;