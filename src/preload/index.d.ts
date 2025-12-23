import { ElectronAPI } from '@electron-toolkit/preload'
import { CustomAPI } from './types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}

export type {IPCDataResponse, IPCMessageResponse}
export type {CustomAPI}