import { useEffect, useState } from "react";
import CreateEvent from "./CreateEvent";
import EventManager from "./EventManager"; // Import the new file

const OrgDashboard = () => {
    const [myEvents, setMyEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null); // NEW: Track which event is clicked

    useEffect(() => {
        getMyEvents();
    }, [selectedEvent]); // Refetch list when we come back from the manager (to see updates)

    const getMyEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/my-events", {
                method: "GET",
                headers: { token: localStorage.getItem("token") }
            });
            const jsonData = await response.json();
            setMyEvents(jsonData);
        } catch (err) {
            console.error(err.message);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // LOGIC: Split events into two arrays
    const now = new Date();
    
    // UPCOMING: Date is in the future AND it is NOT completed yet
    const upcomingEvents = myEvents.filter(event => 
        new Date(event.event_date) >= now && !event.is_completed
    );

    // PAST: Date is in the past OR it has been marked completed
    const pastEvents = myEvents.filter(event => 
        new Date(event.event_date) < now || event.is_completed
    );

    // LOGIC: If an event is selected, hide the dashboard and show the Manager
    if (selectedEvent) {
        return <EventManager event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
    }

    // Otherwise, show the normal dashboard
    return (
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            
            <CreateEvent />

            <div style={{ marginTop: "50px" }}>
                <h2>My Event Management</h2>
                
                {/* UPCOMING SECTION */}
                <h3 style={{ color: "#4A90E2", borderBottom: "2px solid #4A90E2", paddingBottom: "5px" }}>
                    🚀 Upcoming Events
                </h3>
                {upcomingEvents.length === 0 ? <p>No upcoming events.</p> : (
                    <div style={{ display: "grid", gap: "15px", marginBottom: "40px" }}>
                        {upcomingEvents.map(event => (
                            <div key={event.event_id} style={cardStyle}>
                                <div>
                                    <h4>{event.title}</h4>
                                    <p>📅 {formatDate(event.event_date)}</p>
                                    <p>📍 {event.location}</p>
                                </div>
                                {/* NEW: The "Manage" Button */}
                                <button 
                                    onClick={() => setSelectedEvent(event)}
                                    style={{ padding: "8px 15px", backgroundColor: "#4A90E2", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                                >
                                    Manage
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* PAST SECTION */}
                <h3 style={{ color: "#666", borderBottom: "2px solid #ccc", paddingBottom: "5px" }}>
                    📜 Past Events
                </h3>
                {pastEvents.length === 0 ? <p>No past events found.</p> : (
                    <div style={{ display: "grid", gap: "15px" }}>
                        {pastEvents.map(event => (
                            <div key={event.event_id} style={{ ...cardStyle, backgroundColor: "#f9f9f9", opacity: 0.8 }}>
                                <div>
                                    <h4 style={{color: "#666"}}>{event.title} (Completed)</h4>
                                    <p>📅 {formatDate(event.event_date)}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedEvent(event)}
                                    style={{ padding: "8px 15px", backgroundColor: "#666", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const cardStyle = {
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
};

export default OrgDashboard;