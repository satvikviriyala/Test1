import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateBlog from './components/CreateBlog';
import Navbar from './components/Navbar'; // Import Navbar
import { useAuth } from './context/AuthContext';

// ProtectedRoute component
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        // If not authenticated, redirect to the login page
        return <Navigate to="/login" replace />;
    }
    // If authenticated, render the child routes
    return <Outlet />;
};

// PublicRoute component (optional, for routes like login/signup when already auth)
const PublicRoute = () => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        // If authenticated, redirect to dashboard (or home)
        return <Navigate to="/dashboard" replace />;
    }
    // If not authenticated, render the child routes
    return <Outlet />;
}

function App() {
    const { isAuthenticated } = useAuth(); // Get auth status

    return (
        <>
            <Navbar /> {/* Navbar will be displayed on all pages */}
            <div className="container" style={{padding: '20px'}}> {/* Basic container for content */}
                <Routes>
                    {/* Public routes (users should not access if already logged in) */}
                    <Route element={<PublicRoute />}>
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/login" element={<Login />} />
                    </Route>

                    {/* Protected routes (users must be logged in) */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/create" element={<CreateBlog />} />
                        {/* Add other protected routes here, e.g., /blog/:id/edit */}
                    </Route>

                    {/* Fallback route / Redirect for root path */}
                    <Route
                        path="/"
                        element={
                            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                        }
                    />

                    {/* Catch-all for undefined routes (optional) */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </>
    );
}

export default App;