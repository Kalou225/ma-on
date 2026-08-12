// Frontend API Client for Ma-On / Illuminati Financial Backend

const API_BASE = '/api';

const customFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Essential for PWA mobile cookies & session persistence
  });

  const contentType = response.headers.get('content-type');
  let data = {};
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Erreur serveur (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth API
  auth: {
    login: async (email, password, mfaToken) => {
      const data = await customFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, mfaToken }),
      });
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      return data;
    },

    signup: async ({ name, email, phone, password, sponsorCode }) => {
      const data = await customFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, sponsorCode }),
      });
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      return data;
    },

    logout: async () => {
      try {
        await customFetch('/auth/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('accessToken');
      return { message: 'Déconnecté' };
    },

    getMe: async () => {
      return customFetch('/auth/me');
    },

    updateAvatar: async (avatarUrl) => {
      return customFetch('/auth/update-avatar', {
        method: 'POST',
        body: JSON.stringify({ avatarUrl }),
      });
    },
  },

  // Deposits API
  deposits: {
    getPaymentNumbers: async () => {
      return customFetch('/deposits/payment-numbers');
    },

    submit: async (depositData) => {
      return customFetch('/deposits/submit', {
        method: 'POST',
        body: JSON.stringify(depositData),
      });
    },

    getMyTransactions: async () => {
      return customFetch('/deposits/my-transactions');
    },
  },

  // Withdrawals API
  withdrawals: {
    request: async ({ amount, provider, recipientNumber }) => {
      return customFetch('/withdrawals/request', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), provider, recipientNumber }),
      });
    },

    getMyWithdrawals: async () => {
      return customFetch('/withdrawals/my-withdrawals');
    },
  },

  // Network MLM API
  network: {
    getTree: async () => {
      return customFetch('/network/tree');
    },
  },

  // Admin API
  admin: {
    getPendingDeposits: async () => {
      return customFetch('/admin/pending-deposits');
    },

    getPendingWithdrawals: async () => {
      return customFetch('/admin/pending-withdrawals');
    },

    approveDeposit: async (id) => {
      return customFetch(`/admin/approve-deposit/${id}`, { method: 'POST' });
    },

    rejectDeposit: async (id, reason) => {
      return customFetch(`/admin/reject-deposit/${id}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    approveWithdrawal: async (id) => {
      return customFetch(`/admin/approve-withdrawal/${id}`, { method: 'POST' });
    },

    rejectWithdrawal: async (id, reason) => {
      return customFetch(`/admin/reject-withdrawal/${id}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },

    getAuditLogs: async () => {
      return customFetch('/admin/audit-logs');
    },

    addPaymentNumber: async (data) => {
      return customFetch('/admin/payment-numbers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Chatbot API (Mistral AI)
  chat: {
    sendMessage: async (message, history = []) => {
      return customFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      });
    },
  },

  // Notifications API
  notifications: {
    get: async () => {
      return customFetch('/notifications');
    },
    markAsRead: async (id) => {
      return customFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    },
    markAllAsRead: async () => {
      return customFetch('/notifications/read-all', { method: 'POST' });
    },
  },
};
