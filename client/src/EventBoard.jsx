import { useEffect, useState } from "react";
import CalendarView from "./CalendarView";
import { toast } from 'react-toastify';

const EventBoard = ({ refreshTrigger, onSignupSuccess }) => {
    const [events, setEvents] = useState([]);
    const [mySignupIds, setMySignupIds] = useState(new Set()); // NEW: Track registered IDs
    const [view, setView] = useState('list'); 
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch Events AND My Signups whenever refreshTrigger changes
    useEffect(() => {
        const getData = async () => {
            try {
                const token = localStorage.getItem("token");

                // 1. Get All Events
                const eventsRes = await fetch("http://localhost:5000/events", { 
                    headers: { token } 
                });
                const eventsData = await eventsRes.json();
                
                // 2. Get My Signups (To know what to hide)
                const signupsRes = await fetch("http://localhost:5000/my-signups", { 
                    headers: { token } 
                });
                const signupsData = await signupsRes.json();
                
                // Create a Set of IDs for fast lookup
                const ids = new Set(signupsData.map(s => s.event_id));
                setMySignupIds(ids);

                // Only show active events (not completed ones)
                const activeEvents = eventsData.filter(e => !e.is_completed);
                setEvents(activeEvents);

            } catch (err) {
                console.error(err.message);
            }
        };
        getData();
    }, [refreshTrigger]);

    const handleSignup = async (eventId) => {
        if(!confirm("Do you want to sign up for this event?")) return;

        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/signup`, {
                method: "POST",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                toast.success("🎉 Successfully signed up!");
                if (onSignupSuccess) onSignupSuccess(); 
            } else {
                const errorText = await response.text();
                toast.error(`❌ ${errorText}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Server Error");
        }
    };

    // Filter events: Matches Search AND is NOT in mySignupIds
    const filteredEvents = events.filter(event => 
        (event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !mySignupIds.has(event.event_id) // <--- THIS HIDES REGISTERED EVENTS
    );

    // Helper to format date nicely (Start | Start - End)
    const formatEventTime = (startString, endString) => {
        const start = new Date(startString);
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };

        const dateText = start.toLocaleDateString(undefined, dateOptions);
        const startTime = start.toLocaleTimeString(undefined, timeOptions);

        if (!endString) return `${dateText}, ${startTime}`;

        const end = new Date(endString);
        const endTime = end.toLocaleTimeString(undefined, timeOptions);
        
        return `${dateText} | ${startTime} - ${endTime}`;
    };

    return (
        <div>
            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#333" }}>Upcoming Opportunities</h2>
                
                <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        onClick={() => setView('list')}
                        style={{ 
                            padding: "8px 15px", 
                            backgroundColor: view === 'list' ? "#e9ecef" : "transparent", 
                            border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer",
                            fontWeight: view === 'list' ? "bold" : "normal"
                        }}
                    >
                        List View
                    </button>
                    <button 
                        onClick={() => setView('calendar')}
                        style={{ 
                            padding: "8px 15px", 
                            backgroundColor: view === 'calendar' ? "#4A90E2" : "transparent", 
                            color: view === 'calendar' ? "white" : "black",
                            border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer",
                            fontWeight: view === 'calendar' ? "bold" : "normal"
                        }}
                    >
                        Calendar View
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {view === 'list' && (
                <input 
                    type="text" placeholder="🔍 Search events..." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem" }}
                />
            )}

            {/* VIEW SWITCHER */}
            {view === 'calendar' ? (
                <CalendarView events={events} onEventClick={handleSignup} />
            ) : (
                /* LIST VIEW */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                    {filteredEvents.length === 0 ? (
                        <p style={{ color: "#777" }}>No new opportunities at the moment.</p>
                    ) : (
                        filteredEvents.map(event => (
                            <div key={event.event_id} style={{ 
                                backgroundColor: "white", padding: "20px", borderRadius: "10px", 
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "5px solid #FF5E17", // UTRGV Orange
                                display: "flex", flexDirection: "column", justifyContent: "space-between"
                            }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                        <h3 style={{ margin: "0 0 10px 0", color: "#FF5E17" }}>{event.title}</h3>
                                        
                                        {/* Capacity Badge */}
                                        {event.capacity > 0 && (
                                            <span style={{ 
                                                fontSize: "0.8rem", padding: "3px 8px", borderRadius: "10px", 
                                                backgroundColor: event.current_count >= event.capacity ? "#dc3545" : "#fff3e0",
                                                color: event.current_count >= event.capacity ? "white" : "#000000",
                                                fontWeight: "bold"
                                            }}>
                                                👥 {event.current_count || 0} / {event.capacity} Filled
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p style={{ color: "#555", fontSize: "0.9rem", margin: "5px 0" }}>
                                        <strong>Organized by:</strong> {event.organizer_name}
                                    </p>
                                    <p style={{ margin: "10px 0", color: "#333", lineHeight: "1.4" }}>{event.description}</p>
                                    
                                    <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666", display: "flex", flexDirection: "column", gap: "5px" }}>
                                        <span>📍 {event.location}</span>
                                        <span>📅 {formatEventTime(event.event_date, event.event_end)}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleSignup(event.event_id)}
                                    disabled={event.capacity && event.current_count >= event.capacity}
                                    style={{ 
                                        marginTop: "20px", width: "100%", padding: "10px", 
                                        backgroundColor: (event.capacity && event.current_count >= event.capacity) ? "#ccc" : "#FF5E17", // UTRGV Orange
                                        color: "white", border: "none", borderRadius: "5px", 
                                        cursor: (event.capacity && event.current_count >= event.capacity) ? "not-allowed" : "pointer", 
                                        fontWeight: "bold" 
                                    }}
                                >
                                    {(event.capacity && event.current_count >= event.capacity) ? "Event Full" : "Volunteer Now"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default EventBoard;