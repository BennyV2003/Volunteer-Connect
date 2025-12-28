import { useState } from "react";


const CreateEvent = () => {
    const [eventData, setEventData] = useState({
        title: "", 
        description: "", 
        date: "", 
        startTime: "", 
        endTime: "", 
        location: "",
        capacity: "" // NEW
    });

    const handleChange = (e) => {
        setEventData({ ...eventData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Combine Date + Start Time
        const combinedStart = `${eventData.date}T${eventData.startTime}:00`;
        
        // 2. Combine Date + End Time
        const combinedEnd = `${eventData.date}T${eventData.endTime}:00`;

        const now = new Date(); // Get current date and time

        // --- VALIDATION 1: PAST DATES ---
        // Check if the Start time is in the past
        if (new Date(combinedStart) < now) {
            alert("Error: You cannot schedule an event in the past.");
            return;
        }
        // --------------------------------

        // --- NEW SAFETY CHECK ---
        // We create Date objects just to compare them
        if (new Date(combinedEnd) <= new Date(combinedStart)) {
            alert("Error: End Time cannot be before Start Time.");
            return; // Stop here! Do not send to database.
        }
        // ------------------------

        const bodyToSend = {
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            event_date: combinedStart,
            event_end: combinedEnd,
            capacity: eventData.capacity === "" ? null : eventData.capacity
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
                <div style={{display: "flex", flexDirection: "column"}}>
                    <label style={{fontWeight: "bold", marginBottom: "5px"}}>Event Title</label>
                    <input type="text" name="title" placeholder="e.g. Beach Cleanup" value={eventData.title} onChange={handleChange} required style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}/>
                </div>

                {/* DATE + START + END ROW */}
                <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>Date</label>
                        <input type="date" name="date" value={eventData.date} onChange={handleChange} required style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}/>
                    </div>
                    <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>Start Time</label>
                        <input type="time" name="startTime" value={eventData.startTime} onChange={handleChange} required style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}/>
                    </div>
                    {/* NEW INPUT */}
                    <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>End Time</label>
                        <input type="time" name="endTime" value={eventData.endTime} onChange={handleChange} required style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}/>
                    </div>
                </div>

                <div style={{display: "flex", gap: "20px"}}></div>
                    <div style={{display: "flex", flexDirection: "column", flex: 2 }}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>Location</label>
                        <input type="text" name="location" placeholder="e.g. 123 Ocean Drive" value={eventData.location} onChange={handleChange} required style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}/>
                    </div>

                    {/* NEW CAPACITY INPUT */}
                    <div style={{display: "flex", flexDirection: "column", flex: 1}}>
                        <label style={{fontWeight: "bold", marginBottom: "5px"}}>Max Volunteers</label>
                        <input 
                            type="number" 
                            name="capacity" 
                            placeholder="No Limit" 
                            min="1"
                            value={eventData.capacity} 
                            onChange={handleChange} 
                            style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}}
                        />
                    </div>

                <div style={{display: "flex", flexDirection: "column"}}>
                    <label style={{fontWeight: "bold", marginBottom: "5px"}}>Description</label>
                    <textarea name="description" placeholder="What will volunteers be doing?" value={eventData.description} onChange={handleChange} required rows="4" style={{padding: "10px", borderRadius: "5px", border: "1px solid #ccc", resize: "vertical"}}/>
                </div>

                <button type="submit" style={{ padding: "12px", backgroundColor: "#4A90E2", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                    Post Event
                </button>
            </form>
        </div>
    );
};

export default CreateEvent;