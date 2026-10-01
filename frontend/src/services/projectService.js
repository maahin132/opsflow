import api from "./api";

const projectService = {
  getProjects: async () => {
    const projects = [];
    let nextPage = "projects/";

    while (nextPage) {
      const response = await api.get(nextPage);
      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }

      projects.push(...(data.results ?? []));
      nextPage = data.next;
    }

    return projects;
  },

  getProject: async (projectId) => {
    const response = await api.get(`projects/${projectId}/`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await api.post("projects/", projectData);
    return response.data;
  },

  updateProject: async (projectId, projectData) => {
    const response = await api.patch(
      `projects/${projectId}/`,
      projectData
    );
    return response.data;
  },

  deleteProject: async (projectId) => {
    const response = await api.delete(`projects/${projectId}/`);
    return response.data;
  },

  addMember: async (projectId, userId, role) => {
    const response = await api.post(`projects/${projectId}/members/`, {
      user: userId,
      role,
    });
    return response.data;
  },

  removeMember: async (projectId, userId) => {
    const response = await api.delete(`projects/${projectId}/members/${userId}/`);
    return response.data;
  },
};

export default projectService;