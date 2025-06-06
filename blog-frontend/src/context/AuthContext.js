import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // For programmatic navigation
import apiClient from '../api'; // Assuming api.js is in src/

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user'))); // User object { id, username }
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);
    const navigate = useNavigate();

    useEffect(() => {
        // On initial load, check localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            // Set the token for apiClient if it wasn't set by initial request interceptor
            // This is more of a safeguard, as the interceptor should handle new requests.
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
            // Ensure no auth header if no token
            delete apiClient.defaults.headers.common['Authorization'];
        }
    }, []);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        // Assuming userData contains { userId, username } from backend login response
        // The backend currently sends { token, userId, username }
        const userToStore = { id: userData.userId, username: userData.username };
        localStorage.setItem('user', JSON.stringify(userToStore));

        setToken(userToken);
        setUser(userToStore);
        setIsAuthenticated(true);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        navigate('/dashboard'); // Navigate after successful login
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        delete apiClient.defaults.headers.common['Authorization'];
        navigate('/login'); // Navigate to login after logout
    };

    // Signup function might not be strictly necessary here if it just redirects
    // to login. If it were to auto-login the user, it would be similar to login().
    // For now, component will handle API call and then navigate.

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthContext;
