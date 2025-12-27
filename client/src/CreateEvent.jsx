import { useState } from "react";

const CreateEvent = () => {
    // 1. We split the state to hold date and time separately
    const [eventData, setEventData] = useState({
        title: "",
        description: "",
        date: "", 
        time: "",
        location: ""
    });

    const handleChange = (e) => {
        setEventData({ ...eventData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 2. THE GLUE: Combine separate date & time into one Timestamp for the database
        // Format: YYYY-MM-DD + T + HH:MM + :00 (seconds)
        const combinedDate = `${eventData.date}T${eventData.time}:00`;

        // Create the object to send (mapping our separate fields to the backend's 'event_date')
        const bodyToSend = {
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            event_date: combinedDate 
        };

        try {
            const response = await fetch("http://localhost:5000/events", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "token": localStorage.getItem("token") 
                },
                body: JSON.stringify(bodyToSend)
            });

            if (response.ok) {
                alert("Event Created Successfully!");
                // Reset form
                setEventData({ title: "", description: "", date: "", time: "", location: "" });
                // Optional: Reload page to show new event immediately
                window.location.reload(); 
            } else {
                alert("Failed to create event");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#fff", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <h2 style={{color: "#333"}}>Create New Volunteer Event</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* Title */}
                <div style={{display: "flex", flexDirection: "column"}}>
                    <label style={{fontWeight: "bold", marginBottom: "5px"}}>Event Title</label>
                    <input 
                        type="text" name="title" placeholder="e.g. Beach Cleanup" 
                        value={eventData.title} onChange={handleChange} required 
                        style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}
                    />
                </div>

                {/* Date and Time Row */}
                <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>Date</label>
                        <input 
                            type="date" name="date" 
                            value={eventData.date} onChange={handleChange} required 
                            style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}
                        />
                    </div>
                    <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>Time</label>
                        <input 
                            type="time" name="time" 
                            value={eventData.time} onChange={handleChange} required 
                            style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}
                        />
                    </div>
                </div>

                {/* Location */}
                <div style={{display: "flex", flexDirection: "column"}}>
                    <label style={{fontWeight: "bold", marginBottom: "5px"}}>Location</label>
                    <input 
                        type="text" name="location" placeholder="e.g. 123 Ocean Drive" 
                        value={eventData.location} onChange={handleChange} required 
                        style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}
                    />
                </div>

                {/* Description */}
                <div style={{display: "flex", flexDirection: "column"}}>
                    <label style={{fontWeight: "bold", marginBottom: "5px"}}>Description</label>
                    <textarea 
                        name="description" placeholder="What will volunteers be doing?" 
                        value={eventData.description} onChange={handleChange} required 
                        rows="4"
                        style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc", resize: "vertical"}}
                    />
                </div>

                <button type="submit" style={{
                    padding: "12px", 
                    backgroundColor: "#4A90E2", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "5px", 
                    cursor: "pointer", 
                    fontWeight: "bold",
                    fontSize: "1rem"
                }}>
                    Post Event
                </button>
            </form>
        </div>
    );
};

export default CreateEvent;