import { useState, useEffect } from "react";
import { toast } from 'react-toastify';

const ReviewsModal = ({ event, onClose, userName, readOnly = false, onReviewChange}) => {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

    // --- NEW: EDIT STATE ---
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editHover, setEditHover] = useState(0);
    const [editComment, setEditComment] = useState("");

    // --- NAME FORMATTER ---
    const formatDisplayName = (fullName) => {
        if (!fullName) return "Volunteer";
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0];
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "";
        return `${firstName} ${lastInitial}.`;
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch(`http://localhost:5000/events/${event.event_id}/reviews`);
                const data = await response.json();
                setReviews(data);
            } catch (err) {
                console.error(err.message);
            }
        };
        fetchReviews();
    }, [event.event_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const body = { rating, comment };
            const response = await fetch(`http://localhost:5000/events/${event.event_id}/reviews`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    token: localStorage.getItem("token") 
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast.success("Thanks for your feedback!");
                const newReviewResponse = await response.json();
                
                // Construct the object exactly how the UI expects it
                const newReview = {
                    ...newReviewResponse,
                    full_name: userName 
                };
                
                setReviews([newReview, ...reviews]);
                setComment("");
                setRating(5);
                if (onReviewChange) onReviewChange(); // Notify parent to refresh if needed
            } else {
                const errorMessage = await response.json();
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- NEW: EDIT HANDLER ---
    const handleUpdateReview = async (reviewId) => {
        try {
            const response = await fetch(`http://localhost:5000/events/${event.event_id}/reviews/${reviewId}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    token: localStorage.getItem("token") 
                },
                body: JSON.stringify({ rating: editRating, comment: editComment })
            });

            if (response.ok) {
                toast.success("Review updated!");
                setReviews(reviews.map(r => r.review_id === reviewId ? { ...r, rating: editRating, comment: editComment } : r));
                setEditingReviewId(null);
                if (onReviewChange) onReviewChange();
            } else {
                const errorText = await response.json();
                toast.error(`❌ ${errorText}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- NEW: DELETE HANDLER ---
    const handleDeleteReview = async (reviewId) => {
        if (!confirm("Are you sure you want to delete your review?")) return;
        try {
            const response = await fetch(`http://localhost:5000/events/${event.event_id}/reviews/${reviewId}`, {
                method: "DELETE",
                headers: { token: localStorage.getItem("token") }
            });

            if (response.ok) {
                toast.success("Review deleted.");
                setReviews(reviews.filter(r => r.review_id !== reviewId));
                if (onReviewChange) onReviewChange();
            } else {
                const errorText = await response.json();
                toast.error(`❌ ${errorText}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderStars = (count) => "⭐".repeat(count);

    // --- HELPER FOR INTERACTIVE STARS ---
    const StarRatingInput = ({ currentRating, setRatingState, currentHover, setHoverState }) => (
        <div style={{ display: "flex", gap: "5px" }}>
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <span
                        key={index}
                        style={{ fontSize: "2rem", cursor: "pointer", color: ratingValue <= (currentHover || currentRating) ? "#ffc107" : "#e4e5e9", transition: "color 0.2s" }}
                        onClick={() => setRatingState(ratingValue)}
                        onMouseEnter={() => setHoverState(ratingValue)}
                        onMouseLeave={() => setHoverState(0)}
                    >
                        ★
                    </span>
                );
            })}
        </div>
    );

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
            <div style={{
                backgroundColor: "white", padding: "30px", borderRadius: "8px", width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)", position: "relative"
            }}>
                <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999" }}>&times;</button>

                <h2 style={{ color: "#FF5E17", marginTop: 0 }}>Reviews: {event.title}</h2>

                {/* --- WRITE REVIEW FORM --- */}
                {/* Hide the form if ReadOnly OR if the user already posted a review */}
                {!readOnly && !reviews.some(r => r.full_name === userName) && (
                    <div style={{ backgroundColor: "#fff3e0", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#e65100" }}>Write a Review</h4>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333" }}>Rating:</label>
                                <StarRatingInput currentRating={rating} setRatingState={setRating} currentHover={hover} setHoverState={setHover} />
                            </div>
                            <textarea 
                                placeholder="How was the event?" 
                                value={comment} onChange={e => setComment(e.target.value)} required rows="3"
                                style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "10px" }}
                            />
                            <button type="submit" style={{ backgroundColor: "#FF5E17", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                                Submit Review
                            </button>
                        </form>
                    </div>
                )}

                {/* --- REVIEWS LIST --- */}
                <div>
                    {reviews.length === 0 ? (
                        <p style={{ color: "#777", fontStyle: "italic" }}>No reviews yet.</p>
                    ) : (
                        reviews.map((r) => (
                            <div key={r.review_id} style={{ borderBottom: "1px solid #eee", padding: "15px 0" }}>
                                
                                {editingReviewId === r.review_id ? (
                                    /* --- EDITING MODE --- */
                                    <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px" }}>
                                        <div style={{ marginBottom: "10px" }}>
                                            <StarRatingInput currentRating={editRating} setRatingState={setEditRating} currentHover={editHover} setHoverState={setEditHover} />
                                        </div>
                                        <textarea 
                                            value={editComment} onChange={e => setEditComment(e.target.value)} required rows="3"
                                            style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "10px" }}
                                        />
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button onClick={() => handleUpdateReview(r.review_id)} style={{ backgroundColor: "#28a745", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Save</button>
                                            <button onClick={() => setEditingReviewId(null)} style={{ backgroundColor: "#6c757d", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* --- NORMAL VIEW MODE --- */
                                    <>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                            <strong style={{ color: "#333" }}>{formatDisplayName(r.full_name)}</strong>
                                            
                                            {/* ONLY SHOW EDIT/DELETE IF IT IS THEIR REVIEW */}
                                            {r.full_name === userName ? (
                                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                    <button onClick={() => { setEditingReviewId(r.review_id); setEditRating(r.rating); setEditComment(r.comment); }} style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: "0.9rem" }}>Edit</button>
                                                    <button onClick={() => handleDeleteReview(r.review_id)} style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "0.9rem" }}>Delete</button>
                                                </div>
                                            ) : (
                                                <span style={{ color: "#ffc107", letterSpacing: "2px" }}>{renderStars(r.rating)}</span>
                                            )}
                                        </div>
                                        
                                        {/* If it's their review, show the stars below the name instead */}
                                        {r.full_name === userName && (
                                            <div style={{ color: "#ffc107", letterSpacing: "2px", marginBottom: "5px" }}>{renderStars(r.rating)}</div>
                                        )}
                                        
                                        <p style={{ margin: "5px 0", color: "#555" }}>{r.comment}</p>
                                        <small style={{ color: "#999" }}>{new Date(r.created_at).toLocaleDateString()}</small>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewsModal;