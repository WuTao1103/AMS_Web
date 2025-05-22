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
        <AlertTitle>错误</AlertTitle>
        {error || '发生未知错误'}
      </Alert>
    </Box>
  );
}

export default ErrorMessage; 