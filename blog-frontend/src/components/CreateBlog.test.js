import React from 'react';
import { screen, fireEvent, waitFor } from '../utils/test-utils'; // Using custom render
import userEvent from '@testing-library/user-event';
import CreateBlog from './CreateBlog';
import apiClient from '../api'; // Mocked

// Mock useNavigate and Link from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockedNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Need to import 'act' for tests involving timers
import { act } from 'react-dom/test-utils';

describe('CreateBlog Component', () => {
    beforeEach(() => {
        apiClient.post.mockReset();
        mockedNavigate.mockReset();
        jest.useFakeTimers(); // Use fake timers for setTimeout
    });

    afterEach(() => {
        jest.runOnlyPendingTimers(); // Clear any remaining timers
        jest.useRealTimers(); // Restore real timers
    });

    test('renders create blog form', () => {
        render(<CreateBlog />);
        expect(screen.getByPlaceholderText(/blog title/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/write your blog content here.../i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
        expect(screen.getByText(/back to dashboard/i).closest('a')).toHaveAttribute('href', '/dashboard');
    });

    test('allows user to type in title and content fields', async () => {
        const user = userEvent.setup();
        render(<CreateBlog />);
        const titleInput = screen.getByPlaceholderText(/blog title/i);
        const contentTextarea = screen.getByPlaceholderText(/write your blog content here.../i);

        await user.type(titleInput, 'My New Blog Title');
        expect(titleInput).toHaveValue('My New Blog Title');

        await user.type(contentTextarea, 'This is the exciting content of my new blog.');
        expect(contentTextarea).toHaveValue('This is the exciting content of my new blog.');
    });

    test('successful blog creation shows success message, clears form, and navigates', async () => {
        const user = userEvent.setup();
        const mockCreatedBlog = { _id: 'blog123', title: 'Test Blog', content: 'Test Content' };
        apiClient.post.mockResolvedValueOnce({ data: mockCreatedBlog });

        render(<CreateBlog />);

        const titleInput = screen.getByPlaceholderText(/blog title/i);
        const contentTextarea = screen.getByPlaceholderText(/write your blog content here.../i);
        const publishButton = screen.getByRole('button', { name: /publish/i });

        await user.type(titleInput, 'Test Blog Title');
        await user.type(contentTextarea, 'Some interesting content.');
        await user.click(publishButton);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/blogs', {
                title: 'Test Blog Title',
                content: 'Some interesting content.',
            });
        });

        await waitFor(() => {
            expect(screen.getByText(/blog created successfully!/i)).toBeInTheDocument();
        });

        // Form should be cleared
        expect(titleInput).toHaveValue('');
        expect(contentTextarea).toHaveValue('');

        // Fast-forward timers to trigger navigation
        act(() => {
            jest.runAllTimers();
        });

        await waitFor(() => {
            expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
            // Or if navigating to the blog post: expect(mockedNavigate).toHaveBeenCalledWith(`/blog/${mockCreatedBlog._id}`);
        });
    });

    test('displays error message on blog creation failure (API error)', async () => {
        const user = userEvent.setup();
        apiClient.post.mockRejectedValueOnce({
            response: { data: { message: 'Failed to create' } },
        });

        render(<CreateBlog />);
        await user.type(screen.getByPlaceholderText(/blog title/i), 'Fail Blog');
        await user.type(screen.getByPlaceholderText(/write your blog content here.../i), 'This will fail.');
        await user.click(screen.getByRole('button', { name: /publish/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
        });
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    test('displays error for express-validator errors', async () => {
        const user = userEvent.setup();
        apiClient.post.mockRejectedValueOnce({
            response: { data: { errors: [{msg: 'Title is required'}] } },
        });
        render(<CreateBlog />);
        await user.click(screen.getByRole('button', { name: /publish/i })); // Click without filling

        await waitFor(() => {
            expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
        });
    });


    test('publish button is disabled while loading', async () => {
        const user = userEvent.setup();
        apiClient.post.mockImplementationOnce(() => new Promise(() => {})); // Non-resolving promise

        render(<CreateBlog />);
        const publishButton = screen.getByRole('button', { name: /publish/i });

        await user.type(screen.getByPlaceholderText(/blog title/i), 'Test');
        await user.type(screen.getByPlaceholderText(/write your blog content here.../i), 'Content');
        await user.click(publishButton);

        expect(publishButton).toBeDisabled();
        expect(publishButton).toHaveTextContent(/publishing.../i);
    });
});
