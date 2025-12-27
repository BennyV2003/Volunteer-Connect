import { useState, useEffect } from "react";

const EventManager = ({ event, onBack }) => {
    const [attendees, setAttendees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW: Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: event.title,
        description: event.description,
        location: event.location,
        // Format date for the input field (yyyy-MM-ddThh:mm)
        event_date: new Date(event.event_date).toISOString().slice(0, 16)
    });

    useEffect(() => {

        // NEW LINE: Force scroll to top immediately
        window.scrollTo(0, 0);
        
        const getAttendees = async () => {
            try {
                const response = await fetch(`http://localhost:5000/events/${event.event_id}/attendees`, {
                    headers: { token: localStorage.getItem("token") }
                });
                const data = await response.json();
                setAttendees(data);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
            }
        };
        getAttendees();
    }, [event]);

    // Handle typing in the edit fields
    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    // Save changes to the backend
    const saveChanges = async () => {
        try {
            const response = await fetch(`http://localhost:5000/events/${event.event_id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token") 
                },
                body: JSON.stringify(editData)
            });

            if (response.ok) {
                alert("Event Updated!");
                setIsEditing(false);
                // We refresh the whole page so the dashboard updates too
                window.location.reload(); 
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure? This will remove the event and all signup records.")) {
            try {
                await fetch(`http://localhost:5000/events/${event.event_id}`, {
                    method: "DELETE",
                    headers: { token: localStorage.getItem("token") }
                });
                // We reload to clear the deleted event from the list
                window.location.reload(); 
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleComplete = async () => {
        if (confirm("Are you sure? This will close the event and move it to Past Events.")) {
            try {
                const response = await fetch(`http://localhost:5000/events/${event.event_id}/complete`, {
                    method: "PUT",
                    headers: { token: localStorage.getItem("token") }
                });

                if (response.ok) {
                    alert("Event marked as Completed!");
                    onBack(); // Go back to the dashboard to see it move to the "Past" section
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const markPresent = async (signup_id, hours) => {
        try {
            await fetch(`http://localhost:5000/signups/${signup_id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token") 
                },
                body: JSON.stringify({ status: "attended", hours_awarded: hours })
            });
            setAttendees(attendees.map(att => 
                att.signup_id === signup_id ? { ...att, status: "attended", hours_awarded: hours } : att
            ));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: "30px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <button onClick={onBack} style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#666", fontSize: "1rem" }}>
                ← Back to Dashboard
            </button>
            
            {/* --- EVENT DETAILS SECTION --- */}
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "30px" }}>
                
                {/* Header with Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    
                    {/* View Mode vs Edit Mode Logic */}
                    {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                            <input 
                                name="title" value={editData.title} onChange={handleEditChange} 
                                style={{ fontSize: "1.5rem", padding: "5px" }} 
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input 
                                    type="datetime-local" name="event_date" value={editData.event_date} onChange={handleEditChange} 
                                    style={{ padding: "5px" }} 
                                />
                                <input 
                                    name="location" value={editData.location} onChange={handleEditChange} 
                                    style={{ padding: "5px", flex: 1 }} 
                                />
                            </div>
                            <textarea 
                                name="description" value={editData.description} onChange={handleEditChange} 
                                rows="3" style={{ padding: "5px", resize: "vertical" }} 
                            />
                            
                            <div style={{ marginTop: "10px" }}>
                                <button onClick={saveChanges} style={{ backgroundColor: "#28a745", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px" }}>Save</button>
                                <button onClick={() => setIsEditing(false)} style={{ backgroundColor: "#6c757d", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 style={{ margin: "0 0 10px 0", color: "#4A90E2" }}>{event.title}</h1>
                            <p style={{ color: "#666", margin: "5px 0" }}>
                                📍 <strong>{event.location}</strong> | 📅 {new Date(event.event_date).toLocaleString()}
                            </p>
                            <p style={{ marginTop: "15px", lineHeight: "1.5" }}>{event.description}</p>
                        </div>
                    )}

                    {/* Action Buttons (Only show in View Mode) */}
                    {!isEditing && (
                        <div style={{ display: "flex", gap: "10px" }}>
                            {/* Logic: If NOT completed, show the Complete Button. If completed, show a status. */}
                            {!event.is_completed ? (
                                <button 
                                    onClick={handleComplete}
                                    style={{ backgroundColor: "#17a2b8", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    ✅ Complete Event
                                </button>
                            ) : (
                                <span style={{ padding: "8px 15px", border: "2px solid #28a745", color: "#28a745", borderRadius: "5px", fontWeight: "bold", backgroundColor: "#e9f7ef" }}>
                                    Event Closed
                                </span>
                            )}
                            <button 
                                onClick={() => setIsEditing(true)}
                                style={{ backgroundColor: "#ffc107", color: "black", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                ✏️ Edit
                            </button>
                            <button 
                                onClick={handleDelete}
                                style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- VOLUNTEER TABLE SECTION --- */}
            <h3>Volunteer Attendance</h3>
            {isLoading ? <p>Loading volunteers...</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
                    <thead>
                        <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd", backgroundColor: "#f8f9fa" }}>
                            <th style={{ padding: "12px" }}>Volunteer</th>
                            <th style={{ padding: "12px" }}>Current Status</th>
                            <th style={{ padding: "12px" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendees.length === 0 ? <tr><td colSpan="3" style={{padding:"20px", textAlign:"center", color: "#888"}}>No volunteers have signed up yet.</td></tr> : 
                        attendees.map(person => (
                            <tr key={person.signup_id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "12px" }}>
                                    <strong>{person.full_name}</strong><br/>
                                    <small style={{color:"#888"}}>{person.email}</small>
                                </td>
                                <td style={{ padding: "12px" }}>
                                    <span style={{ 
                                        padding: "5px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold",
                                        backgroundColor: person.status === 'attended' ? '#d4edda' : '#e2e3e5',
                                        color: person.status === 'attended' ? '#155724' : '#383d41'
                                    }}>
                                        {person.status === 'attended' ? '✅ Completed' : 'Registered'}
                                    </span>
                                </td>
                                <td style={{ padding: "12px" }}>
                                    {person.status !== 'attended' && (
                                        <button 
                                            onClick={() => markPresent(person.signup_id, 4)} 
                                            style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                                        >
                                            Mark Present
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default EventManager;