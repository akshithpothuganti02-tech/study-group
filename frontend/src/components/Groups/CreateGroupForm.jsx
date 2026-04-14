import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../../services/api';

const SUBJECTS = [
  'Mathematics', 'Statistics', 'Computer Science', 'Programming',
  'Physics', 'Chemistry', 'Biology', 'Engineering', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'Networking', 'Economics',
  'Business', 'Law', 'History', 'Literature', 'Languages', 'Other',
];

const PREFERRED_TIMES = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Weekend'];

/**
 * CreateGroupForm — form for creating a new study group.
 */
const CreateGroupForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    subjects: [],
    maxSize: 8,
    preferredTimes: [],
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await createGroup(form);
      navigate(`/groups/${res.group.groupId}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a Study Group</h1>
        <p className="text-gray-500 text-sm mt-1">Set up your group and start finding study partners.</p>
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
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <button type="button" onClick={() => navigate('/groups')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupForm;
