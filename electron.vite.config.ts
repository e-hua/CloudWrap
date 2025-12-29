import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tofuConfig from './opentofu.config.json'

export default defineConfig({
  main: {
    define: {
      __TOFU_VERSION__: JSON.stringify(tofuConfig.version)
    },
    resolve: {
      alias: {
        '@': resolve('src/main/src'),
        '@shared': resolve('src/shared')
      }
    },
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
