interface ToastConfig {
  type: string
  title: string
}

interface Window {
  toast: (message: string, config: ToastConfig) => void
}

declare global {
  namespace NodeJS {
    interface Global {
      EXROOT: string
      ROOT: string
    }
  }
}

export {}
