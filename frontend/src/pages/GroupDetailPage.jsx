import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchGroupById, fetchSessions, deleteSession,
  joinGroup, leaveGroup, deleteGroup, fetchUserProfile,
  getUploadUrl, fetchGroupFiles,
} from '../services/api';
import SessionCard from '../components/Sessions/SessionCard';
import CreateSessionForm from '../components/Sessions/CreateSessionForm';
import axios from 'axios';

/**
 * GroupDetailPage — full view of a single study group showing members,
 * upcoming sessions, file uploads, and management controls.
 */
const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'files'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadAll();
  }, [groupId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [groupRes, sessionsRes, profileRes] = await Promise.all([
        fetchGroupById(groupId),
        fetchSessions(groupId),
        fetchUserProfile(),
      ]);
      setGroup(groupRes.group);
      setSessions(sessionsRes.sessions || []);
      setProfile(profileRes.profile);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load group.');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const res = await fetchGroupFiles(groupId);
      setFiles(res.files || []);
    } catch (err) {
      console.error('Files load error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'files' && group) loadFiles();
  }, [activeTab, group]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl } = await getUploadUrl(groupId, file.name, file.type);
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
      loadFiles();
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Cancel this session?')) return;
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete session.');
    }
  };

  const handleSessionCreated = (newSession) => {
    setSessions((prev) => [...prev, newSession].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
    setShowSessionForm(false);
  };

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;
    await leaveGroup(groupId);
    navigate('/dashboard');
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    await deleteGroup(groupId);
    navigate('/dashboard');
  };

  if (loading) return <div className="flex justify-center h-64 items-center text-gray-400 animate-pulse">Loading group...</div>;
  if (!group) return <div className="text-center text-red-500 mt-10">{errorMsg || 'Group not found.'}</div>;

  const isMember = group.members?.includes(profile?.userId);
  const isCreator = group.creatorId === profile?.userId;
  const memberCount = (group.members || []).length;
  const upcomingSessions = sessions.filter((s) => new Date(s.startTime) > new Date());
  const pastSessions = sessions.filter((s) => new Date(s.endTime) <= new Date());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link to="/groups" className="hover:text-blue-600">Groups</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800">{group.name}</span>
      </nav>

      {/* Group Header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && <p className="text-gray-600 mt-2">{group.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {(group.subjects || []).map((s) => (
                <span key={s} className="badge bg-indigo-50 text-indigo-700">{s}</span>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>👥 {memberCount}/{group.maxSize} members</span>
              {group.preferredTimes?.length > 0 && (
                <span>🕐 {group.preferredTimes.join(', ')}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isMember && !isCreator && (
              <button onClick={handleLeave} className="btn-danger text-sm">Leave Group</button>
            )}
            {isCreator && (
              <>
                <Link to={`/groups/${groupId}/edit`} className="btn-secondary text-sm text-center">Edit Group</Link>
                <button onClick={handleDeleteGroup} className="btn-danger text-sm">Delete Group</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['sessions', 'files'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'sessions' ? `Sessions (${sessions.length})` : 'Study Materials'}
          </button>
        ))}
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {isMember && (
            <button onClick={() => setShowSessionForm(true)} className="btn-primary">
              + Schedule Session
            </button>
          )}

          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcomingSessions.map((s) => (
                  <SessionCard key={s.sessionId} session={s}
                    isCreator={s.createdBy === profile?.userId}
                    onDelete={handleDeleteSession} />
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Past Sessions</h3>
              <div className="space-y-3">
                {pastSessions.map((s) => (
                  <SessionCard key={s.sessionId} session={s} isCreator={false} />
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-600">No sessions scheduled yet.</p>
              {isMember && <p className="text-gray-400 text-sm mt-1">Click "Schedule Session" to add one.</p>}
            </div>
          )}
        </div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {isMember && (
            <div>
              <label className="btn-primary cursor-pointer inline-block">
                {uploading ? 'Uploading...' : '+ Upload Study Material'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
              <p className="text-xs text-gray-400 mt-1">PDFs, Word docs, images, etc.</p>
            </div>
          )}

          {files.length === 0 ? (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-gray-600">No files uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.key} className="card flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{file.fileName}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <a href={file.downloadUrl} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session creation modal */}
      {showSessionForm && (
        <CreateSessionForm
          groupId={groupId}
          existingSessions={sessions}
          onSuccess={handleSessionCreated}
          onClose={() => setShowSessionForm(false)}
        />
      )}
    </div>
  );
};

export default GroupDetailPage;
