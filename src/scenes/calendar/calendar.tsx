import { useEffect, useState } from "react";
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
  color?: string;
};

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetch("http://localhost:5001/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.log(err));
  }, []);

  const handleDateSelect = (selected: DateSelectArg) => {
    const date = selected.startStr;
    setSelectedDate(date);

    const title = prompt("Enter activity title");

    if (title) {
      let eventColor = "#2196f3";

      if (title.toLowerCase().includes("meeting")) {
        eventColor = "#4caf50";
      } else if (title.toLowerCase().includes("deadline")) {
        eventColor = "#f44336";
      } else if (title.toLowerCase().includes("review")) {
        eventColor = "#2196f3";
      }

      const newEvent = {
        id: `${Date.now()}`,
        title,
        date,
        color: eventColor,
      };

      fetch("http://localhost:5001/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      })
        .then((res) => res.json())
        .then((data) => {
          setEvents([...events, data]);
        });
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;

    if (window.confirm("Delete this activity?")) {
      fetch(`http://localhost:5001/events/${eventId}`, {
        method: "DELETE",
      }).then(() => {
        setEvents(events.filter((event) => event.id !== eventId));
      });
    }
  };

  const selectedDayActivities = events.filter(
    (event) => event.date === selectedDate
  );

  return (
    <Box m="20px">
      <Header title="CALENDAR" subtitle="Daily Activities" />

      <Box display="flex" gap="20px" mb="20px" flexWrap="wrap">
        <Box display="flex" alignItems="center" gap="8px">
          <Box width="15px" height="15px" borderRadius="50%" bgcolor="#4caf50" />
          <Typography color="white">Meeting</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap="8px">
          <Box width="15px" height="15px" borderRadius="50%" bgcolor="#2196f3" />
          <Typography color="white">Review</Typography>
        </Box>

        <Box display="flex" alignItems="center" gap="8px">
          <Box width="15px" height="15px" borderRadius="50%" bgcolor="#f44336" />
          <Typography color="white">Deadline</Typography>
        </Box>
      </Box>

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
                    backgroundColor: activity.color || "#3e4396",
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