import React, { useState, useEffect } from 'react';
import { createSession } from '../../services/api';
import { TimeSlotGenerator } from 'study-sync-utils';

/**
 * CreateSessionForm — modal form for scheduling a new study session.
 * Uses TimeSlotGenerator from study-sync-utils to suggest time slots.
 */
const CreateSessionForm = ({ groupId, existingSessions = [], onSuccess, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: '',
    description: '',
  });
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When a date is selected, compute suggested free slots using TimeSlotGenerator
  useEffect(() => {
    if (!selectedDate) return;
    const generator = new TimeSlotGenerator(60, 8, 22);
    const available = generator.getAvailableSlots(selectedDate, existingSessions);
    setSuggestedSlots(available.slice(0, 8)); // show max 8 suggestions
  }, [selectedDate, existingSessions]);

  const applySlot = (slot) => {
    setForm((f) => ({ ...f, startTime: slot.startTime, endTime: slot.endTime }));
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  // When user manually picks a start time, auto-set endTime to +1hr
  const handleStartChange = (e) => {
    const start = e.target.value;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    setForm((f) => ({
      ...f,
      startTime: start,
      endTime: endDate.toISOString().slice(0, 16),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startTime || !form.endTime) {
      setErrorMsg('Please set a start and end time.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      const res = await createSession(groupId, payload);
      onSuccess(res.session);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to schedule session.');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Schedule a Session</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Title *</label>
              <input name="title" type="text" required value={form.title} onChange={handleChange}
                className="input-field" placeholder="e.g. Chapter 5 Review" />
            </div>

            {/* Date picker for slot suggestions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pick a Date for Suggestions</label>
              <input type="date" min={todayStr} value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)} className="input-field" />
            </div>

            {/* Suggested Slots from TimeSlotGenerator */}
            {suggestedSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Slots <span className="text-gray-400 font-normal text-xs">(click to apply)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedSlots.map((slot, i) => (
                    <button
                      key={i} type="button"
                      onClick={() => applySlot(slot)}
                      className={`text-xs py-2 px-3 rounded-lg border transition-colors text-left ${
                        form.startTime === slot.startTime
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input type="datetime-local" name="startTime" min={`${todayStr}T00:00`}
                  value={form.startTime} onChange={handleStartChange} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input type="datetime-local" name="endTime" min={form.startTime || `${todayStr}T00:00`}
                  value={form.endTime} onChange={handleChange} className="input-field text-sm" />
              </div>
            </div>

            {/* Location & Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input name="location" type="text" value={form.location} onChange={handleChange}
                className="input-field" placeholder="Room 204, Library B" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
              <input name="meetingLink" type="url" value={form.meetingLink} onChange={handleChange}
                className="input-field" placeholder="https://meet.google.com/..." />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea name="description" rows={2} value={form.description} onChange={handleChange}
                className="input-field" placeholder="What topics will you cover?" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Scheduling...' : 'Schedule Session'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSessionForm;
