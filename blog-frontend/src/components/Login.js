import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async(e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password,
            });
            // Save JWT token
            localStorage.setItem('token', res.data.token);
            setMessage('Login successful!');
            // Redirect to dashboard after successful login
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setMessage(err.response ? .data ? .error || 'Login failed');
        }
    };

    return ( <
        div className = "login-container" >
        <
        h2 className = "login-title" > Login < /h2> <
        form className = "login-form"
        onSubmit = { handleLogin } >
        <
        input type = "email"
        placeholder = "Email"
        value = { email }
        required onChange = {
            (e) => setEmail(e.target.value)
        }
        className = "login-input" /
        >
        <
        input type = "password"
        placeholder = "Password"
        value = { password }
        required onChange = {
            (e) => setPassword(e.target.value)
        }
        className = "login-input" /
        >
        <
        button type = "submit"
        className = "login-button" > Login < /button> < /
        form > <
        p className = "login-message" > { message } < /p> <
        p >
        Don 't have an account? <Link to="/signup">Sign up here</Link> < /
        p > <
        /div>
    );
}

export default Login;