import { useEffect, useState } from "react";
import CalendarView from "./CalendarView"; // IMPORT THIS

const EventBoard = ({ onSignupSuccess }) => {
    const [events, setEvents] = useState([]);
    const [viewMode, setViewMode] = useState("list"); // NEW: Toggle state

    useEffect(() => {
        getEvents();
    }, []);

    const getEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/events");
            const jsonData = await response.json();

            const now = new Date();
            const activeEvents = jsonData.filter(event => 
                new Date(event.event_date) >= now && !event.is_completed
            );

            setEvents(activeEvents);
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleSignup = async (eventId) => {
        if(!confirm("Do you want to sign up for this event?")) return;

        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/signup`, {
                method: "POST",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                alert("You have successfully signed up!");
                onSignupSuccess(); // <--- CALL THE PARENT HERE!
            } else {
                const errorText = await response.json();
                alert(errorText);
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
        <div style={{ marginTop: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #ddd", paddingBottom: "10px" }}>
                <h2>Upcoming Opportunities</h2>
                
                {/* VIEW TOGGLE BUTTONS */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        onClick={() => setViewMode("list")}
                        style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: viewMode === "list" ? "#4A90E2" : "#eee", color: viewMode === "list" ? "white" : "black", border: "none", borderRadius: "5px" }}
                    >
                        List View
                    </button>
                    <button 
                        onClick={() => setViewMode("calendar")}
                        style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: viewMode === "calendar" ? "#4A90E2" : "#eee", color: viewMode === "calendar" ? "white" : "black", border: "none", borderRadius: "5px" }}
                    >
                        Calendar View
                    </button>
                </div>
            </div>
            
            {events.length === 0 ? (
                <p style={{textAlign: "center", color: "#666", marginTop: "20px"}}>
                    No upcoming volunteer opportunities at the moment. Check back later!
                </p>
            ) : (
                <>
                    {/* CONDITIONAL RENDERING */}
                    {viewMode === "list" ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                            {events.map(event => (
                                <div key={event.event_id} style={{ border: "1px solid #e0e0e0", borderRadius: "10px", padding: "20px", backgroundColor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                                    <h3 style={{ margin: "0 0 10px 0", color: "#4A90E2" }}>{event.title}</h3>
                                    <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "10px" }}>
                                        <strong>Organized by:</strong> {event.organizer}
                                    </p>
                                    <p style={{ color: "#333" }}>{event.description}</p>
                                    <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "15px 0" }} />
                                    <p style={{fontSize: "0.9rem"}}>📍 {event.location}</p>
                                    <p style={{fontSize: "0.9rem"}}>📅 {formatDate(event.event_date)}</p>
                                    <button onClick={() => handleSignup(event.event_id)} style={{ marginTop: "15px", width: "100%", backgroundColor: "#28a745", color: "white", border: "none", padding: "10px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                                        Volunteer Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // PASS THE HANDLER DOWN TO THE CALENDAR
                        <CalendarView events={events} onEventClick={handleSignup} />
                    )}
                </>
            )}
        </div>
    );
};

export default EventBoard;