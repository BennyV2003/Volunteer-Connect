import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 1. Setup Moment Localizer (Restored)
const localizer = momentLocalizer(moment);

// 2. Your Custom Toolbar (Restored)
const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToCurrent = () => toolbar.onNavigate('TODAY');

    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', padding: '0 10px' }}>
            <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                <button onClick={goToCurrent} style={btnStyle}>Today</button>
                <button onClick={goToBack} style={btnStyle}>Back</button>
                <button onClick={goToNext} style={btnStyle}>Next</button>
            </div>
            <h3 style={{ flex: 1, textAlign: 'center', margin: 0, color: '#FF5E17', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {toolbar.label}
            </h3>
            <div style={{ flex: 1 }}></div> 
        </div>
    );
};

const btnStyle = { padding: '6px 12px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer', color: '#555', fontWeight: 'bold' };

const CalendarView = ({ events, onEventClick }) => {
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Map DB events to Calendar format
    const myEventsList = events.map(event => ({
        title: event.title,
        start: new Date(event.event_date),
        end: event.event_end ? new Date(event.event_end) : new Date(new Date(event.event_date).getTime() + (2*60*60*1000)),
        resource: event // Store full data here
    }));

    // UTRGV Orange Styling
    const eventStyleGetter = (event) => {
        const isFull = event.resource.capacity && event.resource.current_count >= event.resource.capacity;
        return {
            style: {
                backgroundColor: isFull ? '#6c757d' : '#FF5E17',
                borderRadius: '5px', opacity: 0.8, color: 'white', border: '0px', display: 'block'
            }
        };
    };

    // --- MODAL HELPERS ---
    const handleCloseModal = () => setSelectedEvent(null);

    const formatDate = (dateObj) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return dateObj.toLocaleDateString(undefined, options);
    };

    const formatTimeRange = (start, end) => {
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        return `${start.toLocaleTimeString(undefined, timeOptions)} - ${end.toLocaleTimeString(undefined, timeOptions)}`;
    };

    return (
        <div style={{ height: '550px', marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <Calendar
                localizer={localizer}
                events={myEventsList}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                date={date} 
                onNavigate={(newDate) => setDate(newDate)} 
                view='month'
                onView={() => {}} // Disable view switching
                components={{ toolbar: CustomToolbar }}
                eventPropGetter={eventStyleGetter}
                
                // On click, set the selected event to the raw DB data
                onSelectEvent={(event) => setSelectedEvent(event)} 
            />

            {/* --- INLINE MODAL WITH ORGANIZED BY SECTION --- */}
            {selectedEvent && (
                 <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white", padding: "30px", borderRadius: "8px", width: "90%", maxWidth: "500px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)", position: "relative"
                    }}>
                        <button 
                            onClick={handleCloseModal}
                            style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#999" }}
                        >
                            &times;
                        </button>

                        <h2 style={{ color: "#FF5E17", marginTop: 0, marginBottom: "5px" }}>{selectedEvent.title}</h2>
                        
                        {/* 1. ORGANIZED BY SECTION */}
                        <p style={{ margin: "0 0 20px 0", color: "#555", fontSize: "1rem" }}>
                            <strong>Organized by:</strong> {selectedEvent.resource.organizer_name}
                        </p>

                        <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <strong style={{ minWidth: "70px", color: "#333" }}>Date:</strong>
                                <span>{formatDate(selectedEvent.start)}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <strong style={{ minWidth: "70px", color: "#333" }}>Time:</strong>
                                <span>{formatTimeRange(selectedEvent.start, selectedEvent.end)}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <strong style={{ minWidth: "70px", color: "#333" }}>Location:</strong>
                                <span>{selectedEvent.resource.location}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <strong style={{ display: "block", marginBottom: "5px", color: "#333" }}>Description:</strong>
                            <div style={{ backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "5px", fontSize: "0.95rem", color: "#555" }}>
                                {selectedEvent.resource.description}
                            </div>
                        </div>

                        {/* Capacity Status */}
                        {selectedEvent.resource.capacity > 0 && (
                            <p style={{ 
                                fontWeight: "bold", 
                                color: selectedEvent.resource.current_count >= selectedEvent.resource.capacity ? "#dc3545" : "#e65100", 
                                marginBottom: "25px" 
                            }}>
                                👥 {selectedEvent.resource.current_count || 0} / {selectedEvent.resource.capacity} Spots Filled
                            </p>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button 
                                onClick={handleCloseModal}
                                style={{ padding: "10px 20px", border: "1px solid #ccc", backgroundColor: "white", borderRadius: "5px", cursor: "pointer" }}
                            >
                                Close
                            </button>
                            
                            <button 
                                onClick={() => {
                                    onEventClick(selectedEvent.resource.event_id);
                                    handleCloseModal();
                                }}
                                disabled={selectedEvent.resource.capacity && selectedEvent.resource.current_count >= selectedEvent.resource.capacity}
                                style={{ 
                                    padding: "10px 20px", 
                                    border: "none", 
                                    backgroundColor: (selectedEvent.resource.capacity && selectedEvent.resource.current_count >= selectedEvent.resource.capacity) ? "#ccc" : "#FF5E17", // UTRGV Orange
                                    color: "white", 
                                    borderRadius: "5px", 
                                    cursor: (selectedEvent.resource.capacity && selectedEvent.resource.current_count >= selectedEvent.resource.capacity) ? "not-allowed" : "pointer",
                                    fontWeight: "bold"
                                }}
                            >
                                {(selectedEvent.resource.capacity && selectedEvent.resource.current_count >= selectedEvent.resource.capacity) ? "Event Full" : "Volunteer Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;