import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import jsPDF from "jspdf"; 
import ReviewsModal from "./ReviewsModal"; 

const MySignups = ({ refreshTrigger, onUnregisterSuccess, userName }) => {
    const [signups, setSignups] = useState([]);
    const [selectedReviewEvent, setSelectedReviewEvent] = useState(null); 

    useEffect(() => {
        getSignups();
    }, [refreshTrigger]);

    // --- COMMENTS STATE ---
    const [viewingComments, setViewingComments] = useState([]);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedCommentEventId, setSelectedCommentEventId] = useState(null);
    const [newComment, setNewComment] = useState("");

    // --- COMMENTS HANDLERS ---
    const handleSeeComments = async (eventId) => {
        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/comments`, {
                headers: { token: localStorage.getItem("token") }
            });
            if (response.ok) {
                const jsonData = await response.json();
                setViewingComments(jsonData);
                setSelectedCommentEventId(eventId);
                setShowCommentsModal(true);
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const response = await fetch(`http://localhost:5000/events/${selectedCommentEventId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", token: localStorage.getItem("token") },
                body: JSON.stringify({ content: newComment })
            });
            if (response.ok) {
                setNewComment("");
                await getSignups(); // Refresh the list
                handleSeeComments(selectedCommentEventId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Delete this comment?")) return;
        try {
            const response = await fetch(`http://localhost:5000/events/${selectedCommentEventId}/comments/${commentId}`, {
                method: "DELETE",
                headers: { token: localStorage.getItem("token") }
            });
            if (response.ok) {
                toast.success("Comment deleted");
                await getSignups(); // Refresh the list
                handleSeeComments(selectedCommentEventId);
            }
        } catch (err) {
            console.error(err);
        }
    };

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
        if (!confirm("Are you sure you want to unregister from this event?")) return;
        try {
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

    const generateCertificate = (event) => {
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const center = pageWidth / 2;
        const orangeColor = [255, 94, 23];
        const darkColor = [60, 60, 60];

        doc.setLineWidth(2); doc.setDrawColor(...orangeColor); doc.rect(10, 10, pageWidth - 20, 190);
        doc.setFont("helvetica", "bold"); doc.setFontSize(40); doc.setTextColor(...orangeColor);
        doc.text("Certificate of Service", center, 50, { align: "center" });
        doc.setFont("helvetica", "normal"); doc.setFontSize(16); doc.setTextColor(...darkColor);
        doc.text("Presented to", center, 70, { align: "center" });
        doc.setFont("times", "bolditalic"); doc.setFontSize(36); doc.setTextColor(0, 0, 0);
        doc.text(userName || "Volunteer Name", center, 90, { align: "center" });
        doc.setFont("helvetica", "normal"); doc.setFontSize(14); doc.setTextColor(...darkColor);
        doc.text(`For volunteering ${Number(event.hours_awarded).toFixed(1)} hours at:`, center, 115, { align: "center" });
        doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...orangeColor);
        doc.text(event.title, center, 130, { align: "center" });
        doc.save(`${event.title}_Certificate.pdf`);
    };

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

    const formatDisplayName = (fullName, isOrganizer) => {
        if (!fullName) return "Volunteer";
        if (isOrganizer) return fullName; 
        
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0];
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "";
        
        return `${firstName} ${lastInitial}.`;
    };

    const activeEvents = signups.filter(event => !event.is_completed);
    const completedEvents = signups.filter(event => event.is_completed);

    const actionBtnStyle = {
        padding: "10px 16px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "0.9rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "100%"
    };

    return (
        <div style={{ marginBottom: "50px", marginTop: "40px", maxWidth: "1000px", margin: "0 auto" }}>
            
            {/* --- ACTIVE EVENTS --- */}
            <h2 style={{ color: "#FF5E17", borderBottom: "2px solid #FF5E17", paddingBottom: "10px", marginTop: "40px" }}>
                ✅ My Registered Events
            </h2>
            
            {activeEvents.length === 0 ? (
                <p style={{ color: "#666", marginBottom: "30px" }}>You have no active registrations.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px", marginBottom: "40px" }}>
                    {activeEvents.map(event => (
                        <div key={event.event_id} style={{ 
                            backgroundColor: "white", padding: "25px", borderRadius: "10px", 
                            boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "6px solid #28a745", 
                            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px"
                        }}>
                            <div style={{ flex: 1 }}>
                                
                                {/* TITLE + CAPACITY ROW */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                    <h3 style={{ margin: "0", color: "#28a745" }}>{event.title}</h3>
                                    
                                    {event.capacity > 0 && (
                                        <span style={{ 
                                            fontSize: "0.8rem", padding: "4px 10px", borderRadius: "15px", 
                                            backgroundColor: event.current_count >= event.capacity ? "#dc3545" : "#e9ecef", 
                                            color: event.current_count >= event.capacity ? "white" : "#495057", 
                                            fontWeight: "bold" 
                                        }}>
                                            👥 {event.current_count || 0} / {event.capacity} Filled
                                        </span>
                                    )}
                                </div>

                                <p style={{ color: "#555", fontSize: "0.9rem", margin: "5px 0" }}><strong>Organized by:</strong> {event.organizer_name}</p>
                                <p style={{ color: "#555", fontSize: "0.9rem", margin: "5px 0" }}><strong>Status:</strong> <span style={{fontWeight: "bold", color: "#28a745"}}>Registered</span></p>
                                <p style={{ margin: "10px 0", color: "#333", lineHeight: "1.4", maxWidth: "95%" }}>{event.description}</p>
                                <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666", display: "flex", gap: "20px" }}>
                                    <span>📍 {event.location}</span>
                                    <span>📅 {formatEventTime(event.event_date, event.event_end)}</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "25px", borderLeft: "1px solid #eee", minWidth: "200px" }}>
                                <button onClick={() => handleUnregister(event.event_id)} style={{ ...actionBtnStyle, backgroundColor: "white", color: "#dc3545", border: "1px solid #dc3545" }}>
                                    Unregister
                                </button>

                                {/* NEW COMMENTS BUTTON */}
                                <button onClick={() => handleSeeComments(event.event_id)} style={{ ...actionBtnStyle, backgroundColor: "#6c757d", color: "white" }}>
                                    💬 {event.comment_count || 0} Comments
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- PAST EVENTS --- */}
            {completedEvents.length > 0 && (
                <div style={{ marginTop: "50px" }}>
                    <h2 style={{ color: "#6c757d", borderBottom: "2px solid #6c757d", paddingBottom: "10px" }}>
                        📜 My Past Events
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
                        {completedEvents.map(event => (
                            <div key={event.event_id} style={{ 
                                backgroundColor: "white", padding: "25px", borderRadius: "10px", 
                                boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "6px solid #6c757d",
                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px"
                            }}>
                                <div style={{ flex: 1 }}> 
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                        <h3 style={{ margin: 0, color: "#333", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                            {event.title}
                                            {/* NEW: Only show the star if the average is greater than 0! */}
                                            {event.average_rating > 0 && (
                                                <span style={{ fontSize: "1.1rem", color: "#ffc107", backgroundColor: "#fff8e1", padding: "2px 8px", borderRadius: "12px", border: "1px solid #ffe082" }}>
                                                    ⭐ {Number(event.average_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </h3>
                                        <span style={{ backgroundColor: event.status === 'attended' ? "#28a745" : "#6c757d", color: "white", padding: "4px 10px", borderRadius: "15px", fontSize: "0.8rem", fontWeight: "bold" }}>
                                            {event.status === 'attended' ? `Attended (+${Number(event.hours_awarded || 0)} Hrs)` : (event.status || "Completed")}
                                        </span>
                                    </div>
                                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "0.9rem" }}>Organized by <strong>{event.organizer_name}</strong></p>
                                    <p style={{ color: "#555", lineHeight: "1.6", marginBottom: "15px", maxWidth: "95%" }}>{event.description}</p>
                                    <div style={{ display: "flex", gap: "20px", color: "#777", fontSize: "0.95rem" }}>
                                        <span>📅 {formatEventTime(event.event_date, event.event_end)}</span>
                                        <span>📍 {event.location}</span>
                                    </div>
                                </div>

                                {event.status === 'attended' && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "25px", borderLeft: "1px solid #eee", minWidth: "200px" }}>
                                        <button onClick={() => generateCertificate(event)} style={{ ...actionBtnStyle, backgroundColor: "#007bff", color: "white" }}>
                                            🖨️ Print Certificate
                                        </button>
                                        
                                        {/* THE REVIEW BUTTONS STAY HERE! */}
                                        <button onClick={() => setSelectedReviewEvent(event)} style={{ ...actionBtnStyle, backgroundColor: "#ffc107", color: "black" }}>
                                            ⭐ Write a Review
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* MODALS */}
            {selectedReviewEvent && (
                <ReviewsModal 
                    event={selectedReviewEvent} 
                    userName={userName} 
                    onClose={() => setSelectedReviewEvent(null)} 
                    onReviewChange={getSignups} // <--- NEW: Triggers the parent to fetch fresh data!
                />
            )}
            {showCommentsModal && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", width: "500px", maxWidth: "90%", maxHeight: "80vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            <h3 style={{ margin: 0 }}>Event Comments</h3>
                            <button onClick={() => setShowCommentsModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
                        </div>

                        {viewingComments.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#666" }}>No comments yet.</p>
                        ) : (
                            viewingComments.map((comment, index) => (
                                <div key={comment.comment_id || index} style={{ borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <strong style={{ color: comment.is_organizer ? "#FF5E17" : "#333" }}>
                                            {formatDisplayName(comment.full_name, comment.is_organizer)}
                                            {comment.is_organizer && (
                                                <span title="Event Organizer" style={{ marginLeft: 6 }}>⭐</span>
                                            )}
                                        </strong>

                                        {comment.can_delete && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.comment_id)}
                                                style={{ backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.8rem" }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>

                                    <p style={{ margin: "5px 0", color: "#555" }}>{comment.content}</p>
                                    <small style={{ color: "#999" }}>{new Date(comment.created_at).toLocaleDateString()}</small>
                                </div>
                            ))
                        )}

                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", marginTop: "10px", marginBottom: "10px", boxSizing: "border-box" }}
                        />

                        <button
                            onClick={handlePostComment}
                            style={{ padding: "8px 14px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                        >
                            Post Comment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySignups;