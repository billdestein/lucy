import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, proxy /v1/* to the Express backend on port 8080. In production, Express
// serves the built bundle from dist/ so relative /v1 URLs hit the same origin.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/v1': 'http://localhost:8080',
        },
    },
})
