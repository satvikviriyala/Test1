import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils'; // Custom render
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';
import AuthContext from '../context/AuthContext'; // To provide mock value

// Mock useNavigate and Link from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Helper function to render Navbar with specific AuthContext value
const renderNavbar = (authContextValue) => {
    return render(
        <AuthContext.Provider value={authContextValue}>
            <Navbar />
        </AuthContext.Provider>
        // Note: Our customRender from test-utils already includes MemoryRouter and AuthProvider.
        // For this specific test, we want to *override* the AuthContext value,
        // so we provide it directly. If Navbar didn't need MemoryRouter, we could use RTL's render.
        // But since Navbar uses <Link>, MemoryRouter is good.
        // The customRender's AuthProvider will be overridden by this more specific one.
    );
};


describe('Navbar Component', () => {
    beforeEach(() => {
        mockedNavigate.mockReset();
        localStorage.clear();
    });

    describe('When not authenticated', () => {
        const unauthenticatedContext = {
            isAuthenticated: false,
            user: null,
            logout: jest.fn(),
            login: jest.fn(),
        };

        test('renders Login and Signup links', () => {
            renderNavbar(unauthenticatedContext);
            expect(screen.getByText(/login/i)).toBeInTheDocument();
            expect(screen.getByText(/signup/i)).toBeInTheDocument();
            expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/create blog/i)).not.toBeInTheDocument();
        });
    });

    describe('When authenticated', () => {
        const mockLogout = jest.fn();
        const authenticatedContext = {
            isAuthenticated: true,
            user: { username: 'testuser', id: '123' },
            logout: mockLogout, // Use the mock function here
            login: jest.fn(),
        };

        beforeEach(() => {
            mockLogout.mockClear();
        });

        test('renders Dashboard, Create Blog, and Logout links', () => {
            renderNavbar(authenticatedContext);
            expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
            expect(screen.getByText(/create blog/i)).toBeInTheDocument();
            expect(screen.getByRole('button', {name: /logout \(testuser\)/i})).toBeInTheDocument();
            expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/signup/i)).not.toBeInTheDocument();
        });

        test('Logout button calls authContext.logout and navigates', async () => {
            const user = userEvent.setup();
            renderNavbar(authenticatedContext);

            const logoutButton = screen.getByRole('button', {name: /logout \(testuser\)/i});
            await user.click(logoutButton);

            expect(mockLogout).toHaveBeenCalledTimes(1);
            // Navigation to /login is handled by the logout function in AuthContext itself.
            // If AuthContext's logout calls navigate, we don't need to check mockedNavigate here
            // unless we are testing *this specific instance* of AuthContext's logout,
            // but here we are testing that Navbar *calls* the provided logout function.
        });
    });

    test('renders MyBlogApp logo linking to home', () => {
         const unauthenticatedContext = { isAuthenticated: false, user: null, logout: jest.fn(), login: jest.fn() };
        renderNavbar(unauthenticatedContext);
        const logoLink = screen.getByText(/myblogapp/i);
        expect(logoLink).toBeInTheDocument();
        expect(logoLink.closest('a')).toHaveAttribute('href', '/');
    });
});
