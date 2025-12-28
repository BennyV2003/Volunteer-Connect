import { useEffect, useState } from "react";
import EventManager from "./EventManager";
import { toast } from 'react-toastify'; 

const OrgDashboard = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    const [inputs, setInputs] = useState({
        title: "",
        date: "",        
        startTime: "",   
        endTime: "",     
        location: "",
        capacity: "",
        description: ""
    });

    const { title, date, startTime, endTime, location, capacity, description } = inputs;

    const onChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    const onSubmitForm = async (e) => {
        e.preventDefault();
        
        const finalStart = `${date}T${startTime}`;
        const finalEnd = `${date}T${endTime}`;

        if (new Date(finalEnd) <= new Date(finalStart)) {
            toast.error("❌ End time must be after start time");
            return;
        }

        try {
            const body = { 
                title, 
                description, 
                location, 
                event_date: finalStart, 
                event_end: finalEnd,    
                capacity 
            };
            
            const response = await fetch("http://localhost:5000/events", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token") 
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast.success("🎉 New event created successfully!"); 
                setInputs({
                    title: "",
                    date: "",
                    startTime: "",
                    endTime: "",
                    location: "",
                    capacity: "",
                    description: ""
                });
                getEvents(); 
            } else {
                const errorText = await response.text();
                toast.error(`Error: ${errorText}`);
            }
        } catch (err) {
            console.error(err.message);
            toast.error("Server Error");
        }
    };

    const getEvents = async () => {
        try {
            const response = await fetch("http://localhost:5000/my-events", {
                headers: { token: localStorage.getItem("token") }
            });
            const jsonData = await response.json();
            setEvents(jsonData);
        } catch (err) {
            console.error(err.message);
        }
    };

    useEffect(() => {
        getEvents();
    }, []);

    const formatListDate = (startString, endString) => {
        const start = new Date(startString);
        const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };

        const dateText = start.toLocaleDateString(undefined, dateOptions);
        const startTime = start.toLocaleTimeString(undefined, timeOptions);

        if (!endString) return `${dateText} @ ${startTime}`;

        const end = new Date(endString);
        const endTime = end.toLocaleTimeString(undefined, timeOptions);
        return `${dateText} | ${startTime} - ${endTime}`;
    };

    const now = new Date();
    const upcomingEvents = events.filter(event => 
        new Date(event.event_date) >= now && !event.is_completed
    );

    const pastEvents = events.filter(event => 
        new Date(event.event_date) < now || event.is_completed
    );

    if (selectedEvent) {
        return (
            <EventManager 
                event={selectedEvent} 
                onBack={() => {
                    setSelectedEvent(null);
                    getEvents(); 
                }} 
            />
        );
    }

    // --- STYLES ---
    const cardStyle = {
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        marginBottom: "40px",
        border: "1px solid #eee"
    };

    const labelStyle = { display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "0.9rem", color: "#333" };
    // box-sizing: border-box ensures padding doesn't break the width
    const inputStyle = { width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" };
    
    const eventItemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", border: "1px solid #eee", borderRadius: "8px", backgroundColor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };

    return (
        // Added Wrapper to keep it centered and consistent width
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            
            {/* CREATE EVENT CARD */}
            <div style={cardStyle}>
                <h2 style={{ marginTop: 0, marginBottom: "25px", color: "#333", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
                    Create New Volunteer Event
                </h2>
                
                <form onSubmit={onSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    
                    {/* Title */}
                    <div>
                        <label style={labelStyle}>Event Title</label>
                        <input type="text" name="title" placeholder="e.g. Beach Cleanup" value={title} onChange={onChange} required style={inputStyle} />
                    </div>
                    
                    {/* Date | Start | End */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                        <div>
                            <label style={labelStyle}>Date</label>
                            <input type="date" name="date" value={date} onChange={onChange} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Start Time</label>
                            <input type="time" name="startTime" value={startTime} onChange={onChange} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>End Time</label>
                            <input type="time" name="endTime" value={endTime} onChange={onChange} required style={inputStyle} />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label style={labelStyle}>Location</label>
                        <input type="text" name="location" placeholder="e.g. 123 Ocean Drive" value={location} onChange={onChange} required style={inputStyle} />
                    </div>

                    {/* Capacity */}
                    <div>
                        <label style={labelStyle}>Max Volunteers</label>
                        <input type="number" name="capacity" placeholder="No Limit" value={capacity} onChange={onChange} style={inputStyle} />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea name="description" placeholder="What will volunteers be doing?" value={description} onChange={onChange} required rows="3" style={{ ...inputStyle, resize: "vertical" }} />
                    </div>
                    
                    {/* UTRGV ORANGE BUTTON */}
                    <button type="submit" style={{ backgroundColor: "#FF5E17", color: "white", border: "none", padding: "12px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", width: "100%", marginTop: "10px" }}>
                        Post Event
                    </button>
                </form>
            </div>

            {/* --- MY EVENT MANAGEMENT --- */}
            <h2 style={{ color: "#333", marginBottom: "20px" }}>My Event Management</h2>
            
            {/* UTRGV ORANGE HEADER */}
            <h3 style={{ color: "#FF5E17", borderBottom: "2px solid #FF5E17", paddingBottom: "10px" }}>
                🚀 Upcoming Events
            </h3>
            {upcomingEvents.length === 0 ? (
                <p style={{ color: "#666", marginBottom: "30px" }}>No upcoming events scheduled.</p>
            ) : (
                <div style={{ display: "grid", gap: "15px", marginBottom: "40px" }}>
                    {upcomingEvents.map(event => (
                        <div key={event.event_id} style={eventItemStyle}>
                            <div>
                                <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>{event.title}</h3>
                                <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                                    📅 {formatListDate(event.event_date, event.event_end)}
                                </p>
                                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
                                    📍 {event.location}
                                </p>
                            </div>
                            {/* UTRGV ORANGE BUTTON */}
                            <button 
                                onClick={() => setSelectedEvent(event)}
                                style={{ backgroundColor: "#FF5E17", color: "white", border: "none", padding: "8px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                Manage
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <h3 style={{ color: "#666", borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
                📜 Past Events
            </h3>
            {pastEvents.length === 0 ? (
                <p style={{ color: "#666", marginBottom: "30px" }}>No past events found.</p>
            ) : (
                <div style={{ display: "grid", gap: "15px", marginBottom: "50px" }}>
                    {pastEvents.map(event => (
                        <div key={event.event_id} style={{ ...eventItemStyle, backgroundColor: "#f9f9f9", opacity: 0.8 }}>
                            <div>
                                <h3 style={{ margin: "0 0 5px 0", color: "#555" }}>
                                    {event.title} {event.is_completed && <span style={{fontSize: "0.8rem", color: "#28a745"}}>(Completed)</span>}
                                </h3>
                                <p style={{ margin: 0, color: "#777", fontSize: "0.9rem" }}>
                                    📅 {formatListDate(event.event_date, event.event_end)}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedEvent(event)}
                                style={{ backgroundColor: "#6c757d", color: "white", border: "none", padding: "8px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrgDashboard;