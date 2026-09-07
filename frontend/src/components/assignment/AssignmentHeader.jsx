import React from "react";

function formatDate(dateString) {
  if (!dateString) {
    return "________";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return dateString;
  }

  return `${day}/${month}/${year}`;
}

function AssignmentHeader({ assignment }) {
  return (
    <div className="border-b border-slate-300 pb-4 text-xs text-slate-800">

      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">

        {/* Name */}

        {assignment.showName && (
          <div>
            <strong>Name:</strong>{" "}
            {assignment.studentName || "Student Name"}
          </div>
        )}

        {/* Roll Number */}

        {assignment.showRollNumber && (
          <div>
            <strong>Roll No:</strong>{" "}
            {assignment.rollNumber || "________"}
          </div>
        )}

        {/* Subject */}

        {assignment.showSubject && (
          <div>
            <strong>Subject:</strong>{" "}
            {assignment.subject || "Subject"}
          </div>
        )}

        {/* Date */}

        {assignment.showDate && (
          <div>
            <strong>Date:</strong>{" "}
            {formatDate(assignment.date)}
          </div>
        )}

        {/* Class */}

        {assignment.showClass && (
          <div>
            <strong>Class:</strong>{" "}
            {assignment.className || "________"}
          </div>
        )}

        {/* Section */}

        {assignment.showSection && (
          <div>
            <strong>Section:</strong>{" "}
            {assignment.section || "________"}
          </div>
        )}

        {/* Teacher */}

        {assignment.showTeacher && (
          <div>
            <strong>Teacher:</strong>{" "}
            {assignment.teacherName || "________"}
          </div>
        )}

      </div>

    </div>
  );
}

export default AssignmentHeader;