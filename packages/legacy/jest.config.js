module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 10000,
    // Reset modules between tests for clean env isolation
    resetModules: true,
    // Clear mocks between tests
    clearMocks: true,
    // Transform ESM modules that don't play nice with Jest
    transformIgnorePatterns: [
        '/node_modules/(?!(is-url-superb|datauri|file-type|strtok3|peek-readable|token-types)/)',
    ],
    // Mock ESM modules
    moduleNameMapper: {
        '^is-url-superb$': '<rootDir>/src/__mocks__/is-url-superb.ts',
    },
};
