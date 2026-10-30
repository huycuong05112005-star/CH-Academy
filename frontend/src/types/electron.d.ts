export interface ElectronAPI {
  isDesktop: boolean
  platform: string
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
  setTheme: (theme: string) => void
  getAppVersion: () => Promise<string>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

