/// <reference types="vite/client" />

import type { IpcApi } from '@shared/types/ipc-contract'

declare global {
  interface Window {
    api: IpcApi
  }
}
