import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const core = resolve('src/core')
const shared = resolve('src/shared')
const renderer = resolve('src/renderer/src')
const resources = resolve('resources')

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@core': core,
        '@shared': shared,
        '@resources': resources
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@core': core,
        '@shared': shared
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': renderer,
        '@core': core,
        '@shared': shared
      }
    },
    plugins: [react()]
  }
})
