import { useState } from "react";

// CHANGE 1: We accept 'setToken' as a prop here. 
// (The curly braces { } are super important!)
const Login = ({ setToken }) => {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();

            if (data.token) {
                // CHANGE 2: Instead of just saving to localStorage, 
                // we call the function passed down from App.jsx.
                // This triggers the screen to refresh!
                setToken(data.token); 
                
                // (Optional: You can remove the alert if you want it to be instant)
                // alert("Login Successful!"); 
            } else {
                alert(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ marginTop: "20px" }}> 
            {/* Added a little style to separate it from the toggle text */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input 
                    type="email" 
                    name="email" 
                    placeholder="Email" 
                    onChange={handleChange} 
                    required 
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input 
                    type="password" 
                    name="password" 
                    placeholder="Password" 
                    onChange={handleChange} 
                    required 
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
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
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;