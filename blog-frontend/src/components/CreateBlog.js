import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import apiClient from '../api'; // Import configured Axios instance
import './CreateBlog.css';

function CreateBlog() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // For loading state
    const navigate = useNavigate(); // For navigation

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // apiClient will automatically add the token from localStorage via interceptor
            const res = await apiClient.post('/blogs', { title, content }); // Endpoint is /api/blogs

            setMessage('Blog created successfully!');
            setTitle('');
            setContent('');
            setLoading(false);

            // Optional: Navigate to the new blog post or dashboard
            // For now, let's navigate to dashboard after a short delay
            setTimeout(() => {
                 // res.data will contain the created blog, potentially with its ID (res.data._id)
                navigate('/dashboard'); // Or navigate(`/blog/${res.data._id}`);
            }, 1500);

        } catch (err) {
            if (err.response && err.response.data) {
                if (err.response.data.errors) { // express-validator errors
                    setMessage(err.response.data.errors.map(e => e.msg).join(', '));
                } else if (err.response.data.message) { // Custom error messages
                    setMessage(err.response.data.message);
                } else {
                    setMessage('Failed to create blog. Please try again.');
                }
            } else {
                setMessage('Failed to create blog. Network error or server is down.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="createblog-container">
            <h2 className="createblog-title">Create a New Blog</h2>
            <form className="createblog-form" onSubmit={handleCreate}>
                <input
                    type="text"
                    placeholder="Blog Title"
                    value={title}
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    className="createblog-input"
                    disabled={loading}
                />
                <textarea
                    placeholder="Write your blog content here..."
                    value={content}
                    required
                    onChange={(e) => setContent(e.target.value)}
                    className="createblog-textarea"
                    rows={10} // Increased rows for better UX
                    disabled={loading}
                />
                <button type="submit" className="createblog-button" disabled={loading}>
                    {loading ? 'Publishing...' : 'Publish'}
                </button>
            </form>
            {message && <p className="createblog-message" style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}

            <p style={{marginTop: '20px'}}>
                <Link to="/dashboard" className="createblog-dashboard-link">
                    Back to Dashboard
                </Link>
            </p>
        </div>
    );
}

export default CreateBlog;