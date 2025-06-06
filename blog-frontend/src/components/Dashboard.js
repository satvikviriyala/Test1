import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api'; // Import configured Axios instance
import './Dashboard.css'; // Assuming you have this CSS file

function Dashboard() {
    const [blogs, setBlogs] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true); // For loading state

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            setMessage('');
            try {
                // apiClient will automatically add the token for protected routes if needed,
                // but GET /api/blogs is public. If it were protected, token would be added.
                const res = await apiClient.get('/blogs'); // Endpoint is /api/blogs
                // The backend GET /api/blogs returns an array of blogs directly.
                // Each blog should have an 'author' object with 'username'.
                setBlogs(res.data);
            } catch (err) {
                if (err.response && err.response.data && err.response.data.message) {
                    setMessage(err.response.data.message);
                } else {
                    setMessage('Failed to load blogs. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    // Basic function to truncate content for display on dashboard
    const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    if (loading) {
        return <div className="dashboard-container"><p>Loading blogs...</p></div>;
    }

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">All Blogs</h2>
            {/* Changed from "Your Blogs" as it shows all blogs for now */}
            {message && <p className="dashboard-message" style={{color: 'red'}}>{message}</p>}

            {/* Link to create blog is in Navbar, but can be kept here for prominence if desired */}
            {/* <Link to="/create" className="create-blog-link">Create New Blog</Link> */}

            {blogs.length === 0 && !loading ? (
                <p className="dashboard-no-blogs">No blogs found. Be the first to <Link to="/create">create one</Link>!</p>
            ) : (
                <ul className="dashboard-blog-list">
                    {blogs.map((blog) => (
                        <li key={blog._id} className="dashboard-blog-item">
                            <h3>{blog.title}</h3>
                            <p className="blog-author">By: {blog.author ? blog.author.username : 'Unknown Author'}</p>
                            <p className="blog-content-preview">{truncateContent(blog.content)}</p>
                            <div className="blog-actions">
                                <Link to={`/blog/${blog._id}`} className="action-link">View</Link>
                                {/* Placeholder for Edit/Delete - requires auth check & specific component/logic */}
                                {/* <Link to={`/blog/${blog._id}/edit`} className="action-link">Edit</Link> */}
                                {/* <button onClick={() => handleDelete(blog._id)} className="action-button delete">Delete</button> */}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Dashboard;