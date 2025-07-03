import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

function ErrorMessage({ error, onRetry }) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert 
        severity="error" 
        action={
          onRetry && (
            <button onClick={onRetry} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              重试
            </button>
          )
        }
      >
        <AlertTitle>Error</AlertTitle>
        {error || 'An unknown error has occurred.'}
      </Alert>
    </Box>
  );
}

export default ErrorMessage; 