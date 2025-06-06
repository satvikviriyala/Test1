import React from 'react';
import { render, screen, waitFor } from './utils/test-utils'; // Using custom render from test-utils
import userEvent from '@testing-library/user-event';
import App from './App'; // The main App component
import AuthContext from './context/AuthContext'; // To provide mock values for testing App
import apiClient from './api'; // Mocked apiClient

// Mock child components to simplify App.js testing and focus on routing logic
jest.mock('./components/Login', () => () => <div>Login Page</div>);
jest.mock('./components/Signup', () => () => <div>Signup Page</div>);
jest.mock('./components/Dashboard', () => () => <div>Dashboard Page</div>);
jest.mock('./components/CreateBlog', () => () => <div>Create Blog Page</div>);
// Navbar is part of App's structure, so we might not mock it unless it causes issues
// For now, let's assume Navbar renders fine or test its interactions separately if needed.

// We need to control AuthContext for App tests
// Let's define a helper to render App with a specific context value
const renderAppWithAuth = (authContextValue, initialRoute = ['/']) => {
    // Our test-utils render already includes MemoryRouter and AuthProvider.
    // To test App.js with specific auth states, we need to ensure this AuthContext.Provider
    // takes precedence or that the AuthProvider in test-utils can be configured.
    // For simplicity here, we'll wrap with another AuthContext.Provider.
    // The MemoryRouter from test-utils will still be effective.
    // We pass initialEntries to MemoryRouter via the options in customRender.
    return render(
        <AuthContext.Provider value={authContextValue}>
            <App />
        </AuthContext.Provider>,
        { initialRoutes: initialRoute } // Pass initialRoutes to customRender's MemoryRouter
    );
};


describe('App Routing', () => {

    beforeEach(() => {
        localStorage.clear(); // Clear localStorage to ensure consistent auth state
        // Reset any mocks if necessary, e.g., apiClient if App makes direct calls (it shouldn't for routing)
        apiClient.get.mockReset();
        apiClient.post.mockReset();
    });

    describe('Unauthenticated User', () => {
        const unauthenticatedContext = { isAuthenticated: false, user: null, login: jest.fn(), logout: jest.fn() };

        test('renders Login page for root path "/"', () => {
            renderAppWithAuth(unauthenticatedContext, ['/']);
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });

        test('renders Login page for "/login"', () => {
            renderAppWithAuth(unauthenticatedContext, ['/login']);
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });

        test('renders Signup page for "/signup"', () => {
            renderAppWithAuth(unauthenticatedContext, ['/signup']);
            expect(screen.getByText('Signup Page')).toBeInTheDocument();
        });

        test('redirects to Login page for protected route "/dashboard"', () => {
            renderAppWithAuth(unauthenticatedContext, ['/dashboard']);
            expect(screen.getByText('Login Page')).toBeInTheDocument(); // Due to ProtectedRoute redirect
        });

        test('redirects to Login page for protected route "/create"', () => {
            renderAppWithAuth(unauthenticatedContext, ['/create']);
            expect(screen.getByText('Login Page')).toBeInTheDocument(); // Due to ProtectedRoute redirect
        });

        test('redirects to Login page for unknown routes', () => {
            renderAppWithAuth(unauthenticatedContext, ['/some/unknown/route']);
            // App.js has a catch-all that redirects to "/" which then becomes /login for unauth users
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });
    });

    describe('Authenticated User', () => {
        const authenticatedContext = { isAuthenticated: true, user: { id: '123', username: 'test' }, login: jest.fn(), logout: jest.fn() };

        test('renders Dashboard page for root path "/"', () => {
            renderAppWithAuth(authenticatedContext, ['/']);
            expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
        });

        test('renders Dashboard page for "/dashboard"', () => {
            renderAppWithAuth(authenticatedContext, ['/dashboard']);
            expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
        });

        test('renders Create Blog page for "/create"', () => {
            renderAppWithAuth(authenticatedContext, ['/create']);
            expect(screen.getByText('Create Blog Page')).toBeInTheDocument();
        });

        test('redirects to Dashboard page for "/login" (PublicRoute)', () => {
            renderAppWithAuth(authenticatedContext, ['/login']);
            expect(screen.getByText('Dashboard Page')).toBeInTheDocument(); // Due to PublicRoute redirect
        });

        test('redirects to Dashboard page for "/signup" (PublicRoute)', () => {
            renderAppWithAuth(authenticatedContext, ['/signup']);
            expect(screen.getByText('Dashboard Page')).toBeInTheDocument(); // Due to PublicRoute redirect
        });

        test('redirects to Dashboard page for unknown routes', () => {
            renderAppWithAuth(authenticatedContext, ['/some/unknown/route']);
            // App.js has a catch-all that redirects to "/" which then becomes /dashboard for auth users
            expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
        });
    });
});

// Modify the customRender in test-utils.js to accept initialRoutes
// And ensure our AuthContext.Provider in renderAppWithAuth works as expected
// or adjust how AuthProvider in test-utils gets its initial state for these App tests.

// Re-check test-utils.js for MemoryRouter initialEntries:
// It should be:
// const AllTheProviders = ({ children, initialAuthValue, initialRoutes }) => {
// return (
// <MemoryRouter initialEntries={initialRoutes || ['/']}>
// <AuthProvider> {/* This AuthProvider will be used unless overridden */}
//  {children}
// </AuthProvider>
// </MemoryRouter>
// );
// };
// And customRender:
// const customRender = (ui, options) =>
//  render(ui, { wrapper: (props) => <AllTheProviders {...props} {...options?.wrapperProps} initialRoutes={options?.initialRoutes} />, ...options });

// The current renderAppWithAuth creates its own AuthContext.Provider, which is fine.
// The MemoryRouter from test-utils will pick up initialRoutes if passed like this:
// render(<App />, { wrapperProps: { authContextValue }, initialRoutes: ['/some-route'] })
// However, my renderAppWithAuth function is directly rendering App with a new context provider.
// This means the AuthProvider in test-utils is not used by renderAppWithAuth.
// The MemoryRouter from test-utils *is* used if renderAppWithAuth uses the custom render.
// The current `renderAppWithAuth` uses the custom `render` from `test-utils`,
// so it gets MemoryRouter. We pass initialRoutes to it.

// The customRender in test-utils.js:
// const customRender = (ui, options) =>
//    render(ui, { wrapper: (props) => <AllTheProviders {...props} {...options?.wrapperProps} />, ...options });
// Needs to be:
// const customRender = (ui, options) => {
//    const { initialRoutes, ...restOptions } = options || {};
//    return render(ui, { wrapper: (props) => <AllTheProviders {...props} {...options?.wrapperProps} initialRoutes={initialRoutes} />, ...restOptions });
// }
// And AllTheProviders:
// const AllTheProviders = ({ children, initialAuthValue, initialRoutes }) => (
//    <MemoryRouter initialEntries={initialRoutes || ['/']}>
//        <AuthProvider> {/* Potentially configure this AuthProvider or mock AuthContext directly */}
//            {children}
//        </AuthProvider>
//    </MemoryRouter>
// );
// My current test-utils.js is:
// const customRender = (ui, options) =>
//    render(ui, { wrapper: (props) => <AllTheProviders {...props} {...options?.wrapperProps} />, ...options });
// And AllTheProviders has no initialRoutes prop.
// It needs an update. For now, I'll proceed assuming the existing `renderAppWithAuth` structure
// where `initialRoute` is correctly passed to `MemoryRouter` via `options.initialRoutes`.
// The key is that MemoryRouter in test-utils needs to accept `initialEntries`.
// Let's assume test-utils is like:
// const AllTheProviders = ({ children, initialRoutes }) => (
//   <MemoryRouter initialEntries={initialRoutes || ['/']}>
//     <AuthProvider>{children}</AuthProvider>
//   </MemoryRouter>
// );
// const customRender = (ui, options) => render(ui, { wrapper: (props) => <AllTheProviders {...props} initialRoutes={options?.initialRoutes} />, ...options });
// This structure would make `renderAppWithAuth` work as written.
// I will make a note to update `test-utils.js` if these tests fail due to routing setup.The tests for `App.js` routing have been created. They cover:
- Rendering correct components for various routes (`/`, `/login`, `/signup`, `/dashboard`, `/create`) based on authentication status.
- Redirects for protected routes when unauthenticated.
- Redirects for public routes (login/signup) when authenticated.
- Fallback/redirect behavior for unknown routes.

Child components (`Login`, `Signup`, `Dashboard`, `CreateBlog`) are mocked to simplify these routing tests and focus on `App.js`'s logic. A helper function `renderAppWithAuth` is used to render the `App` component with specific `AuthContext` values and initial routes for `MemoryRouter`.

There's a detailed comment in the test file about ensuring `test-utils.js` correctly handles `initialRoutes` for `MemoryRouter`. I'll make this adjustment to `test-utils.js` to ensure these App tests can run correctly.

**Update `test-utils.js` to handle `initialRoutes`**
