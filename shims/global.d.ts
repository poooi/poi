interface ToastConfig {
  type: string
  title: string
}

interface Window {
  toast: (message: string, config: ToastConfig) => void
}
