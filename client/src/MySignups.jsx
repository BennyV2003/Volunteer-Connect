import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import jsPDF from "jspdf"; // <--- IMPORT THIS

const MySignups = ({ refreshTrigger, onUnregisterSuccess, userName }) => { // <--- ACCEPT userName PROP
    const [signups, setSignups] = useState([]);

    useEffect(() => {
        getSignups();
    }, [refreshTrigger]);

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

    // --- CERTIFICATE GENERATOR ---
    const generateCertificate = (event) => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        // -- STYLING VARIABLES --
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const center = pageWidth / 2;
        const orangeColor = [255, 94, 23]; // UTRGV Orange
        const darkColor = [60, 60, 60];

        // 1. Decorative Border (Double Rectangle)
        doc.setLineWidth(2);
        doc.setDrawColor(...orangeColor);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Outer Orange
        
        doc.setLineWidth(1);
        doc.setDrawColor(200, 200, 200);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30); // Inner Grey

        // 2. Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(40);
        doc.setTextColor(...orangeColor);
        doc.text("Certificate of Service", center, 50, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);
        doc.setTextColor(...darkColor);
        doc.text("This certificate is proudly presented to", center, 70, { align: "center" });

        // 3. Volunteer Name (The Star!)
        doc.setFont("times", "bolditalic");
        doc.setFontSize(36);
        doc.setTextColor(0, 0, 0);
        doc.text(userName || "Volunteer Name", center, 90, { align: "center" });
        
        // Underline the name
        doc.setLineWidth(0.5);
        doc.setDrawColor(100, 100, 100);
        doc.line(center - 60, 92, center + 60, 92);

        // 4. Body Text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(...darkColor);
        
        const hours = Number(event.hours_awarded).toFixed(1);
        const text = `For honestly and faithfully volunteering ${hours} hours of service at the event:`;
        doc.text(text, center, 115, { align: "center" });

        // 5. Event Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(...orangeColor);
        doc.text(event.title, center, 130, { align: "center" });

        doc.setFont("helvetica", "italic");
        doc.setFontSize(14);
        doc.setTextColor(...darkColor);
        const dateStr = new Date(event.event_date).toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.text(`On ${dateStr}`, center, 140, { align: "center" });

        // 6. Signatures Section (Bottom)
        const sigY = 170;
        
        // Left Signature (Organizer)
        doc.setLineWidth(0.5);
        doc.line(40, sigY, 110, sigY); // Line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(event.organizer_name || "Organizer", 75, sigY + 8, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Event Organizer", 75, sigY + 14, { align: "center" });

        // Right Signature (Platform)
        doc.line(pageWidth - 110, sigY, pageWidth - 40, sigY); // Line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("VolunteerConnect", pageWidth - 75, sigY + 8, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Verified Platform Partner", pageWidth - 75, sigY + 14, { align: "center" });

        // 7. Save File
        doc.save(`${event.title.replace(/\s+/g, '_')}_Certificate.pdf`);
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

    const activeEvents = signups.filter(event => !event.is_completed);
    const completedEvents = signups.filter(event => event.is_completed);

    return (
        <div style={{ marginBottom: "50px", marginTop: "40px" }}>
            
            {/* ACTIVE EVENTS SECTION */}
            <h2 style={{ color: "#FF5E17", borderBottom: "2px solid #FF5E17", paddingBottom: "10px" }}>
                ✅ My Registered Events
            </h2>
            
            {activeEvents.length === 0 ? (
                <p style={{ color: "#666", marginBottom: "30px" }}>You have no active registrations.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px", marginBottom: "40px" }}>
                    {activeEvents.map(event => (
                        <div key={event.event_id} style={{ 
                            backgroundColor: "white", padding: "20px", borderRadius: "10px", 
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "5px solid #28a745", 
                            display: "flex", flexDirection: "column", justifyContent: "space-between"
                        }}>
                            <div>
                                <h3 style={{ margin: "0 0 10px 0", color: "#28a745" }}>{event.title}</h3>
                                <p style={{ color: "#555", fontSize: "0.9rem", margin: "5px 0" }}>
                                    <strong>Organized by:</strong> {event.organizer_name}
                                </p>
                                <p style={{ color: "#555", fontSize: "0.9rem", margin: "5px 0" }}>
                                    <strong>Status:</strong> <span style={{fontWeight: "bold", color: "#28a745"}}>Registered</span>
                                </p>
                                <p style={{ margin: "10px 0", color: "#333", lineHeight: "1.4" }}>{event.description}</p>
                                <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666", display: "flex", flexDirection: "column", gap: "5px" }}>
                                    <span>📍 {event.location}</span>
                                    <span>📅 {formatEventTime(event.event_date, event.event_end)}</span>
                                </div>
                            </div>
                            <button onClick={() => handleUnregister(event.event_id)} style={{ marginTop: "20px", width: "100%", padding: "10px", backgroundColor: "white", color: "#dc3545", border: "1px solid #dc3545", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                                Unregister
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* COMPLETED EVENTS SECTION */}
            {completedEvents.length > 0 && (
                <div style={{ marginTop: "50px" }}>
                    <h2 style={{ color: "#6c757d", borderBottom: "2px solid #6c757d", paddingBottom: "10px" }}>
                        📜 My Completed Events
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
                        {completedEvents.map(event => (
                            <div key={event.event_id} style={{ 
                                backgroundColor: "white", padding: "20px", borderRadius: "10px", 
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: "5px solid #6c757d", 
                                display: "flex", flexDirection: "column", justifyContent: "space-between"
                            }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                        <h3 style={{ margin: "0 0 10px 0", color: "#6c757d" }}>{event.title}</h3>
                                        {event.status === 'attended' ? (
                                            <span style={{ backgroundColor: "#00246B", color: "white", padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "bold" }}>
                                                Attended (+{Number(event.hours_awarded || 0)} Hrs)
                                            </span>
                                        ) : (
                                            <span style={{ backgroundColor: "#6c757d", color: "white", padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "bold" }}>
                                                {event.status || "Completed"}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: "#555", fontSize: "0.9rem", margin: "5px 0" }}>
                                        <strong>Organized by:</strong> {event.organizer_name}
                                    </p>
                                    <p style={{ margin: "10px 0", color: "#333", lineHeight: "1.4" }}>{event.description}</p>
                                    <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#666", display: "flex", flexDirection: "column", gap: "5px" }}>
                                        <span>📍 {event.location}</span>
                                        <span>📅 {formatEventTime(event.event_date, event.event_end)}</span>
                                    </div>
                                </div>

                                {/* PRINT CERTIFICATE BUTTON */}
                                {event.status === 'attended' && (
                                    <button 
                                        onClick={() => generateCertificate(event)}
                                        style={{ 
                                            marginTop: "20px", width: "100%", padding: "10px", 
                                            backgroundColor: "#00246B", color: "white", 
                                            border: "none", borderRadius: "5px", 
                                            cursor: "pointer", fontWeight: "bold" 
                                        }}
                                    >
                                        🖨️ Print Certificate
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySignups;