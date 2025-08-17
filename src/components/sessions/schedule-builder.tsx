// pages/session.jsx

import React, { useState } from "react";
import { toast } from "react-toastify";
import sessionData from "../data/sessiondata.json"; // adjust path if needed

const Session = () => {
  const [sessions, setSessions] = useState(sessionData);

  const reshuffleSession = (id) => {
    toast.info(`Reshuffling requested for Session ID: ${id}`);
  };

  const reconfirmFaculty = (id) => {
    toast.success(`Faculty reconfirmed for Session ID: ${id}`);
  };

  const checkConflicts = (session) => {
    return sessions.some(
      (s) =>
        s.id !== session.id &&
        (s.time === session.time || s.faculty === session.faculty)
    );
  };

  const handleChange = (id) => {
    toast.warn("Auto Notification: Session time/location changed.");
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Session Overview</h2>

      {Array.isArray(sessions) &&
        sessions.map((session) => (
          <div
            key={session.id}
            className="border rounded-lg p-4 mb-4 shadow-md"
          >
            <p>
              <strong>Session ID:</strong> {session.id}
            </p>
            <p>
              <strong>Faculty:</strong> {session.faculty}
            </p>
            <p>
              <strong>Status:</strong> {session.status}
            </p>
            <p>
              <strong>Invitation Response:</strong> {session.inviteStatus}
            </p>
            <p>
              <strong>Files:</strong> {session.files.join(", ")}
            </p>
            <p>
              <strong>Travel:</strong> {session.travelStatus}
            </p>
            <p>
              <strong>Time:</strong> {session.time}
            </p>
            <p
              className={`font-bold ${
                checkConflicts(session) ? "text-red-600" : "text-green-600"
              }`}
            >
              {checkConflicts(session)
                ? "⚠️ Conflict Detected"
                : "✅ No Conflict"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => reshuffleSession(session.id)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Reshuffle
              </button>
              <button
                onClick={() => reconfirmFaculty(session.id)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Reconfirm Faculty
              </button>
              <button
                onClick={() => handleChange(session.id)}
                className="bg-purple-500 text-white px-3 py-1 rounded"
              >
                Change Time/Location
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Session;
