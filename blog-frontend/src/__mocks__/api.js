// src/__mocks__/api.js

// This is a manual mock for the apiClient.
// Jest will automatically use this mock when `import apiClient from '../api'`
// is encountered in test files.

const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    // You can also mock the interceptors if needed, or parts of the config
    // For example, to mock that the Authorization header is set:
    defaults: {
        headers: {
            common: {
                Authorization: null, // or some mock token if needed for a specific test
            },
        },
    },
    interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
    },
};

export default mockApiClient;
