import { useState } from "react";

const VolunteerRow = ({ attendee, eventDate, eventEnd, onUpdate }) => {
    
    // Helper to get initial time string for inputs (e.g., "13:30")
    const getInitialStart = () => {
        if (attendee.check_in_time) {
            const date = new Date(attendee.check_in_time);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        const date = new Date(eventDate);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const [checkIn, setCheckIn] = useState(getInitialStart());
    const [checkOut, setCheckOut] = useState(""); 
    const [isSaving, setIsSaving] = useState(false);

    // Helper: Combines Event Date + Input Time
    const createSafeDate = (baseDateStr, timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const newDate = new Date(baseDateStr); 
        newDate.setHours(hours, minutes, 0, 0); 
        return newDate; 
    };

    // --- NEW HELPER: PRESERVES LOCAL TIME ---
    // Instead of converting to UTC (which adds 6 hours), this keeps "10:00" as "10:00"
    const toLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000; // Get timezone offset in ms
        const localDate = new Date(date.getTime() - offset); // Shift time back to match local
        return localDate.toISOString().slice(0, 19); // Remove the 'Z' (UTC marker)
    };
    // ----------------------------------------

    const handleSave = async (status) => {
        setIsSaving(true);
        
        let fullCheckInIso = null;
        let fullCheckOutIso = null;

        if (status === 'attended') {
            const inDateObj = createSafeDate(eventDate, checkIn);
            const outDateObj = createSafeDate(eventDate, checkOut);
            
            const eventStartDate = new Date(eventDate);
            const eventEndDate = new Date(eventEnd);

            // VALIDATION 1: Check-out before Check-in?
            if (outDateObj <= inDateObj) {
                alert("Error: Check-out time cannot be before Check-in time.");
                setIsSaving(false);
                return;
            }

            // VALIDATION 2: Outside Event Bounds?
            if (inDateObj < new Date(eventStartDate.getTime() - 60000)) {
                 alert(`Error: Volunteer cannot check in before event starts.`);
                 setIsSaving(false);
                 return;
            }

            if (eventEnd && outDateObj > new Date(eventEndDate.getTime() + 60000)) {
                 alert(`Error: Volunteer cannot check out after event ends.`);
                 setIsSaving(false);
                 return;
            }

            // --- USE THE NEW HELPER HERE ---
            // Use toLocalISOString instead of toISOString
            fullCheckInIso = toLocalISOString(inDateObj);
            fullCheckOutIso = toLocalISOString(outDateObj);
        }

        await onUpdate(attendee.signup_id, status, fullCheckInIso, fullCheckOutIso);
        setIsSaving(false);
    };

    return (
        <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "12px" }}>
                <strong>{attendee.full_name}</strong><br/>
                <small style={{color:"#888"}}>{attendee.email}</small>
            </td>
            
            <td style={{ padding: "12px" }}>
                {attendee.status === 'attended' && attendee.check_in_time ? (
                    <div>
                        <span style={{ color: "#155724", fontWeight: "bold", backgroundColor: "#d4edda", padding: "2px 8px", borderRadius: "10px", fontSize: "0.85rem" }}>
                            ✅ Attended ({Number(attendee.hours_awarded).toFixed(2)} hrs)
                        </span>
                        <br/>
                        <span style={{color: "#0056b3", fontSize: "0.9rem", fontWeight: "bold"}}>
                            {/* Display the saved time nicely */}
                            {new Date(attendee.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                            {new Date(attendee.check_out_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                ) : attendee.status === 'absent' ? (
                     <span style={{ color: "#721c24", fontWeight: "bold", backgroundColor: "#f8d7da", padding: "2px 8px", borderRadius: "10px", fontSize: "0.85rem" }}>
                        ❌ Absent
                    </span>
                ) : (
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <input 
                            type="time" 
                            value={checkIn} 
                            onChange={(e) => setCheckIn(e.target.value)}
                            style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                        <span> to </span>
                        <input 
                            type="time" 
                            value={checkOut} 
                            onChange={(e) => setCheckOut(e.target.value)}
                            style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                    </div>
                )}
            </td>

            <td style={{ padding: "12px" }}>
                {attendee.status === 'registered' ? (
                    <div style={{ display: "flex", gap: "5px" }}>
                        <button 
                            onClick={() => handleSave('attended')} 
                            disabled={!checkOut || isSaving}
                            style={{ 
                                backgroundColor: (!checkOut || isSaving) ? "#ccc" : "#28a745", 
                                color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" 
                            }}
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button 
                            onClick={() => handleSave('absent')}
                            disabled={isSaving}
                            style={{ backgroundColor: isSaving ? "#ccc" : "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                        >
                            Mark Absent
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => handleSave('registered')} 
                        disabled={isSaving}
                        style={{ fontSize: "0.8rem", color: "#007bff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                        Edit
                    </button>
                )}
            </td>
        </tr>
    );
};

export default VolunteerRow;