import { defineConfig } from 'vitest/config';
import path from 'path'; // Import the 'path' module from Node.js

export default defineConfig({
  test: {
    environment: 'node',

    include: ['src/**/*.test.ts'],

    globals: true,

  },

  // 2. PATH ALIASES
  resolve: {
    alias: [
      {
        // This is to replace every file with .js ending with .ts
        find: /^@\/(.*)\.js$/,
        replacement: path.resolve(__dirname, 'src/$1.ts'),
      },
      {
        // This is the fallback for any other '@/' imports
        // (e.g., to a folder, a .json, etc.)
        find: '@/',
        replacement: path.resolve(__dirname, 'src/'),
      },
    ]
  },
});
