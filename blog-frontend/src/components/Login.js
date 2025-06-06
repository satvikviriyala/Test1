import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import apiClient from '../api'; // Import configured Axios instance
import './Login.css'; // Assuming you have this CSS file

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // For loading state
    const { login } = useAuth(); // Get login function from AuthContext
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await apiClient.post('/auth/login', { // Use apiClient
                email,
                password,
            });
            // Backend sends { token, userId, username }
            // AuthContext's login expects (userData, token)
            // userData should be { id: res.data.userId, username: res.data.username }
            login({ userId: res.data.userId, username: res.data.username }, res.data.token);
            // No need to setMessage or navigate here, AuthContext's login does it.
            // navigate('/dashboard') is handled by AuthContext or PublicRoute
        } catch (err) {
            // Error handling based on express-validator or custom messages
            if (err.response && err.response.data) {
                if (err.response.data.errors) { // express-validator errors
                    setMessage(err.response.data.errors.map(e => e.msg).join(', '));
                } else if (err.response.data.message) { // Custom error messages
                    setMessage(err.response.data.message);
                } else {
                    setMessage('Login failed. Please try again.');
                }
            } else {
                setMessage('Login failed. Network error or server is down.');
            }
            setLoading(false);
        }
        // setLoading(false) should be set in finally if login in AuthContext was not async regarding UI
        // But since login() from AuthContext navigates, this component might unmount.
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Login</h2>
            <form className="login-form" onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    disabled={loading}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    disabled={loading}
                />
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            {message && <p className="login-message" style={{color: message.startsWith('Login successful') ? 'green' : 'red'}}>{message}</p>}
            <p>
                Don't have an account? <Link to="/signup">Sign up here</Link>
            </p>
        </div>
    );
}

export default Login;