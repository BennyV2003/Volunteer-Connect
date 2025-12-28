import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventModal from "./EventModal"; // <--- IMPORT THIS

const localizer = momentLocalizer(moment);

const CustomToolbar = (toolbar) => {
    // ... (Keep your CustomToolbar code exactly the same as before) ...
    // I am omitting it here to save space, but DO NOT DELETE IT from your file!
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
    const [selectedEvent, setSelectedEvent] = useState(null); // <--- NEW STATE

    const myEventsList = events.map(event => ({
        title: event.title,
        start: new Date(event.event_date),
        end: event.event_end ? new Date(event.event_end) : new Date(new Date(event.event_date).getTime() + (2*60*60*1000)),
        resource: event 
    }));

    const eventStyleGetter = (event) => {
        const isFull = event.resource.capacity && event.resource.current_count >= event.resource.capacity;
        return {
            style: {
                backgroundColor: isFull ? '#6c757d' : '#FF5E17',
                borderRadius: '5px', opacity: 0.8, color: 'white', border: '0px', display: 'block'
            }
        };
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
                onView={() => {}}
                components={{ toolbar: CustomToolbar }}
                eventPropGetter={eventStyleGetter}
                
                // CHANGE: Instead of signing up immediately, Open the Modal
                onSelectEvent={(event) => setSelectedEvent(event.resource)} 
            />

            {/* RENDER MODAL IF EVENT SELECTED */}
            {selectedEvent && (
                <EventModal 
                    event={selectedEvent} 
                    onClose={() => setSelectedEvent(null)} 
                    onSignup={onEventClick} // Pass the original signup function here
                />
            )}
        </div>
    );
};

export default CalendarView;