import { useEffect, useState } from "react";
import { toast } from 'react-toastify';

const MySignups = ({ refreshTrigger, onUnregisterSuccess }) => {
    const [signups, setSignups] = useState([]);

    useEffect(() => {
        getSignups();
    }, [refreshTrigger]);

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

    const handleUnregister = async (eventId) => {
        if (!confirm("Are you sure you want to unregister from this event?")) {
            return;
        }

        try {
            // RESTORED THE FETCH CALL HERE
            const response = await fetch(`http://localhost:5000/events/${eventId}/signup`, {
                method: "DELETE",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                toast.info("🗑️ You have unregistered from the event."); 
                setSignups(signups.filter(event => event.event_id !== eventId));
                if (onUnregisterSuccess) onUnregisterSuccess();
            } else {
                toast.error("❌ Could not unregister.");
            }
        } catch (err) {
             console.error(err);
             toast.error("Server Error");
        }
    };

    const formatEventTime = (startString, endString) => {
        const start = new Date(startString);
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };

        const dateText = start.toLocaleDateString(undefined, dateOptions);
        const startTime = start.toLocaleTimeString(undefined, timeOptions);

        if (!endString) return `${dateText} @ ${startTime}`;

        const end = new Date(endString);
        const endTime = end.toLocaleTimeString(undefined, timeOptions);
        return `${dateText} | ${startTime} - ${endTime}`;
    };

    // --- FILTER LOGIC ---
    // 1. Active: Not completed yet
    const activeEvents = signups.filter(event => !event.is_completed);
    
    // 2. Completed: Marked as completed by organizer
    const completedEvents = signups.filter(event => event.is_completed);

    return (
        <div style={{ marginBottom: "50px" }}>
            
            {/* --- SECTION 1: ACTIVE EVENTS --- */}
            <h2 style={{ color: "#FF5E17", borderBottom: "2px solid #FF5E17", paddingBottom: "10px" }}>
                ✅ My Registered Events
            </h2>
            
            {activeEvents.length === 0 ? (
                <p style={{ color: "#666", marginBottom: "30px" }}>You have no active registrations.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px", marginBottom: "40px" }}>
                    {activeEvents.map(event => (
                        <div key={event.event_id} style={{ border: "1px solid #c3e6cb", backgroundColor: "#d4edda", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                            <h3 style={{ margin: "0 0 10px 0", color: "#155724" }}>{event.title}</h3>
                            <p style={{ fontSize: "0.9rem", color: "#155724" }}>📅 {formatEventTime(event.event_date, event.event_end)}</p>
                            <p style={{ fontSize: "0.9rem", color: "#155724" }}>📍 {event.location}</p>
                            
                            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #c3e6cb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: "bold", color: "#155724" }}>
                                    Status: Registered
                                </span>
                                <button 
                                    onClick={() => handleUnregister(event.event_id)}
                                    style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "0.85rem" }}
                                >
                                    Unregister
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- SECTION 2: COMPLETED EVENTS --- */}
            {completedEvents.length > 0 && (
                <div style={{ marginTop: "50px" }}>
                    <h2 style={{ color: "#6c757d", borderBottom: "2px solid #6c757d", paddingBottom: "10px" }}>
                        📜 My Completed Events
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                        {completedEvents.map(event => (
                            <div key={event.event_id} style={{ border: "1px solid #ddd", backgroundColor: "#f8f9fa", borderRadius: "10px", padding: "20px", opacity: 0.9 }}>
                                <h3 style={{ margin: "0 0 10px 0", color: "#495057" }}>{event.title}</h3>
                                <p style={{ fontSize: "0.9rem", color: "#6c757d" }}>📅 {formatEventTime(event.event_date, event.event_end)}</p>
                                
                                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ddd" }}>
                                    {/* STATUS BADGES */}
                                    {event.status === 'attended' ? (
                                        <div>
                                            <div style={{ marginBottom: "10px" }}>
                                                <span style={{ backgroundColor: "#28a745", color: "white", padding: "5px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                                                    Attended
                                                </span>
                                                <span style={{ marginLeft: "10px", fontWeight: "bold", color: "#28a745" }}>
                                                    +{Number(event.hours_awarded || 0).toFixed(2)} Hrs
                                                </span>
                                            </div>
                                            
                                            {/* NEW: Display the actual recorded times */}
                                            {event.check_in_time && event.check_out_time && (
                                                <p style={{ fontSize: "0.85rem", color: "#555", margin: 0, fontStyle: "italic" }}>
                                                    <strong>Recorded Time:</strong><br/>
                                                    {new Date(event.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                                    {new Date(event.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            )}
                                        </div>
                                    ) : event.status === 'absent' ? (
                                        <span style={{ backgroundColor: "#dc3545", color: "white", padding: "5px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                                            Absent
                                        </span>
                                    ) : (
                                        <span style={{ backgroundColor: "#6c757d", color: "white", padding: "5px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                                            Event Closed (No Status)
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySignups;