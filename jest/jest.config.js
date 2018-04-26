module.exports = {
    setupFiles: ['./test/setup.js'],
    globals: {
        'ts-jest': {
            tsConfigFile: 'tsconfig.json'
        }
    },
    moduleFileExtensions: ['ts', 'js'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/test/__mocks__/fileMock.js',
        '.*\\.(css|less|scss)$': '<rootDir>/test/__mocks__/styleMock.js'
    },
    transform: {
        '^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
    },
    testMatch: ['**/__test__/**/*.test.(ts|js)']
};