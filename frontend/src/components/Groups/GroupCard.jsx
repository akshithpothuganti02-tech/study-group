import React from 'react';
import { Link } from 'react-router-dom';

/**
 * GroupCard — displays a summary of a study group in the browse/dashboard lists.
 */
const GroupCard = ({ group, onJoin, onLeave, isMember, isCreator, joining }) => {
  const memberCount = (group.members || []).length;
  const spotsLeft = group.maxSize - memberCount;
  const isFull = spotsLeft <= 0;

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link to={`/groups/${group.groupId}`} className="font-semibold text-gray-900 hover:text-blue-600 text-lg leading-tight">
            {group.name}
          </Link>
          {isCreator && (
            <span className="badge bg-blue-100 text-blue-700 ml-2 text-xs">Creator</span>
          )}
        </div>
        <span className={`badge ${isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {isFull ? 'Full' : `${spotsLeft} spots left`}
        </span>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
      )}

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(group.subjects || []).map((s) => (
          <span key={s} className="badge bg-indigo-50 text-indigo-700">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          👥 {memberCount}/{group.maxSize} members
        </span>

        <div className="flex gap-2">
          <Link to={`/groups/${group.groupId}`} className="text-xs text-blue-600 hover:underline font-medium">
            View Group →
          </Link>

          {!isMember && !isCreator && !isFull && onJoin && (
            <button
              onClick={() => onJoin(group.groupId)}
              disabled={joining}
              className="btn-primary text-xs py-1 px-3"
            >
              {joining ? '...' : 'Join'}
            </button>
          )}

          {isMember && !isCreator && onLeave && (
            <button
              onClick={() => onLeave(group.groupId)}
              className="btn-danger text-xs py-1 px-3"
            >
              Leave
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
