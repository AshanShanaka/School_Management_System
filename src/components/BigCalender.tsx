"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const handleEventMouseEnter = (event: any, e: React.MouseEvent) => {
    setHoveredEvent(event);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
  };

  const eventStyleGetter = (event: any) => {
    const backgroundColor = "#e2f8ff";
    const style = {
      backgroundColor,
      borderRadius: "6px",
      opacity: 0.9,
      color: "black",
      border: "1px solid #b3e0ff",
      display: "block",
      padding: "6px 10px",
      height: "100%",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
      cursor: "pointer",
    };
    return {
      style,
    };
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">School Timetable</h2>
        <p className="text-sm text-gray-600">
          View weekly and daily schedules for classes (Monday to Friday)
        </p>
      </div>
      <div className="flex-1">
        <Calendar
          localizer={localizer}
          events={data}
          startAccessor="start"
          endAccessor="end"
          views={["work_week", "day"]}
          view={view}
          style={{ height: "100%" }}
          onView={handleOnChangeView}
          min={new Date(2025, 1, 0, 8, 0, 0)}
          max={new Date(2025, 1, 0, 17, 0, 0)}
          step={60}
          timeslots={1}
          defaultView={Views.WORK_WEEK}
          formats={{
            timeGutterFormat: () => "",
            eventTimeRangeFormat: ({ start, end }) => {
              return `${moment(start).format("HH:mm")} - ${moment(end).format(
                "HH:mm"
              )}`;
            },
            dayFormat: "ddd",
            dayHeaderFormat: "dddd, MMMM D",
          }}
          eventPropGetter={eventStyleGetter}
          components={{
            event: ({ event }) => (
              <div
                className="p-1 h-full flex flex-col justify-between hover:bg-blue-50 transition-colors"
                onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                onMouseLeave={handleEventMouseLeave}
              >
                <div className="font-medium text-sm truncate">
                  {event.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {moment(event.start).format("HH:mm")} -{" "}
                  {moment(event.end).format("HH:mm")}
                </div>
              </div>
            ),
          }}
        />
      </div>
      {hoveredEvent && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
            minWidth: "200px",
            maxWidth: "300px",
          }}
        >
          <h3 className="font-semibold text-lg mb-2">{hoveredEvent.title}</h3>
          <div className="text-sm text-gray-600">
            <p className="mb-1">
              <span className="font-medium">Time:</span>{" "}
              {moment(hoveredEvent.start).format("HH:mm")} -{" "}
              {moment(hoveredEvent.end).format("HH:mm")}
            </p>
            <p className="mb-1">
              <span className="font-medium">Date:</span>{" "}
              {moment(hoveredEvent.start).format("dddd, MMMM D")}
            </p>
            <p className="mb-1">
              <span className="font-medium">Duration:</span>{" "}
              {moment
                .duration(
                  moment(hoveredEvent.end).diff(moment(hoveredEvent.start))
                )
                .asHours()}{" "}
              hours
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BigCalendar;
