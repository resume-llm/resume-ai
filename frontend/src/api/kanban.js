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

export const updateApplication = async (applicationId, payload) => {
  const { data } = await axios.put(`${API_BASE}/kanban/applications/${applicationId}`, payload);
  return data;
};

export const moveApplication = async (applicationId, columnId) => {
  const { data } = await axios.post(`${API_BASE}/kanban/applications/${applicationId}/move`, { column_id: columnId });
  return data;
};

// AI endpoints
export const aiSummarizeBoard = async (boardId, focus) => {
  const { data } = await axios.post(`${API_BASE}/ai/summarize-board`, { board_id: boardId, focus });
  return data; // { summary }
};

export const aiTagApplication = async (applicationId, max_tags = 5) => {
  const { data } = await axios.post(`${API_BASE}/ai/tag-application`, { application_id: applicationId, max_tags });
  return data; // { tags }
};

export const aiNextSteps = async (applicationId) => {
  const { data } = await axios.post(`${API_BASE}/ai/next-steps`, { application_id: applicationId });
  return data; // { steps }
};

// Resume endpoints
export const aiGenerateResume = async ({ applicationId, jobDescription, profile }) => {
  const { data } = await axios.post(`${API_BASE}/ai/generate-resume`, {
    application_id: applicationId,
    job_description: jobDescription,
    profile,
  });
  return data; // { markdown }
};

export const createResume = async ({ applicationId, jobDescription, inputProfile, markdown, model, params }) => {
  const { data } = await axios.post(`${API_BASE}/resumes`, {
    application_id: applicationId,
    job_description: jobDescription,
    input_profile: inputProfile,
    markdown,
    model,
    params,
  });
  return data; // ResumeRead
};

export const listResumesForApplication = async (applicationId) => {
  const { data } = await axios.get(`${API_BASE}/resumes/applications/${applicationId}`);
  return data; // ResumeRead[]
};

export const exportLatestResume = async (applicationId, format = "pdf") => {
  const response = await axios.get(
    `${API_BASE}/resumes/applications/${applicationId}/export`,
    { params: { format }, responseType: "blob" }
  );
  return response;
};

export const exportResumeById = async (resumeId, format = "pdf") => {
  const response = await axios.get(
    `${API_BASE}/resumes/${resumeId}/export`,
    { params: { format }, responseType: "blob" }
  );
  return response;
};
