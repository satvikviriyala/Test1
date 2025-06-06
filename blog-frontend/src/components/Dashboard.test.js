import React from 'react';
import { screen, waitFor } from '../utils/test-utils'; // Using custom render
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import apiClient from '../api'; // Mocked

// Mock Link from react-router-dom for any Links in Dashboard
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('Dashboard Component', () => {
    beforeEach(() => {
        apiClient.get.mockReset();
    });

    test('renders loading state initially', () => {
        apiClient.get.mockImplementationOnce(() => new Promise(() => {})); // Pending promise
        render(<Dashboard />);
        expect(screen.getByText(/loading blogs.../i)).toBeInTheDocument();
    });

    test('fetches and renders blogs successfully', async () => {
        const mockBlogs = [
            { _id: '1', title: 'Blog Post 1', content: 'Content for blog 1', author: { username: 'author1' } },
            { _id: '2', title: 'Blog Post 2', content: 'Content for blog 2. '.repeat(10), author: { username: 'author2' } },
        ];
        apiClient.get.mockResolvedValueOnce({ data: mockBlogs });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Blog Post 1')).toBeInTheDocument();
            expect(screen.getByText(/Content for blog 1/i)).toBeInTheDocument();
            expect(screen.getByText(/By: author1/i)).toBeInTheDocument();
        });

        expect(screen.getByText('Blog Post 2')).toBeInTheDocument();
        // Check truncated content
        expect(screen.getByText(/Content for blog 2. Content for blog 2. .../i)).toBeInTheDocument();
        expect(screen.getByText(/By: author2/i)).toBeInTheDocument();

        // Check for View links
        const viewLinks = screen.getAllByText(/view/i);
        expect(viewLinks.length).toBe(2);
        expect(viewLinks[0].closest('a')).toHaveAttribute('href', '/blog/1');
        expect(viewLinks[1].closest('a')).toHaveAttribute('href', '/blog/2');

        expect(apiClient.get).toHaveBeenCalledWith('/blogs');
    });

    test('renders "No blogs found" message when API returns an empty array', async () => {
        apiClient.get.mockResolvedValueOnce({ data: [] });
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText(/no blogs found/i)).toBeInTheDocument();
            // Check for the "Create one" link within the message
            expect(screen.getByText(/create one/i).closest('a')).toHaveAttribute('href', '/create');
        });
    });

    test('renders error message when API call fails', async () => {
        apiClient.get.mockRejectedValueOnce({ response: { data: { message: 'Error fetching blogs' } } });
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText(/error fetching blogs/i)).toBeInTheDocument();
        });
    });

    test('renders a generic error message if API error structure is unexpected', async () => {
        apiClient.get.mockRejectedValueOnce(new Error("Network Error")); // Plain error
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to load blogs. Please try again later./i)).toBeInTheDocument();
        });
    });
});
