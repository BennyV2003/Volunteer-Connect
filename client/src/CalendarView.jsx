import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import "react-big-calendar/lib/css/react-big-calendar.css";
import enUS from 'date-fns/locale/en-US';

// 1. Setup the "Localizer" (Helps the calendar understand dates/times)
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = ({ events, onEventClick }) => {
    
    // 2. Transform DB data into Calendar data
    // The library needs "start" and "end" as Date objects
    const calendarEvents = events.map(event => {
        const startDate = new Date(event.event_date);
        
        // Logic: If we have an end date, use it. 
        // If not (for old events), default to start + 2 hours.
        let endDate;
        if (event.event_end) {
            endDate = new Date(event.event_end);
        } else {
            endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
        }

        return {
            title: event.title,
            start: startDate,
            end: endDate,
            resource: event
        };
    });

    return (
        <div style={{ height: "500px", marginTop: "20px", backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
            <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onSelectEvent={(event) => onEventClick(event.resource.event_id)} // Handle clicks
                views={['month', 'week', 'day']} // Views available
                defaultView="month"
            />
        </div>
    );
};

export default CalendarView;