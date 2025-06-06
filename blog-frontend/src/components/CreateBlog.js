import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CreateBlog.css';

function CreateBlog() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');

    const handleCreate = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                'http://localhost:5000/api/blogs', { title, content }, { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Blog created successfully!');
            setTitle('');
            setContent('');
        } catch (err) {
            setMessage(err.response ? .data ? .error || 'Failed to create blog');
        }
    };

    return ( <
        div className = "createblog-container" >
        <
        h2 className = "createblog-title" > Create a New Blog < /h2> <
        form className = "createblog-form"
        onSubmit = { handleCreate } >
        <
        input type = "text"
        placeholder = "Blog Title"
        value = { title }
        required onChange = {
            (e) => setTitle(e.target.value) }
        className = "createblog-input" /
        >
        <
        textarea placeholder = "Write your blog content here..."
        value = { content }
        required onChange = {
            (e) => setContent(e.target.value) }
        className = "createblog-textarea"
        rows = { 6 }
        /> <
        button type = "submit"
        className = "createblog-button" >
        Publish <
        /button> <
        /form> <
        p className = "createblog-message" > { message } < /p>

        { /* Link back to dashboard */ } <
        Link to = "/dashboard"
        className = "createblog-dashboard-link" >
        Back to Dashboard <
        /Link> <
        /div>
    );
}

export default CreateBlog;