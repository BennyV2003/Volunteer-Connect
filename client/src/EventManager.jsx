import { useState, useEffect } from "react";
import VolunteerRow from "./VolunteerRow";
import { toast } from 'react-toastify'; 

const EventManager = ({ event, onBack }) => {
    const [attendees, setAttendees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [viewingComments, setViewingComments] = useState([]);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [newComment, setNewComment] = useState("");

    // --- NEW STATE: Tracks the current version of the event to display ---
    // We initialize it with the data passed in, but we can update it locally later.
    const [displayEvent, setDisplayEvent] = useState(event);

    // --- HELPER: Extracts LOCAL time for input boxes ---
    const formatLocalForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialize Edit Data from the displayEvent state
    const [editData, setEditData] = useState({
        title: displayEvent.title,
        description: displayEvent.description,
        location: displayEvent.location,
        event_date: formatLocalForInput(displayEvent.event_date),
        event_end: formatLocalForInput(displayEvent.event_end)
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        const getAttendees = async () => {
            try {
                // Use event.event_id (ID never changes, so using the prop is safe)
                const response = await fetch(`http://localhost:5000/events/${event.event_id}/attendees`, {
                    headers: { token: localStorage.getItem("token") }
                });
                const data = await response.json();
                setAttendees(data);
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load attendees");
            }
        };
        getAttendees();
    }, [event.event_id]);

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const saveChanges = async () => {
        // Validation: Start vs End Time
        if (new Date(editData.event_end) <= new Date(editData.event_date)) {
            toast.error("❌ End Time cannot be before Start Time.");
            return;
        }
        
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
                toast.success("✏️ Event updated successfully!");
                
                // 1. UPDATE DISPLAY LOCALLY (This makes the changes appear instantly)
                setDisplayEvent({
                    ...displayEvent, // Keep ID, status, etc.
                    ...editData      // Overwrite title, location, dates
                });

                // 2. EXIT EDIT MODE (But stay on this screen)
                setIsEditing(false);
                
                // REMOVED: window.location.reload() <--- No longer needed!
            } else {
                const errorText = await response.text(); 
                toast.error(`❌ Update failed: ${errorText}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Server Error: Could not save changes.");
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure? This will remove the event and all signup records.")) {
            try {
                const response = await fetch(`http://localhost:5000/events/${event.event_id}`, {
                    method: "DELETE",
                    headers: { token: localStorage.getItem("token") }
                });
                
                if (response.ok) {
                    toast.success("🗑️ Event deleted. Loading dashboard");
                    // For delete, we DO want to reload/go back because this page no longer exists
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    toast.error("Failed to delete event.");
                }
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
                    toast.success("✅ Event marked as Completed!");
                    // Update local state to reflect the closed status instantly
                    setDisplayEvent({...displayEvent, is_completed: true});
                    // Optional: Go back if you prefer, or stay here to see it's closed
                    // onBack(); 
                } else {
                    const errorMsg = await response.json();
                    toast.error(errorMsg);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleAttendanceUpdate = async (signup_id, status, check_in, check_out) => {
        try {
            const body = { status, check_in, check_out };
            const response = await fetch(`http://localhost:5000/signups/${signup_id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token") 
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast.success("💾 Attendance Saved");
                const res = await fetch(`http://localhost:5000/events/${event.event_id}/attendees`, {
                    headers: { token: localStorage.getItem("token") }
                });
                const updatedList = await res.json();
                setAttendees(updatedList);
            } else {
                toast.error("Failed to save attendance");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper for Display Mode
    const formatDisplayDate = (start, end) => {
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        const startDate = new Date(start);
        const dateStr = startDate.toLocaleDateString(undefined, dateOptions);
        const startTime = startDate.toLocaleTimeString(undefined, timeOptions);

        if (!end) return `${dateStr} at ${startTime}`;

        const endTime = new Date(end).toLocaleTimeString(undefined, timeOptions);
        return `${dateStr} | ${startTime} - ${endTime}`;
    };
    
    const handleSeeComments = async () => {
    try {
        const response = await fetch(`http://localhost:5000/events/${event.event_id}/comments`, {
            headers: { token: localStorage.getItem("token") }
        });

        if (response.ok) {
            const jsonData = await response.json();
            setViewingComments(jsonData);
            setShowCommentsModal(true);
        } else {
            toast.error("Could not fetch comments");
        }
    } catch (err) {
        console.error(err.message);
    }
};

const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
        const response = await fetch(
            `http://localhost:5000/events/${event.event_id}/comments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    token: localStorage.getItem("token")
                },
                body: JSON.stringify({ content: newComment })
            }
        );

        if (response.ok) {
            setNewComment("");
            handleSeeComments();
        } else {
            toast.error("Could not post comment");
        }
    } catch (err) {
        console.error(err);
    }
};


    return (
        <div style={{ padding: "30px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <button onClick={onBack} style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#666", fontSize: "1rem" }}>
                ← Back to Dashboard
            </button>
            
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    
                    {isEditing ? (
                        /* --- EDIT MODE --- */
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                            <label style={{fontSize: "0.8rem", color: "#666"}}>Event Title</label>
                            <input 
                                name="title" value={editData.title} onChange={handleEditChange} 
                                style={{ fontSize: "1.5rem", padding: "5px" }} 
                            />
                            
                            <div style={{ display: "flex", gap: "20px" }}>
                                <div style={{display: "flex", flexDirection: "column"}}>
                                    <label style={{fontSize: "0.8rem", color: "#666"}}>Start Time</label>
                                    <input 
                                        type="datetime-local" name="event_date" value={editData.event_date} onChange={handleEditChange} 
                                        style={{ padding: "5px" }} 
                                    />
                                </div>
                                <div style={{display: "flex", flexDirection: "column"}}>
                                    <label style={{fontSize: "0.8rem", color: "#666"}}>End Time</label>
                                    <input 
                                        type="datetime-local" name="event_end" value={editData.event_end} onChange={handleEditChange} 
                                        style={{ padding: "5px" }} 
                                    />
                                </div>
                            </div>

                            <label style={{fontSize: "0.8rem", color: "#666"}}>Location</label>
                            <input 
                                name="location" value={editData.location} onChange={handleEditChange} 
                                style={{ padding: "5px", flex: 1 }} 
                            />
                            
                            <label style={{fontSize: "0.8rem", color: "#666"}}>Description</label>
                            <textarea 
                                name="description" value={editData.description} onChange={handleEditChange} 
                                rows="3" style={{ padding: "5px", resize: "vertical" }} 
                            />
                            
                            <div style={{ marginTop: "10px" }}>
                                <button onClick={saveChanges} style={{ backgroundColor: "#FF5E17", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px" }}>Save Changes</button>
                                <button onClick={() => setIsEditing(false)} style={{ backgroundColor: "#6c757d", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        /* --- VIEW MODE (UPDATED to use displayEvent) --- */
                        <div>
                            {/* NOTE: We now use displayEvent instead of event */}
                            <h1 style={{ margin: "0 0 10px 0", color: "#FF5E17" }}>{displayEvent.title}</h1>
                            <p style={{ color: "#666", margin: "5px 0", fontSize: "1.1rem" }}>
                                📅 <strong>{formatDisplayDate(displayEvent.event_date, displayEvent.event_end)}</strong>
                            </p>
                            <p style={{ color: "#666", margin: "5px 0" }}>
                                📍 {displayEvent.location}
                            </p>
                            <p style={{ marginTop: "15px", lineHeight: "1.5" }}>{displayEvent.description}</p>
                        </div>
                    )}

                    {!isEditing && (
                        <div style={{ display: "flex", gap: "10px", flexDirection: "column", alignItems: "flex-end" }}>
                            <div style={{display: "flex", gap: "10px"}}>
                                {!displayEvent.is_completed ? (
                                    <button 
                                        onClick={handleComplete}
                                        style={{ backgroundColor: "#17a2b8", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                                    >
                                        ✅ Finish Event
                                    </button>
                                ) : (
                                    <span style={{ padding: "8px 15px", border: "2px solid #FF5E17", color: "#FF5E17", borderRadius: "5px", fontWeight: "bold", backgroundColor: "#e9f7ef" }}>
                                        Event Closed
                                    </span>
                                )}

                                <button 
                                    onClick={() => setIsEditing(true)}
                                    disabled={displayEvent.is_completed}
                                    style={{ backgroundColor: displayEvent.is_completed ? "#ccc" : "#ffc107", color: "black", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    ✏️ Edit
                                </button>
                            </div>

                            <button
                                onClick={handleSeeComments}
                                style={{
                                backgroundColor: "#6c757d",
                                color: "white",
                                border: "none",
                                padding: "8px 15px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                            >
                                💬 Comments
                            </button>
                            
                            <button 
                                onClick={handleDelete}
                                style={{ backgroundColor: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", width: "100%" }}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                        {attendees.length === 0 ? (
                            <tr><td colSpan="3" style={{padding:"20px", textAlign:"center", color: "#888"}}>No volunteers have signed up yet.</td></tr>
                        ) : (
                            attendees.map(person => (
                                <VolunteerRow 
                                    key={person.signup_id} 
                                    attendee={person} 
                                    eventDate={displayEvent.event_date} 
                                    eventEnd={displayEvent.event_end}
                                    onUpdate={handleAttendanceUpdate} 
                                />
                            ))
                        )}
                    </tbody>
                </table>
            )}
{showCommentsModal && (
<div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
}}>
<div style={{
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "80vh",
    overflowY: "auto"
}}>

<div style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px"
}}>
<h3 style={{ margin: 0 }}>Event Comments</h3>

<button
onClick={() => setShowCommentsModal(false)}
style={{
background: "none",
border: "none",
fontSize: "1.5rem",
cursor: "pointer"
}}
>
&times;
</button>
</div>

{viewingComments.length === 0 ? (
<p style={{ textAlign: "center", color: "#666" }}>
No comments yet.
</p>
) : (
viewingComments.map((comment, index) => (
<div key={comment.comment_id || index} style={{
    borderBottom: "1px solid #eee",
    paddingBottom: "15px",
    marginBottom: "15px"
}}>
    <strong style={{ color: comment.is_organizer ? "#FF5E17" : "#333" }}>
        {comment.full_name}
        {comment.is_organizer && (
            <span title="Event Organizer" style={{ marginLeft: 6 }}>
                ⭐
            </span>
        )}
    </strong>

    <p style={{ margin: "5px 0", color: "#555" }}>
        {comment.content}
    </p>

    <small style={{ color: "#999" }}>
        {new Date(comment.created_at).toLocaleDateString()}
    </small>
</div>
))
)}

<textarea
value={newComment}
onChange={(e) => setNewComment(e.target.value)}
placeholder="Write a comment..."
style={{
width: "100%",
padding: "10px",
borderRadius: "6px",
border: "1px solid #ccc",
marginTop: "10px",
marginBottom: "10px"
}}
/>

<button
onClick={handlePostComment}
style={{
padding: "8px 14px",
backgroundColor: "#28a745",
color: "white",
border: "none",
borderRadius: "5px",
cursor: "pointer"
}}
>
Post Comment
</button>

</div>
</div>
)}
        </div>
    );
};

export default EventManager;