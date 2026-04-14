import React, { useEffect, useState } from 'react';
import { fetchUserProfile, updateUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = [
  'Mathematics', 'Statistics', 'Computer Science', 'Programming',
  'Physics', 'Chemistry', 'Biology', 'Engineering', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'Networking', 'Economics',
  'Business', 'Law', 'History', 'Literature', 'Languages', 'Other',
];

const AVAILABILITY = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Weekend'];

/**
 * ProfilePage — allows user to view and update their profile including
 * name, bio, subjects, and availability preferences.
 */
const ProfilePage = () => {
  const { userAttributes } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', bio: '', subjects: [], availability: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetchUserProfile();
      setProfile(res.profile);
      setForm({
        name: res.profile.name || '',
        bio: res.profile.bio || '',
        subjects: res.profile.subjects || [],
        availability: res.profile.availability || [],
      });
    } catch (err) {
      setErrorMsg('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (s) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s],
    }));
  };

  const toggleAvailability = (a) => {
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(a) ? f.availability.filter((x) => x !== a) : [...f.availability, a],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await updateUserProfile(form);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center text-gray-400 animate-pulse">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your details to get better group matches.</p>
      </div>

      {/* Email display (read-only from Cognito) */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            {(form.name || userAttributes?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{form.name || 'Your Name'}</p>
            <p className="text-sm text-gray-500">{userAttributes?.email || profile?.email}</p>
          </div>
        </div>
      </div>

      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

      <form onSubmit={handleSave} className="card space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input-field" placeholder="Jane Smith" />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="input-field" rows={3} placeholder="Tell other students a bit about you..." maxLength={300} />
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">My Subjects</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSubject(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.subjects.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((a) => (
              <button key={a} type="button" onClick={() => toggleAvailability(a)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.availability.includes(a)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
