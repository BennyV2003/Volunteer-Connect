import { useState, useEffect } from "react";
import { toast } from 'react-toastify';

const ReviewsModal = ({ event, onClose, userName, readOnly = false }) => { // <--- ADD readOnly PROP
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

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
                const newReview = {
                    review_id: Date.now(),
                    full_name: userName,
                    rating,
                    comment,
                    created_at: new Date().toISOString()
                };
                setReviews([newReview, ...reviews]);
                setComment("");
                setRating(5);
            } else {
                toast.error("Failed to submit review.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderStars = (count) => "⭐".repeat(count);

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

                {/* --- ONLY SHOW FORM IF NOT READ ONLY --- */}
                {!readOnly && (
                    <div style={{ backgroundColor: "#fff3e0", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#e65100" }}>Write a Review</h4>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#333" }}>Rating:</label>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    {[...Array(5)].map((_, index) => {
                                        const ratingValue = index + 1;
                                        return (
                                            <span
                                                key={index}
                                                style={{ fontSize: "2rem", cursor: "pointer", color: ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9", transition: "color 0.2s" }}
                                                onClick={() => setRating(ratingValue)}
                                                onMouseEnter={() => setHover(ratingValue)}
                                                onMouseLeave={() => setHover(0)}
                                            >
                                                ★
                                            </span>
                                        );
                                    })}
                                </div>
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
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <strong style={{ color: "#333" }}>{r.full_name}</strong>
                                    <span style={{ color: "#ffc107", letterSpacing: "2px" }}>{renderStars(r.rating)}</span>
                                </div>
                                <p style={{ margin: "5px 0", color: "#555" }}>{r.comment}</p>
                                <small style={{ color: "#999" }}>{new Date(r.created_at).toLocaleDateString()}</small>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewsModal;