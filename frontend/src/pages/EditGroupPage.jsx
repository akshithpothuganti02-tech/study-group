import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchGroupById, updateGroup } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = [
  'Mathematics', 'Statistics', 'Computer Science', 'Programming',
  'Physics', 'Chemistry', 'Biology', 'Engineering', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'Networking', 'Economics',
  'Business', 'Law', 'History', 'Literature', 'Languages', 'Other',
];

const PREFERRED_TIMES = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Weekend'];

/**
 * EditGroupPage — form for editing an existing study group.
 */
const EditGroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    subjects: [],
    maxSize: 8,
    preferredTimes: [],
    isPublic: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchGroupById(groupId);
      const groupData = res.group;
      
      // Ensure only the creator can edit
      if (groupData.creatorId !== user?.userId) {
        navigate(`/groups/${groupId}`);
        return;
      }
      
      setForm({
        name: groupData.name || '',
        description: groupData.description || '',
        subjects: groupData.subjects || [],
        maxSize: groupData.maxSize || 8,
        preferredTimes: groupData.preferredTimes || [],
        isPublic: groupData.isPublic ?? true,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleSubject = (subject) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject)
        ? f.subjects.filter((s) => s !== subject)
        : [...f.subjects, subject],
    }));
  };

  const toggleTime = (time) => {
    setForm((f) => ({
      ...f,
      preferredTimes: f.preferredTimes.includes(time)
        ? f.preferredTimes.filter((t) => t !== time)
        : [...f.preferredTimes, time],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.subjects.length === 0) {
      setErrorMsg('Please select at least one subject.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      await updateGroup(groupId, form);
      navigate(`/groups/${groupId}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update group.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center h-64 items-center text-gray-400 animate-pulse">Loading group details...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link to="/groups" className="hover:text-blue-600">Groups</Link>
        <span className="mx-2">›</span>
        <Link to={`/groups/${groupId}`} className="hover:text-blue-600">Group Details</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800">Edit</span>
      </nav>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Study Group</h1>
        <p className="text-gray-500 text-sm mt-1">Update your group settings and preferences.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
          <input name="name" type="text" required value={form.name} onChange={handleChange}
            className="input-field" placeholder="e.g. Cloud Computing Study Squad" maxLength={80} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            className="input-field" rows={3} placeholder="What will your group focus on?" maxLength={500} />
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subjects * <span className="text-gray-400 font-normal">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s} type="button"
                onClick={() => toggleSubject(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.subjects.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Max Size & Visibility */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
            <select name="maxSize" value={form.maxSize} onChange={handleChange} className="input-field">
              {[2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} members</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select name="isPublic" value={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.value === 'true' }))} className="input-field">
              <option value="true">Public — anyone can join</option>
              <option value="false">Private — invite only</option>
            </select>
          </div>
        </div>

        {/* Preferred Times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Study Times</label>
          <div className="flex flex-wrap gap-2">
            {PREFERRED_TIMES.map((t) => (
              <button
                key={t} type="button"
                onClick={() => toggleTime(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.preferredTimes.includes(t)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/groups/${groupId}`)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditGroupPage;
