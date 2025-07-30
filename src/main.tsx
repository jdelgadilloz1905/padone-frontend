import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { queryClient } from './utils/queryClient'
import { theme } from './theme/theme'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
