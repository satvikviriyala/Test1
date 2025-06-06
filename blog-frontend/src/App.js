import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateBlog from './components/CreateBlog';

function App() {
    const isLoggedIn = !!localStorage.getItem('token');

    return ( <
        <
        Router >
        <
        Routes >
        <
        Route path = "/signup"
        element = { < Signup / > }
        /> <
        Route path = "/login"
        element = { < Login / > }
        /> <
        Route path = "/dashboard"
        element = { isLoggedIn ? < Dashboard / > : < Navigate to = "/login"
            replace / > }
        /> <
        Route path = "/create-blog"
        element = { isLoggedIn ? < CreateBlog / > : < Navigate to = "/login"
            replace / > }
        /> <
        Route path = "/"
        element = { < Navigate to = { isLoggedIn ? "/dashboard" : "/login" }
            replace / > }
        /> <
        /Routes> <
        /Router>

    );
}

export default App;