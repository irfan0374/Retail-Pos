import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types/ipc-contract'
import type { IpcApi } from '@shared/types/ipc-contract'

const api: IpcApi = {
  auth: {
    login: (req) => ipcRenderer.invoke(IPC.AUTH_LOGIN, req),
    logout: () => ipcRenderer.invoke(IPC.AUTH_LOGOUT),
    current: () => ipcRenderer.invoke(IPC.AUTH_CURRENT)
  },
  products: {
    list: (filter) => ipcRenderer.invoke(IPC.PRODUCTS_LIST, filter),
    search: (query) => ipcRenderer.invoke(IPC.PRODUCTS_SEARCH, query),
    findByBarcode: (barcode) => ipcRenderer.invoke(IPC.PRODUCTS_FIND_BY_BARCODE, barcode),
    create: (input) => ipcRenderer.invoke(IPC.PRODUCTS_CREATE, input),
    update: (input) => ipcRenderer.invoke(IPC.PRODUCTS_UPDATE, input),
    deactivate: (id) => ipcRenderer.invoke(IPC.PRODUCTS_DEACTIVATE, id),
    getBarcodeImage: (barcode) => ipcRenderer.invoke(IPC.PRODUCTS_GET_BARCODE_IMAGE, barcode)
  },
  categories: {
    list: () => ipcRenderer.invoke(IPC.CATEGORIES_LIST),
    create: (input) => ipcRenderer.invoke(IPC.CATEGORIES_CREATE, input),
    update: (input) => ipcRenderer.invoke(IPC.CATEGORIES_UPDATE, input)
  },
  metalRates: {
    listLatest: () => ipcRenderer.invoke(IPC.METAL_RATES_LIST_LATEST),
    upsert: (input) => ipcRenderer.invoke(IPC.METAL_RATES_UPSERT, input)
  },
  customers: {
    search: (query) => ipcRenderer.invoke(IPC.CUSTOMERS_SEARCH, query),
    create: (input) => ipcRenderer.invoke(IPC.CUSTOMERS_CREATE, input)
  },
  sales: {
    finalize: (input) => ipcRenderer.invoke(IPC.SALES_FINALIZE, input)
  }
}

contextBridge.exposeInMainWorld('api', api)
