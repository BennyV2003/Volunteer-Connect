const EventModal = ({ event, onClose, onSignup }) => {
    if (!event) return null;

    // Helper for formatting times
    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Helper for a nice long date (e.g. "Saturday, December 31, 2025")
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const isFull = event.capacity && event.current_count >= event.capacity;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
            <div style={{
                backgroundColor: "white", padding: "25px", borderRadius: "10px", width: "90%", maxWidth: "500px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)", position: "relative",
                display: "flex", flexDirection: "column", gap: "15px"
            }}>
                {/* Close Button (X) */}
                <button 
                    onClick={onClose}
                    style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: "#999" }}
                >
                    ✖
                </button>

                {/* TITLE */}
                <h2 style={{ color: "#4A90E2", margin: "0 0 5px 0", paddingRight: "20px" }}>{event.title}</h2>
                
                {/* NEW INFO SECTION: Vertical List with Labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
                    <div style={{ fontSize: "1rem", color: "#333" }}>
                        <strong style={{ color: "#555", width: "80px", display: "inline-block" }}>Date:</strong> 
                        {formatDate(event.event_date)}
                    </div>
                    <div style={{ fontSize: "1rem", color: "#333" }}>
                        <strong style={{ color: "#555", width: "80px", display: "inline-block" }}>Time:</strong> 
                        {formatTime(event.event_date)} - {event.event_end ? formatTime(event.event_end) : "TBD"}
                    </div>
                    <div style={{ fontSize: "1rem", color: "#333" }}>
                        <strong style={{ color: "#555", width: "80px", display: "inline-block" }}>Location:</strong> 
                        {event.location}
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                    <strong style={{ color: "#555", display: "block", marginBottom: "5px" }}>Description:</strong>
                    <p style={{ color: "#444", lineHeight: "1.6", margin: 0, maxHeight: "150px", overflowY: "auto", backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "5px" }}>
                        {event.description}
                    </p>
                </div>

                {/* CAPACITY INFO */}
                <div>
                    {event.capacity ? (
                        <p style={{ 
                            fontWeight: "bold", margin: 0,
                            color: isFull ? "#dc3545" : "#FF5E17" 
                        }}>
                            👥 {event.current_count} / {event.capacity} Spots Filled
                            {isFull && " (Event Full)"}
                        </p>
                    ) : (
                        <p style={{ color: "#FF5E17", fontWeight: "bold", margin: 0 }}>👥 Open to All Volunteers</p>
                    )}
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                    <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #ccc", background: "white", borderRadius: "5px", cursor: "pointer", color: "#555" }}>
                        Close
                    </button>
                    <button 
                        onClick={() => { onSignup(event.event_id); onClose(); }}
                        disabled={isFull}
                        style={{ 
                            padding: "10px 25px", 
                            backgroundColor: isFull ? "#ccc" : "#FF5E17", 
                            color: "white", border: "none", borderRadius: "5px", 
                            cursor: isFull ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "1rem"
                        }}
                    >
                        {isFull ? "Full Capacity" : "Volunteer Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;