import { useEffect, useState } from "react";
import CalendarView from "./CalendarView";
import ReviewsModal from "./ReviewsModal"; // <--- IMPORT MODAL
import { toast } from 'react-toastify';

const EventBoard = ({ refreshTrigger, onSignupSuccess, userName }) => { // <--- Added userName prop
    const [events, setEvents] = useState([]);
    const [mySignupIds, setMySignupIds] = useState(new Set()); 
    const [view, setView] = useState('list'); 
    const [searchTerm, setSearchTerm] = useState("");

    // --- STATE FOR REVIEWS ---
    const [viewingReviews, setViewingReviews] = useState([]); 
    const [showViewReviewsModal, setShowViewReviewsModal] = useState(false);
    const [selectedReviewEvent, setSelectedReviewEvent] = useState(null); // <--- NEW: For Writing Reviews

    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [viewingComments, setViewingComments] = useState([]);
    const [selectedCommentEventId, setSelectedCommentEventId] = useState(null);
    const [newComment, setNewComment] = useState("");

    
    useEffect(() => {
        const getData = async () => {
            try {
                const token = localStorage.getItem("token");
                const eventsRes = await fetch("http://localhost:5000/events", { headers: { token } });
                const eventsData = await eventsRes.json();
                
                const signupsRes = await fetch("http://localhost:5000/my-signups", { headers: { token } });
                const signupsData = await signupsRes.json();
                
                const ids = new Set(signupsData.map(s => s.event_id));
                setMySignupIds(ids);

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

    const handleSeeReviews = async (eventId) => {
        try {
            const response = await fetch(`http://localhost:5000/events/${eventId}/reviews`, {
                headers: { token: localStorage.getItem("token") }
            });
            if (response.ok) {
                const jsonData = await response.json();
                setViewingReviews(jsonData); 
                setShowViewReviewsModal(true); 
            } else {
                toast.error("Could not fetch reviews");
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleSeeComments = async (eventId) => {
    try {
        const response = await fetch(`http://localhost:5000/events/${eventId}/comments`, {
            
                headers: { token: localStorage.getItem("token") }
            }
        );
                


        if (response.ok) {
            const jsonData = await response.json();
            setViewingComments(jsonData);
            setSelectedCommentEventId(eventId);
            setShowCommentsModal(true);
        } else {
            toast.error("Could not fetch comments");
        }
    } catch (err) {
        console.error(err.message);
    }
};

const refreshEventsOnly = async () => {
    try {
        const token = localStorage.getItem("token");
        const eventsRes = await fetch("http://localhost:5000/events", { headers: { token } });
        const eventsData = await eventsRes.json();

        const activeEvents = eventsData.filter(e => !e.is_completed);
        setEvents(activeEvents);
    } catch (err) {
        console.error(err.message);
    }
};

const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
        const response = await fetch(
            `http://localhost:5000/events/${selectedCommentEventId}/comments`,
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
            await refreshEventsOnly();
            handleSeeComments(selectedCommentEventId);
        }   else {
            toast.error("Could not post comment");
        }
    } catch (err) {
        console.error(err);
    }
};

const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;

    try {
        const response = await fetch(
            `http://localhost:5000/events/${selectedCommentEventId}/comments/${commentId}`,
            {
                method: "DELETE",
                headers: {
                    token: localStorage.getItem("token")
                }
            }
        );

        if (response.ok) {
            toast.success("Comment deleted");
            await refreshEventsOnly();
            handleSeeComments(selectedCommentEventId);
        } else {
            const errorText = await response.text();
            toast.error(errorText || "Could not delete comment");
        }
    } catch (err) {
        console.error(err);
        toast.error("Server Error");
    }
};



    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
        
);

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
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#333" }}>Upcoming Opportunities</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setView('list')} style={{ padding: "8px 15px", backgroundColor: view === 'list' ? "#e9ecef" : "transparent", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", fontWeight: view === 'list' ? "bold" : "normal" }}>List View</button>
                    <button onClick={() => setView('calendar')} style={{ padding: "8px 15px", backgroundColor: view === 'calendar' ? "#4A90E2" : "transparent", color: view === 'calendar' ? "white" : "black", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer", fontWeight: view === 'calendar' ? "bold" : "normal" }}>Calendar View</button>
                </div>
            </div>

            {view === 'list' && (
                <input type="text" placeholder="🔍 Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem" }} />
            )}

            {view === 'calendar' ? (
                <CalendarView events={events} onEventClick={handleSignup} />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {filteredEvents.length === 0 ? (
                        <p style={{ color: "#777" }}>No new opportunities at the moment.</p>
                    ) : (
                        filteredEvents.map(event => (
                            <div key={event.event_id} style={{ 
                                backgroundColor: "white", padding: "25px", borderRadius: "10px", 
                                boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "6px solid #FF5E17", 
                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px"
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                        <h3 style={{ margin: 0, color: "#333", fontSize: "1.4rem" }}>{event.title}</h3>
                                        {event.capacity > 0 && (
                                            <span style={{ fontSize: "0.8rem", padding: "4px 10px", borderRadius: "15px", backgroundColor: event.current_count >= event.capacity ? "#dc3545" : "#e9ecef", color: event.current_count >= event.capacity ? "white" : "#495057", fontWeight: "bold" }}>
                                                👥 {event.current_count || 0} / {event.capacity} Filled
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "0.9rem" }}>Organized by <strong>{event.organizer_name}</strong></p>
                                    <p style={{ color: "#555", lineHeight: "1.6", marginBottom: "15px", maxWidth: "95%" }}>{event.description}</p>
                                    <div style={{ display: "flex", gap: "20px", color: "#777", fontSize: "0.95rem" }}>
                                        <span>📅 {formatEventTime(event.event_date, event.event_end)}</span>
                                        <span>📍 {event.location}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "25px", borderLeft: "1px solid #eee", minWidth: "200px" }}>
                                    <button 
                                        onClick={() => handleSignup(event.event_id)}
                                        disabled={
                                             mySignupIds.has(event.event_id) ||
                                             (event.capacity && event.current_count >= event.capacity)
                                                }
                                        style={{
                                                 ...actionBtnStyle,
                                                 backgroundColor: mySignupIds.has(event.event_id)
                                                     ? "#6c757d"
                                                     : (event.capacity && event.current_count >= event.capacity)
                                                     ? "#ccc"
                                                     : "#FF5E17",
                                             color: "white",
                                             cursor: mySignupIds.has(event.event_id) || (event.capacity && event.current_count >= event.capacity)
                                                     ? "not-allowed"
                                                     : "pointer"
                                            }}
>
                                              {mySignupIds.has(event.event_id)
                                                      ? "Already Registered"
                                                      : (event.capacity && event.current_count >= event.capacity)
                                                      ? "Event Full"
                                                      : "Volunteer Now"}
                                            </button>

                                    <button onClick={() => handleSeeReviews(event.event_id)} style={{ ...actionBtnStyle, backgroundColor: "#17a2b8", color: "white" }}>
                                        👀 See Reviews
                                    </button>
                                    
                                    <button
                                    onClick={() => handleSeeComments(event.event_id)} 
                                    style={{ ...actionBtnStyle, backgroundColor: "#6c757d", color: "white" }}
                                        >
                                    💬 {event.comment_count || 0} Comments
                                    </button>
 
                                    {/* NEW WRITE REVIEW BUTTON */}
                                    <button onClick={() => setSelectedReviewEvent(event)} style={{ ...actionBtnStyle, backgroundColor: "#ffc107", color: "black" }}>
                                        ⭐ Write Review
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- REVIEWS MODALS --- */}
            {selectedReviewEvent && (
                <ReviewsModal event={selectedReviewEvent} userName={userName} onClose={() => setSelectedReviewEvent(null)} />
            )}

            {showViewReviewsModal && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", width: "500px", maxWidth: "90%", maxHeight: "80vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                            <h3 style={{ margin: 0, color: "#333" }}>Event Reviews</h3>
                            <button onClick={() => setShowViewReviewsModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
                        </div>
                        {viewingReviews.length === 0 ? <p style={{ textAlign: "center", color: "#666" }}>No reviews yet.</p> : viewingReviews.map((review, index) => (
                            <div key={index} style={{ borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                    <strong style={{ fontSize: "1.05rem" }}>{review.user_name || "Volunteer"}</strong>
                                    <span style={{ color: "#FFD700", fontSize: "1.2rem" }}>{"★".repeat(review.rating)}</span>
                                </div>
                                <p style={{ margin: "5px 0", color: "#555", lineHeight: "1.4" }}>"{review.comment}"</p>
                                <small style={{ color: "#999" }}>{new Date(review.created_at).toLocaleDateString()}</small>
                            </div>
                        ))}
                    </div>
                </div>
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
                  
                <div key={comment.comment_id || index}  
            style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "15px",
            marginBottom: "15px"
}}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <strong style={{ color: comment.is_organizer ? "#FF5E17" : "#333" }}>
        {comment.full_name}
        {comment.is_organizer && (
            <span title="Event Organizer" style={{ marginLeft: 6 }}>
                ⭐
            </span>
        )}
    </strong>

    {comment.can_delete && (
            <button
                onClick={() => handleDeleteComment(comment.comment_id)}
                style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "0.8rem"
                }}
            >
                Delete
            </button>
        )}
    </div>

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
                   marginBottom: "10px",
                   boxSizing: "border-box"
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

export default EventBoard;