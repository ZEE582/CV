import { useState } from "react";
import type { EventClickArg } from "@fullcalendar/core";
import type { DateSelectArg } from "@fullcalendar/core";import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box } from "@mui/material";
import Header from "../../components/header";
import FullCalendar from "@fullcalendar/react";

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  const handleDateClick = (selected: DateSelectArg) => {
    const title = prompt("Enter event title");
    if (title) {
      setEvents([
        ...events,
        {
          title,
          date: selected.startStr,
        },
      ]);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (window.confirm("Delete this event?")) {
      clickInfo.event.remove();
    }
  };

  return (
    <Box m="20px">
      <Header title="Calendar" subtitle="Your Events" />

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        select={handleDateClick}
        eventClick={handleEventClick}
        events={events}
        height="75vh"
      />
    </Box>
  );
};

export default Calendar;