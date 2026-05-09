import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
import Header from "../../components/header";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
};

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Team Meeting",
      date: "2026-05-10",
    },
    {
      id: "2",
      title: "CV Review",
      date: "2026-05-12",
    },
  ]);

  const [selectedDate, setSelectedDate] = useState("");

  const handleDateSelect = (selected: DateSelectArg) => {
    const date = selected.startStr;
    setSelectedDate(date);

    const title = prompt("Enter activity title");

    if (title) {
      const newEvent = {
        id: `${Date.now()}`,
        title,
        date,
      };

      setEvents([...events, newEvent]);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;

    if (window.confirm("Delete this activity?")) {
      setEvents(events.filter((event) => event.id !== eventId));
    }
  };

  const selectedDayActivities = events.filter(
    (event) => event.date === selectedDate
  );

  return (
    <Box m="20px">
      <Header title="CALENDAR" subtitle="Daily Activities" />

      <Box display="flex" gap="20px">
        <Box flex="1">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            events={events}
            height="75vh"
          />
        </Box>

        <Box
          width="300px"
          p="15px"
          borderRadius="8px"
          sx={{
            backgroundColor: "#1F2A40",
            color: "white",
          }}
        >
          <Typography variant="h5" mb="15px">
            نشاطات اليوم
          </Typography>

          <Typography mb="15px">
            {selectedDate ? selectedDate : "اختاري يوم من التقويم"}
          </Typography>

          {selectedDayActivities.length === 0 ? (
            <Typography>لا يوجد نشاطات لهذا اليوم</Typography>
          ) : (
            <List>
              {selectedDayActivities.map((activity) => (
                <ListItem
                  key={activity.id}
                  sx={{
                    backgroundColor: "#3e4396",
                    mb: "10px",
                    borderRadius: "6px",
                  }}
                >
                  <ListItemText primary={activity.title} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Calendar;