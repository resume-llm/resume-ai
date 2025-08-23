import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export const getBoards = async () => {
  const { data } = await axios.get(`${API_BASE}/kanban/boards`);
  return data;
};

export const getColumns = async (boardId) => {
  const { data } = await axios.get(`${API_BASE}/kanban/boards/${boardId}/columns`);
  return data;
};

export const getApplications = async (boardId) => {
  const { data } = await axios.get(`${API_BASE}/kanban/boards/${boardId}/applications`);
  return data;
};

export const createApplication = async (boardId, payload) => {
  const { data } = await axios.post(`${API_BASE}/kanban/boards/${boardId}/applications`, payload);
  return data;
};
