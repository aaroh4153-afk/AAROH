export const useTheme = () => {
  const isDark = useState<boolean>('isDark', () => false)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    if (import.meta.client) {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('aaroh-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('aaroh-theme', 'light')
      }
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('aaroh-theme')
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        isDark.value = true
        document.documentElement.classList.add('dark')
      } else {
        isDark.value = false
        document.documentElement.classList.remove('dark')
      }
    }
  }

  return {
    isDark,
    toggleTheme,
    initTheme,
  }
}

