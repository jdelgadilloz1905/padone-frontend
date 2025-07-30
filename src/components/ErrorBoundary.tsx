import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          p={3}
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Algo salió mal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </Typography>
            <Button 
              variant="contained" 
              onClick={this.handleReset}
              sx={{ mr: 1 }}
            >
              Intentar de nuevo
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 