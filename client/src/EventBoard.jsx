import { useEffect, useState } from "react";
import CalendarView from "./CalendarView";
import { toast } from 'react-toastify';

const EventBoard = ({ onSignupSuccess, refreshTrigger }) => {
    const [events, setEvents] = useState([]);
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'

    useEffect(() => {
        getEvents();
    }, [refreshTrigger]); // Listen for refreshes from App.jsx

    const getEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/events");
            const jsonData = await response.json();

            const now = new Date();
            // Filter: Only show future events that aren't completed
            const activeEvents = jsonData.filter(event => 
                new Date(event.event_date) >= now && !event.is_completed
            );

            setEvents(activeEvents);
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleSignup = async (eventId) => {
        // Keep confirm() for safety!
        if(!confirm("Do you want to sign up for this event?")) return;

        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/signup`, {
                method: "POST",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                // OLD: alert("You have successfully signed up!");
                toast.success("🎉 Successfully signed up!"); // NEW
                if (onSignupSuccess) onSignupSuccess(); 
            } else {
                const errorText = await response.json();
                // OLD: alert(errorText);
                toast.error(`❌ ${errorText}`); // NEW
            }
        } catch (err) {
            console.error(err);
            toast.error("Server Error");
        }
    };

    // Helper: Format "Start - End" nicely
    const formatEventTime = (startString, endString) => {
        const start = new Date(startString);
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };

        const dateText = start.toLocaleDateString(undefined, dateOptions);
        const startTime = start.toLocaleTimeString(undefined, timeOptions);

        if (!endString) {
            return `${dateText} @ ${startTime}`;
        }

        const end = new Date(endString);
        const endTime = end.toLocaleTimeString(undefined, timeOptions);

        return `${dateText} | ${startTime} - ${endTime}`;
    };

    return (
        <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #ddd", paddingBottom: "10px" }}>
                <h2>Upcoming Opportunities</h2>
                
                {/* VIEW TOGGLE BUTTONS */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        onClick={() => setViewMode("list")}
                        style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: viewMode === "list" ? "#FF5E17" : "#eee", color: viewMode === "list" ? "white" : "black", border: "none", borderRadius: "5px" }}
                    >
                        List View
                    </button>
                    <button 
                        onClick={() => setViewMode("calendar")}
                        style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: viewMode === "calendar" ? "#FF5E17" : "#eee", color: viewMode === "calendar" ? "white" : "black", border: "none", borderRadius: "5px" }}
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
                    {/* CONDITIONAL RENDERING: LIST vs CALENDAR */}
                    {viewMode === "list" ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                            {events.map(event => (
                                <div key={event.event_id} style={{ border: "1px solid #e0e0e0", borderRadius: "10px", padding: "20px", backgroundColor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                                    <h3 style={{ margin: "0 0 10px 0", color: "#4A90E2" }}>{event.title}</h3>
                                    
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <p style={{fontSize: "0.9rem", margin: 0, color: "#666"}}>
                                            <strong>Organized by:</strong> {event.organizer}
                                        </p>
                                        
                                        {/* CAPACITY BADGE */}
                                        {event.capacity ? (
                                            <span style={{ 
                                                fontSize: "0.85rem", 
                                                fontWeight: "bold", 
                                                color: event.current_count >= event.capacity ? "#721c24" : "#ffffffff",
                                                backgroundColor: event.current_count >= event.capacity ? "#FF5E17" : "#FF5E17",
                                                padding: "3px 8px", 
                                                borderRadius: "10px"
                                            }}>
                                                👥 {event.current_count} / {event.capacity} Filled
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: "0.85rem", color: "#666", backgroundColor: "#eee", padding: "3px 8px", borderRadius: "10px" }}>
                                                👥 Open
                                            </span>
                                        )}
                                    </div>

                                    <p style={{ color: "#333" }}>{event.description}</p>
                                    <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "15px 0" }} />
                                    
                                    <p style={{fontSize: "0.9rem", color: "#555"}}>📍 {event.location}</p>
                                    <p style={{fontSize: "0.9rem", color: "#555"}}>📅 {formatEventTime(event.event_date, event.event_end)}</p>
                                    
                                    <button 
                                        onClick={() => handleSignup(event.event_id)} 
                                        disabled={event.capacity && event.current_count >= event.capacity}
                                        style={{ 
                                            marginTop: "15px", 
                                            width: "100%", 
                                            backgroundColor: (event.capacity && event.current_count >= event.capacity) ? "#ccc" : "#FF5E17", 
                                            color: "white", 
                                            border: "none", 
                                            padding: "10px", 
                                            borderRadius: "5px", 
                                            cursor: (event.capacity && event.current_count >= event.capacity) ? "not-allowed" : "pointer", 
                                            fontWeight: "bold" 
                                        }}
                                    >
                                        {(event.capacity && event.current_count >= event.capacity) ? "Full Capacity" : "Volunteer Now"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // CALENDAR VIEW
                        <CalendarView events={events} onEventClick={handleSignup} />
                    )}
                </>
            )}
        </div>
    );
};

export default EventBoard;