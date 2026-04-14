import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGroups, fetchUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GroupCard from '../components/Groups/GroupCard';

/**
 * Dashboard — user's home screen showing their groups and a welcome summary.
 */
const Dashboard = () => {
  const { userAttributes } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [groupsRes, profileRes] = await Promise.all([
        fetchGroups(),
        fetchUserProfile(),
      ]);
      setProfile(profileRes.profile);
      // Filter to only groups the user is a member of
      const userId = profileRes.profile.userId;
      const joined = (groupsRes.groups || []).filter(
        (g) => g.members && g.members.includes(userId)
      );
      setMyGroups(joined);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const firstName = profile?.name?.split(' ')[0] || userAttributes?.email?.split('@')[0] || 'there';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {firstName}! 👋</h1>
        <p className="text-blue-100 text-sm">
          You are in {myGroups.length} group{myGroups.length !== 1 ? 's' : ''}.
          {myGroups.length === 0 && ' Browse groups or create one to get started.'}
        </p>
        <div className="flex gap-3 mt-4">
          <Link to="/groups" className="bg-white text-blue-700 font-medium text-sm py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
            Browse Groups
          </Link>
          <Link to="/groups/create" className="bg-blue-500 text-white font-medium text-sm py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors border border-blue-400">
            + Create Group
          </Link>
        </div>
      </div>

      {/* Profile completeness hint */}
      {profile && (!profile.subjects || profile.subjects.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800 text-sm">Complete your profile</p>
            <p className="text-amber-600 text-xs mt-0.5">Add your subjects to get better group recommendations.</p>
          </div>
          <Link to="/profile" className="btn-primary text-sm py-1.5 px-3">Edit Profile</Link>
        </div>
      )}

      {/* My Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Study Groups</h2>
          <Link to="/groups" className="text-sm text-blue-600 hover:underline">Browse all →</Link>
        </div>

        {myGroups.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600 font-medium">You haven't joined any groups yet.</p>
            <p className="text-gray-400 text-sm mt-1">Find a group that matches your subjects.</p>
            <Link to="/groups" className="btn-primary inline-block mt-4">Browse Groups</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myGroups.map((group) => (
              <GroupCard
                key={group.groupId}
                group={group}
                isMember={true}
                isCreator={group.creatorId === profile?.userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
