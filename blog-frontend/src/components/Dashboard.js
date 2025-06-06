import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
    const [blogs, setBlogs] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchBlogs = async() => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/blogs', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBlogs(res.data.blogs);
            } catch (err) {
                setMessage('Failed to load blogs.');
            }
        };

        fetchBlogs();
    }, []);

    return ( <
        div className = "dashboard-container" >
        <
        h2 className = "dashboard-title" > Your Blogs < /h2> {
            message && < p className = "dashboard-message" > { message } < /p>} <
                Link to = "/create-blog"
            className = "create-blog-link" > Create New Blog < /Link> {
                    blogs.length === 0 ? ( <
                        p className = "dashboard-no-blogs" > No blogs found.Create one! < /p>
                    ) : ( <
                        ul className = "dashboard-blog-list" > {
                            blogs.map((blog) => ( <
                                li key = { blog._id }
                                className = "dashboard-blog-item" >
                                <
                                h3 > { blog.title } < /h3> <
                                p > { blog.content } < /p> <
                                /li>
                            ))
                        } <
                        /ul>
                    )
                } <
                /div>
        );
    }

    export default Dashboard;