// Frontend API Client for Ma-On / Illuminati Financial Backend

const API_BASE = '/api';

const handleResponse = async (response) => {
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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mfaToken }),
      });
      return handleResponse(res);
    },

    signup: async ({ name, email, phone, password, sponsorCode }) => {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, sponsorCode }),
      });
      return handleResponse(res);
    },

    logout: async () => {
      const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
      return handleResponse(res);
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`);
      return handleResponse(res);
    },

    updateAvatar: async (avatarUrl) => {
      const res = await fetch(`${API_BASE}/auth/update-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });
      return handleResponse(res);
    },
  },

  // Deposits API
  deposits: {
    getPaymentNumbers: async () => {
      const res = await fetch(`${API_BASE}/deposits/payment-numbers`);
      return handleResponse(res);
    },

    submit: async (depositData) => {
      const res = await fetch(`${API_BASE}/deposits/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData),
      });
      return handleResponse(res);
    },

    getMyTransactions: async () => {
      const res = await fetch(`${API_BASE}/deposits/my-transactions`);
      return handleResponse(res);
    },
  },

  // Withdrawals API
  withdrawals: {
    request: async ({ amount, provider, recipientNumber }) => {
      const res = await fetch(`${API_BASE}/withdrawals/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), provider, recipientNumber }),
      });
      return handleResponse(res);
    },

    getMyWithdrawals: async () => {
      const res = await fetch(`${API_BASE}/withdrawals/my-withdrawals`);
      return handleResponse(res);
    },
  },

  // Network MLM API
  network: {
    getTree: async () => {
      const res = await fetch(`${API_BASE}/network/tree`);
      return handleResponse(res);
    },
  },

  // Admin API
  admin: {
    getPendingDeposits: async () => {
      const res = await fetch(`${API_BASE}/admin/pending-deposits`);
      return handleResponse(res);
    },

    getPendingWithdrawals: async () => {
      const res = await fetch(`${API_BASE}/admin/pending-withdrawals`);
      return handleResponse(res);
    },

    approveDeposit: async (id) => {
      const res = await fetch(`${API_BASE}/admin/approve-deposit/${id}`, { method: 'POST' });
      return handleResponse(res);
    },

    rejectDeposit: async (id, reason) => {
      const res = await fetch(`${API_BASE}/admin/reject-deposit/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return handleResponse(res);
    },

    approveWithdrawal: async (id) => {
      const res = await fetch(`${API_BASE}/admin/approve-withdrawal/${id}`, { method: 'POST' });
      return handleResponse(res);
    },

    rejectWithdrawal: async (id, reason) => {
      const res = await fetch(`${API_BASE}/admin/reject-withdrawal/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return handleResponse(res);
    },

    getAuditLogs: async () => {
      const res = await fetch(`${API_BASE}/admin/audit-logs`);
      return handleResponse(res);
    },

    addPaymentNumber: async (data) => {
      const res = await fetch(`${API_BASE}/admin/payment-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },

  // Chatbot API (Mistral AI)
  chat: {
    sendMessage: async (message, history = []) => {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      return handleResponse(res);
    },
  },

  // Notifications API
  notifications: {
    get: async () => {
      const res = await fetch(`${API_BASE}/notifications`);
      return handleResponse(res);
    },
    markAsRead: async (id) => {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
      return handleResponse(res);
    },
    markAllAsRead: async () => {
      const res = await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
      return handleResponse(res);
    },
  },
};
