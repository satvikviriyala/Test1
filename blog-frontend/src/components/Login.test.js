import React from 'react';
import { screen, fireEvent, waitFor } from '../utils/test-utils'; // Using custom render
import userEvent from '@testing-library/user-event';
import Login from './Login';
import apiClient from '../api'; // This will be the mock from __mocks__/api.js
import { AuthProvider } from '../context/AuthContext'; // To reset context if needed or use a fresh provider

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
    useNavigate: () => mockedNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a> // Simple mock for Link
}));


describe('Login Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        apiClient.post.mockReset();
        mockedNavigate.mockReset();
        // Clear localStorage as AuthContext reads from it
        localStorage.clear();
    });

    test('renders login form', () => {
        render(<Login />);
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('allows user to type in email and password fields', async () => {
        const user = userEvent.setup();
        render(<Login />);
        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);

        await user.type(emailInput, 'test@example.com');
        expect(emailInput).toHaveValue('test@example.com');

        await user.type(passwordInput, 'password123');
        expect(passwordInput).toHaveValue('password123');
    });

    test('successful login calls authContext.login and navigates', async () => {
        const user = userEvent.setup();
        const mockLoginData = { token: 'fakeToken', userId: '123', username: 'testuser' };
        apiClient.post.mockResolvedValueOnce({ data: mockLoginData });

        // It's tricky to assert on context changes directly without exporting context values for testing.
        // Instead, we rely on AuthProvider's behavior (which calls navigate).
        // We also check if localStorage is set, as that's a side effect of our AuthContext's login.

        render(<Login />); // AuthProvider is included by customRender

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
        await user.type(screen.getByPlaceholderText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123',
            });
        });

        // AuthProvider's login sets localStorage and navigates.
        // The navigation to '/dashboard' is handled by the AuthContext's login method.
        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe(mockLoginData.token);
            expect(JSON.parse(localStorage.getItem('user'))).toEqual({
                id: mockLoginData.userId, // AuthContext stores it as 'id'
                username: mockLoginData.username
            });
            expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    test('displays error message on login failure (API error)', async () => {
        const user = userEvent.setup();
        apiClient.post.mockRejectedValueOnce({
            response: { data: { message: 'Invalid credentials' } },
        });

        render(<Login />);

        await user.type(screen.getByPlaceholderText(/email/i), 'wrong@example.com');
        await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
        expect(localStorage.getItem('token')).toBeNull();
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('displays error message for express-validator errors', async () => {
        const user = userEvent.setup();
        apiClient.post.mockRejectedValueOnce({
            response: { data: { errors: [{ msg: 'Email is required' }, { msg: 'Password is required' }] } },
        });

        render(<Login />);
        // Click login without typing to trigger validation errors from backend mock
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(/Email is required, Password is required/i)).toBeInTheDocument();
        });
    });

    test('login button is disabled while loading', async () => {
        const user = userEvent.setup();
        apiClient.post.mockImplementationOnce(() => {
            // Return a promise that never resolves to keep it in loading state
            return new Promise(() => {});
        });

        render(<Login />);
        const loginButton = screen.getByRole('button', { name: /login/i });

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
        await user.type(screen.getByPlaceholderText(/password/i), 'password123');
        await user.click(loginButton);

        expect(loginButton).toBeDisabled();
        expect(loginButton).toHaveTextContent(/logging in.../i);
    });
});
