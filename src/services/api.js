import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // Rails API URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('API - Request Token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('API - No token found in localStorage');
  }
  config.headers['Content-Type'] = 'application/json';
  config.headers['Accept'] = 'application/json';
  return config;
}, (error) => {
  console.error('API - Interceptor Error:', error);
  return Promise.reject(error);
});

export const signIn = (credentials) =>
  api.post('users/sign_in', { user: credentials });

export const signUp = (credentials) =>
  api.post('users/', { user: credentials });

export const signOut = () => api.delete('/users/sign_out');

export const fetchUsers = ({ q = '' } = {}) => api.get('/api/v1/users', { params: {q} });

// export const fetchTasks = () => api.get('/api/v1/tasks');
export const fetchTasks = ({ q = '', status = '', start_date = '', end_date = '' } = {}) => 
  api.get('/api/v1/tasks', { params: { q, status, start_date, end_date } });

export const createTask = (taskData) => api.post('/api/v1/tasks', { task: taskData });

export const fetchUserDetails = (userId) => api.get(`/api/v1/users/${userId}`);

export const updateTask = (taskId, taskData) => api.patch(`/api/v1/tasks/${taskId}`, taskData);

export default api;