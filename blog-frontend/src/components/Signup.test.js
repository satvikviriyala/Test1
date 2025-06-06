import React from 'react';
import { screen, fireEvent, waitFor } from '../utils/test-utils'; // Using custom render
import userEvent from '@testing-library/user-event';
import Signup from './Signup';
import apiClient from '../api'; // Mocked

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>, // Simple mock for Link
}));

describe('Signup Component', () => {
    beforeEach(() => {
        apiClient.post.mockReset();
        mockedNavigate.mockReset();
        localStorage.clear(); // Though Signup doesn't use localStorage directly, good practice
    });

    test('renders signup form', () => {
        render(<Signup />);
        expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /signup/i })).toBeInTheDocument();
    });

    test('allows user to type in form fields', async () => {
        const user = userEvent.setup();
        render(<Signup />);
        await user.type(screen.getByPlaceholderText(/username/i), 'newuser');
        expect(screen.getByPlaceholderText(/username/i)).toHaveValue('newuser');

        await user.type(screen.getByPlaceholderText(/email/i), 'new@example.com');
        expect(screen.getByPlaceholderText(/email/i)).toHaveValue('new@example.com');

        await user.type(screen.getByPlaceholderText(/password/i), 'newpassword123');
        expect(screen.getByPlaceholderText(/password/i)).toHaveValue('newpassword123');
    });

    test('successful signup shows success message and navigates to login', async () => {
        const user = userEvent.setup();
        const mockSignupResponse = { data: { message: 'Signup successful! Please login.' } };
        apiClient.post.mockResolvedValueOnce(mockSignupResponse);

        jest.useFakeTimers(); // Use fake timers for setTimeout

        render(<Signup />);

        await user.type(screen.getByPlaceholderText(/username/i), 'newuser');
        await user.type(screen.getByPlaceholderText(/email/i), 'new@example.com');
        await user.type(screen.getByPlaceholderText(/password/i), 'newpassword123');
        await user.click(screen.getByRole('button', { name: /signup/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', {
                username: 'newuser',
                email: 'new@example.com',
                password: 'newpassword123',
            });
        });

        await waitFor(() => {
            expect(screen.getByText(mockSignupResponse.data.message)).toBeInTheDocument();
        });

        // Fast-forward timers
        act(() => {
            jest.runAllTimers();
        });

        await waitFor(() => {
            expect(mockedNavigate).toHaveBeenCalledWith('/login');
        });

        jest.useRealTimers(); // Restore real timers
    });

    test('displays error message on signup failure (e.g., email exists)', async () => {
        const user = userEvent.setup();
        apiClient.post.mockRejectedValueOnce({
            response: { data: { message: 'Email already registered' } },
        });

        render(<Signup />);

        await user.type(screen.getByPlaceholderText(/username/i), 'anotheruser');
        await user.type(screen.getByPlaceholderText(/email/i), 'existing@example.com');
        await user.type(screen.getByPlaceholderText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /signup/i }));

        await waitFor(() => {
            expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
        });
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('displays error messages for express-validator errors', async () => {
        const user = userEvent.setup();
         apiClient.post.mockRejectedValueOnce({
            response: { data: { errors: [{ msg: 'Username is required' }, {msg: 'Password must be at least 6 characters'}] } },
        });
        render(<Signup />);
        await user.click(screen.getByRole('button', {name: /signup/i})); // Click without filling form

        await waitFor(() => {
            expect(screen.getByText(/Username is required, Password must be at least 6 characters/i)).toBeInTheDocument();
        });
    });

    test('signup button is disabled while loading', async () => {
        const user = userEvent.setup();
        apiClient.post.mockImplementationOnce(() => new Promise(() => {})); // Non-resolving promise

        render(<Signup />);
        const signupButton = screen.getByRole('button', { name: /signup/i });

        await user.type(screen.getByPlaceholderText(/username/i), 'test');
        await user.type(screen.getByPlaceholderText(/email/i), 'test@e.com');
        await user.type(screen.getByPlaceholderText(/password/i), 'testpass');
        await user.click(signupButton);

        expect(signupButton).toBeDisabled();
        expect(signupButton).toHaveTextContent(/signing up.../i);
    });
});

// Need to import 'act' for tests involving timers or state updates not directly tied to user events
import { act } from 'react-dom/test-utils';
