import api from "./api";

const authService = {
  // Get CSRF token before POST requests
  getCsrfToken: async () => {
    const response = await api.get("auth/csrf/");
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    await authService.getCsrfToken();

    const response = await api.post(
      "auth/register/",
      userData
    );

    return response.data;
  },

  // Login user
  login: async (credentials) => {
    await authService.getCsrfToken();

    const response = await api.post(
      "auth/login/",
      credentials
    );

    return response.data;
  },

  // Get logged-in user
  getCurrentUser: async () => {
    const response = await api.get("auth/me/");
    return response.data;
  },

  // Logout user
  logout: async () => {
    await authService.getCsrfToken();

    const response = await api.post("auth/logout/");

    return response.data;
  },
};

export default authService;