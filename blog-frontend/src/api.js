import axios from 'axios';

// The base URL for the backend API
// For development, this is typically http://localhost:PORT/api
// For production, this would be your deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor:
// Automatically add JWT token to Authorization header for all requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor:
// Handle 401 Unauthorized errors globally
// This is a basic example. You might want to integrate this more closely
// with your AuthContext or routing.
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user'); // Assuming user info is also stored

            // Redirect to login page
            // This is a simple way. If using React Router, you might use
            // a navigate function from useNavigate or history object.
            // For this global interceptor, window.location might be the most straightforward
            // unless you pass a navigation function into this setup.
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
                // You could also dispatch a logout action if using a global state manager like Redux/Context
                // e.g., store.dispatch({ type: 'LOGOUT' });
                alert('Session expired. Please log in again.');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
