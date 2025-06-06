import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter as Router, MemoryRouter } from 'react-router-dom'; // Using MemoryRouter for tests
import { AuthProvider } from '../context/AuthContext'; // Adjust path as needed

// This custom render function will wrap components with necessary providers.
// You can extend it to include other global providers if your app has them (e.g., ThemeProvider).

const AllTheProviders = ({ children, initialAuthValue, initialRoutes }) => {
    // initialAuthValue: Can be used if we want to pass a specific value to a Context provider
    // that doesn't read from localStorage or has more complex setup.
    // For AuthProvider, it reads from localStorage (which can be mocked per test)
    // or uses its internal default state.

    // initialRoutes: Used to set the starting URL for MemoryRouter.
    return (
        <MemoryRouter initialEntries={initialRoutes || ['/']}>
            <AuthProvider>
                {/*
                  If initialAuthValue was intended for AuthProvider, and AuthProvider could take it as a prop:
                  <AuthProvider initialValue={initialAuthValue}>{children}</AuthProvider>
                  But our current AuthProvider initializes from localStorage.
                  For App.test.js, we are wrapping App with an additional AuthContext.Provider
                  to directly control the context value for App, which is a valid approach.
                */}
                {children}
            </AuthProvider>
        </MemoryRouter>
    );
};

const customRender = (ui, options) => {
    // Extract custom props for AllTheProviders from options if they exist
    const { initialRoutes, initialAuthValue, ...renderOptions } = options || {};
    return render(ui, {
        wrapper: (props) => (
            <AllTheProviders
                {...props}
                initialRoutes={initialRoutes}
                initialAuthValue={initialAuthValue}
            />
        ),
        ...renderOptions,
    });
};

// re-export everything from @testing-library/react
export * from '@testing-library/react';

// override render method
export { customRender as render };
