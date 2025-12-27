import { useEffect, useState } from "react";

const EventBoard = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        getEvents();
    }, []);

    const getEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/events");
            const jsonData = await response.json();

            // LOGIC: Filter out Past and Completed events
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
        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/signup`, {
                method: "POST",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                alert("You have successfully signed up!");
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
            <h2 style={{ borderBottom: "2px solid #ddd", paddingBottom: "10px" }}>Upcoming Opportunities</h2>
            
            {events.length === 0 ? (
                <p style={{textAlign: "center", color: "#666", marginTop: "20px"}}>
                    No upcoming volunteer opportunities at the moment. Check back later!
                </p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                    {events.map(event => (
                        <div key={event.event_id} style={{ 
                            border: "1px solid #e0e0e0", 
                            borderRadius: "10px", 
                            padding: "20px",
                            backgroundColor: "white",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                        }}>
                            <h3 style={{ margin: "0 0 10px 0", color: "#4A90E2" }}>{event.title}</h3>
                            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "10px" }}>
                                <strong>Organized by:</strong> {event.organizer}
                            </p>
                            <p style={{ color: "#333" }}>{event.description}</p>
                            <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "15px 0" }} />
                            <p style={{fontSize: "0.9rem"}}>📍 {event.location}</p>
                            <p style={{fontSize: "0.9rem"}}>📅 {formatDate(event.event_date)}</p>
                            
                            <button 
                                onClick={() => handleSignup(event.event_id)}
                                style={{ 
                                    marginTop: "15px", 
                                    width: "100%",
                                    backgroundColor: "#28a745", 
                                    color: "white", 
                                    border: "none", 
                                    padding: "10px", 
                                    borderRadius: "5px", 
                                    cursor: "pointer",
                                    fontWeight: "bold"
                                }}>
                                Volunteer Now
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventBoard;