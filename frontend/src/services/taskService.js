import api from "./api";

async function getAllPages(path) {
  const results = [];
  let nextPage = path;

  while (nextPage) {
    const response = await api.get(nextPage);
    const data = response.data;

    if (Array.isArray(data)) return data;

    results.push(...(data.results ?? []));
    nextPage = data.next;
  }

  return results;
}

const taskService = {
  getTasks: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return getAllPages(`tasks/${query ? `?${query}` : ""}`);
  },
  getWorkspaceActivity: async () => {
    const response = await api.get("activity/");
    const data = response.data;
    return Array.isArray(data) ? data : data.results ?? [];
  },
  getComments: (taskId) => getAllPages(`tasks/${taskId}/comments/`),
  getActivities: (taskId) => getAllPages(`tasks/${taskId}/activities/`),

  createTask: async (taskData) => {
    const response = await api.post("tasks/", taskData);
    return response.data;
  },

  updateTask: async (taskId, taskData) => {
    const response = await api.patch(`tasks/${taskId}/`, taskData);
    return response.data;
  },

  deleteTask: async (taskId) => {
    await api.delete(`tasks/${taskId}/`);
  },

  updateStatus: async (taskId, status) => {
    const response = await api.post(`tasks/${taskId}/status/`, { status });
    return response.data;
  },

  assignTask: async (taskId, userId) => {
    const response = await api.post(`tasks/${taskId}/assign/`, { user: userId });
    return response.data;
  },

  addComment: async (taskId, content) => {
    const response = await api.post(`tasks/${taskId}/comments/`, { content });
    return response.data;
  },

  updateComment: async (taskId, commentId, content) => {
    const response = await api.patch(
      `tasks/${taskId}/comments/${commentId}/`,
      { content }
    );
    return response.data;
  },

  deleteComment: async (taskId, commentId) => {
    await api.delete(`tasks/${taskId}/comments/${commentId}/`);
  },
};

export default taskService;