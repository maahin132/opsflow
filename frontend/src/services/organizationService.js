import api from "./api";

const organizationService = {
  getOrganizations: async () => {
    const response = await api.get("organizations/");
    const data = response.data;

    return Array.isArray(data) ? data : data.results ?? [];
  },

  addMember: async (organizationId, email, role) => {
    const response = await api.post(`organizations/${organizationId}/members/`, {
      email,
      role,
    });
    return response.data;
  },

  updateMemberRole: async (organizationId, userId, role) => {
    const response = await api.patch(
      `organizations/${organizationId}/members/${userId}/`,
      { role }
    );
    return response.data;
  },

  removeMember: async (organizationId, userId) => {
    const response = await api.delete(
      `organizations/${organizationId}/members/${userId}/`
    );
    return response.data;
  },
};

export default organizationService;
