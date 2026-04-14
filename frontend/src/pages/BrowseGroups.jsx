import React, { useEffect, useState } from 'react';
import { fetchGroups, joinGroup, leaveGroup, fetchUserProfile, fetchRankedGroups } from '../services/api';
import GroupCard from '../components/Groups/GroupCard';

const SUBJECTS = [
  'All', 'Mathematics', 'Statistics', 'Computer Science', 'Programming',
  'Physics', 'Chemistry', 'Biology', 'Engineering', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'Networking', 'Economics', 'Business',
];

/**
 * BrowseGroups — searchable, filterable list of all public study groups.
 * Ranks results by highest subject overlap compatibility.
 */
const BrowseGroups = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [rankedGroups, setRankedGroups] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [groups, search, selectedSubject, profile]);

  const loadData = async () => {
    try {
      const [groupsRes, profileRes, rankedRes] = await Promise.all([
        fetchGroups(),
        fetchUserProfile(),
        fetchRankedGroups()
      ]);
      setGroups(groupsRes.groups || []);
      setProfile(profileRes.profile);
      setRankedGroups(rankedRes.ranked_groups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...groups];

    // Subject filter
    if (selectedSubject !== 'All') {
      result = result.filter(g => (g.subjects || []).includes(selectedSubject));
    }

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(term) ||
          (g.description || '').toLowerCase().includes(term) ||
          (g.subjects || []).some((s) => s.toLowerCase().includes(term))
      );
    }

    // If user has subjects, rank remaining results by compatibility using Backend API
    if (profile?.subjects?.length > 0 && selectedSubject === 'All' && !search && rankedGroups.length > 0) {
      const rankedItems = rankedGroups.map(r => r.group);
      const unranked = result.filter(g => !rankedItems.find(r => r.groupId === g.groupId));
      result = [...rankedItems, ...unranked];
    }

    setFilteredGroups(result);
  };

  const handleJoin = async (groupId) => {
    setJoiningId(groupId);
    try {
      await joinGroup(groupId);
      setSuccessMsg('Successfully joined the group!');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join group.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (groupId) => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await leaveGroup(groupId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave group.');
    }
  };

  if (loading) {
    return <div className="flex justify-center h-64 items-center text-gray-400 animate-pulse">Loading groups...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Browse Study Groups</h1>
        <span className="text-sm text-gray-500">{filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''} found</span>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{successMsg}</div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups by name or subject..."
          className="input-field flex-1"
        />
      </div>

      {/* Subject chips */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSubject(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedSubject === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600 font-medium">No groups match your search.</p>
          <p className="text-gray-400 text-sm mt-1">Try a different subject or create your own group.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.groupId}
              group={group}
              isMember={group.members?.includes(profile?.userId)}
              isCreator={group.creatorId === profile?.userId}
              onJoin={handleJoin}
              onLeave={handleLeave}
              joining={joiningId === group.groupId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseGroups;
