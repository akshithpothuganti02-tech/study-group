/**
 * API service — all HTTP calls to the API Gateway / Lambda backend.
 * Automatically attaches the Cognito JWT token as a Bearer header.
 */

import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// Replace with your actual API Gateway invoke URL after deployment
const BASE_URL = import.meta.env.VITE_API_URL || 'https://YOUR_API_ID.execute-api.eu-west-1.amazonaws.com/prod';

/**
 * Returns an axios instance with the Authorization header pre-populated
 * from the current Cognito session's ID token.
 */
const getAuthHeaders = async () => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  return { Authorization: `Bearer ${token}` };
};

// ─── Groups ──────────────────────────────────────────────────────────────────

export const fetchGroups = async (params = {}) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BASE_URL}/groups`, { headers, params });
  return response.data;
};

export const fetchRankedGroups = async () => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BASE_URL}/groups/ranked`, { headers });
  return response.data;
};

export const fetchGroupById = async (groupId) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BASE_URL}/groups/${groupId}`, { headers });
  return response.data;
};

export const createGroup = async (data) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${BASE_URL}/groups`, data, { headers });
  return response.data;
};

export const updateGroup = async (groupId, data) => {
  const headers = await getAuthHeaders();
  const response = await axios.put(`${BASE_URL}/groups/${groupId}`, data, { headers });
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const headers = await getAuthHeaders();
  const response = await axios.delete(`${BASE_URL}/groups/${groupId}`, { headers });
  return response.data;
};

export const joinGroup = async (groupId) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${BASE_URL}/groups/${groupId}/join`, {}, { headers });
  return response.data;
};

export const leaveGroup = async (groupId) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${BASE_URL}/groups/${groupId}/leave`, {}, { headers });
  return response.data;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const fetchSessions = async (groupId, upcoming = false) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BASE_URL}/groups/${groupId}/sessions`, {
    headers,
    params: upcoming ? { upcoming: 'true' } : {},
  });
  return response.data;
};

export const suggestTimeSlots = async (date) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${BASE_URL}/sessions/suggest-slots`, { date }, { headers });
  return response.data;
};

export const createSession = async (groupId, data) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${BASE_URL}/groups/${groupId}/sessions`, data, { headers });
  return response.data;
};

export const updateSession = async (sessionId, data) => {
  const headers = await getAuthHeaders();
  const response = await axios.put(`${BASE_URL}/sessions/${sessionId}`, data, { headers });
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const headers = await getAuthHeaders();
  const response = await axios.delete(`${BASE_URL}/sessions/${sessionId}`, { headers });
  return response.data;
};

// ─── User Profile ─────────────────────────────────────────────────────────────

export const fetchUserProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BASE_URL}/users/profile`, { headers });
  return response.data;
};

export const updateUserProfile = async (data) => {
  const headers = await getAuthHeaders();
  const response = await axios.put(`${BASE_URL}/users/profile`, data, { headers });
  return response.data;
};

// ─── File Uploads (S3 pre-signed URL) ─────────────────────────────────────────

export const getUploadUrl = async (groupId, fileName, contentType) => {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${BASE_URL}/groups/${groupId}/upload-url`,
    { fileName, contentType },
    { headers }
  );
  return response.data;
};

export const fetchGroupFiles = async (groupId) => {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BASE_URL}/groups/${groupId}/files`, { headers });
  return response.data;
};
