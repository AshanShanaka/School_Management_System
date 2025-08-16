"use client";

export const columns = [
  { header: "Title", accessor: "title" },
  { header: "Subject", accessor: "lesson.subject.name" },
  { header: "Class", accessor: "lesson.class.name" },
  { header: "Start Date", accessor: "startDate" },
  { header: "Due Date", accessor: "dueDate" },
  { header: "Actions", accessor: "actions", className: "hidden" },
];
