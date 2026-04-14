import React from 'react';

/**
 * SessionCard — displays a single study session with time, location, and actions.
 */
const SessionCard = ({ session, isCreator, onDelete, onEdit }) => {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  const isPast = end < new Date();

  const formatDate = (d) =>
    d.toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

  const durationMs = end - start;
  const durationMin = Math.round(durationMs / 60000);
  const durationLabel =
    durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h ${durationMin % 60 > 0 ? durationMin % 60 + 'm' : ''}`.trim()
      : `${durationMin}m`;

  return (
    <div className={`card ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{session.title}</h3>
            {isPast && <span className="badge bg-gray-100 text-gray-500 text-xs">Past</span>}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <span>📅</span>
              <span>{formatDate(start)}</span>
              <span className="text-gray-400">·</span>
              <span>{formatTime(start)} – {formatTime(end)}</span>
              <span className="text-gray-400">({durationLabel})</span>
            </div>

            {session.location && (
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>{session.location}</span>
              </div>
            )}

            {session.meetingLink && (
              <div className="flex items-center gap-1.5">
                <span>🔗</span>
                <a href={session.meetingLink} target="_blank" rel="noreferrer"
                  className="text-blue-600 hover:underline truncate max-w-xs">
                  Join Online
                </a>
              </div>
            )}
          </div>

          {session.description && (
            <p className="text-sm text-gray-500 mt-2">{session.description}</p>
          )}
        </div>

        {/* Actions for session creator */}
        {isCreator && !isPast && (
          <div className="flex gap-2 ml-4">
            {onEdit && (
              <button onClick={() => onEdit(session)} className="text-sm text-blue-600 hover:underline">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(session.sessionId)} className="text-sm text-red-500 hover:underline">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;
