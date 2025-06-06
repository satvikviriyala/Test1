import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSignup = async(e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/signup', {
                username, // 👈 send username
                email,
                password,
            });
            setMessage(res.data.message || 'Signup successful!');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setMessage(err.response ? .data ? .error || 'Signup failed');
        }
    };

    return ( <
        div className = "signup-container" >
        <
        h2 className = "signup-title" > Signup < /h2> <
        form className = "signup-form"
        onSubmit = { handleSignup } >
        <
        input type = "text"
        placeholder = "Username"
        value = { username }
        required onChange = {
            (e) => setUsername(e.target.value) }
        className = "signup-input" /
        >
        <
        input type = "email"
        placeholder = "Email"
        value = { email }
        required onChange = {
            (e) => setEmail(e.target.value) }
        className = "signup-input" /
        >
        <
        input type = "password"
        placeholder = "Password"
        value = { password }
        required onChange = {
            (e) => setPassword(e.target.value) }
        className = "signup-input" /
        >
        <
        button type = "submit"
        className = "signup-button" > Signup < /button> <
        /form> <
        p className = "signup-message" > { message } < /p> <
        /div>
    );
}

export default Signup;