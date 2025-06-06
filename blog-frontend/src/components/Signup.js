import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import apiClient from '../api'; // Import configured Axios instance
import './Signup.css';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // For loading state
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Backend's signup route is /api/auth/signup
            const res = await apiClient.post('/auth/signup', {
                username,
                email,
                password,
            });
            // Backend currently returns: { token, username, message: 'User created successfully' }
            // We don't auto-login here, just inform and redirect.
            setMessage(res.data.message || 'Signup successful! Please login.');
            setLoading(false); // Allow navigation

            // Redirect to login page after a short delay to show message
            setTimeout(() => {
                navigate('/login');
            }, 2000); // Keep a short delay for user to see success message

        } catch (err) {
            if (err.response && err.response.data) {
                if (err.response.data.errors) { // express-validator errors
                    setMessage(err.response.data.errors.map(e => e.msg).join(', '));
                } else if (err.response.data.message) { // Custom error messages (e.g., "Email already registered")
                    setMessage(err.response.data.message);
                } else {
                    setMessage('Signup failed. Please try again.');
                }
            } else {
                setMessage('Signup failed. Network error or server is down.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2 className="signup-title">Signup</h2>
            <form className="signup-form" onSubmit={handleSignup}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    required
                    onChange={(e) => setUsername(e.target.value)}
                    className="signup-input"
                    disabled={loading}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="signup-input"
                    disabled={loading}
                />
                <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="signup-input"
                    disabled={loading}
                />
                <button type="submit" className="signup-button" disabled={loading}>
                    {loading ? 'Signing up...' : 'Signup'}
                </button>
            </form>
            {message && <p className="signup-message" style={{color: message.includes('successful') ? 'green' : 'red'}}>{message}</p>}
            <p>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}

export default Signup;