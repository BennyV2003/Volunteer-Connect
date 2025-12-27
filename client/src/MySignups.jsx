import { useEffect, useState } from "react";

const MySignups = ({ refreshTrigger }) => { // <--- ADD PROP HERE
    const [signups, setSignups] = useState([]);

    useEffect(() => {
        getSignups();
    }, [refreshTrigger]); // <--- ADD DEPENDENCY HERE (Run this when refreshTrigger changes)

    const getSignups = async () => {
        try {
            const response = await fetch("http://localhost:5000/my-signups", {
                headers: { token: localStorage.getItem("token") }
            });
            const jsonData = await response.json();
            setSignups(jsonData);
        } catch (err) {
            console.error(err.message);
        }
    };

    // NEW: Function to handle unregistering
    const handleUnregister = async (eventId) => {
        if (!confirm("Are you sure you want to cancel your registration for this event?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/signup`, {
                method: "DELETE",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                // Remove the item from the list instantly (so we don't need to reload)
                setSignups(signups.filter(event => event.event_id !== eventId));
                alert("You have been unregistered.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div style={{ marginBottom: "50px" }}>
            <h2 style={{ color: "#28a745", borderBottom: "2px solid #28a745", paddingBottom: "10px" }}>
                ✅ My Registered Events
            </h2>
            
            {signups.length === 0 ? (
                <p style={{ color: "#666" }}>You haven't signed up for any events yet.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                    {signups.map(event => (
                        <div key={event.event_id} style={{ 
                            border: "1px solid #c3e6cb", 
                            backgroundColor: "#d4edda", 
                            borderRadius: "10px", 
                            padding: "20px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                        }}>
                            <h3 style={{ margin: "0 0 10px 0", color: "#155724" }}>{event.title}</h3>
                            <p style={{ fontSize: "0.9rem", color: "#155724" }}>📅 {formatDate(event.event_date)}</p>
                            <p style={{ fontSize: "0.9rem", color: "#155724" }}>📍 {event.location}</p>
                            
                            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #c3e6cb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: "bold", color: "#155724" }}>
                                    Status: {event.status === 'attended' ? 'Completed' : 'Registered'}
                                </span>

                                {/* Logic: Only allow unregistering if they haven't already completed it */}
                                {event.status !== 'attended' && (
                                    <button 
                                        onClick={() => handleUnregister(event.event_id)}
                                        style={{ 
                                            backgroundColor: "#dc3545", 
                                            color: "white", 
                                            border: "none", 
                                            padding: "5px 10px", 
                                            borderRadius: "5px", 
                                            cursor: "pointer", 
                                            fontSize: "0.85rem"
                                        }}
                                    >
                                        Unregister
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MySignups;