import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box,
  Fab,
  Fade
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getDevices } from '../services/api';
import DeviceCard from '../components/DeviceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import config from '../config';

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const data = await getDevices();
      setDevices(data);
    } catch (err) {
      setError('Unable to load device list, please check your network connection');
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // 设置自动刷新
    const intervalId = setInterval(() => {
      fetchDevices(true);
    }, config.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = () => {
    fetchDevices(true);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading device list..." />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, pb: 10 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <div>
          <Typography variant="h4" gutterBottom>
            Android Device Monitoring Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Total {devices.length} devices
          </Typography>
        </div>
      </Box>

      {error && (
        <ErrorMessage error={error} onRetry={() => fetchDevices()} />
      )}
      
      {devices.length === 0 && !error ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No device data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please ensure Android devices are running the monitoring app
          </Typography>
        </Box>
      ) : (
        <Fade in={!loading}>
          <Grid container spacing={3}>
            {devices.map((device) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={device.deviceId}>
                <DeviceCard device={device} />
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}

      {/* 刷新按钮 */}
      <Fab 
        color="primary" 
        aria-label="refresh"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16 
        }}
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshIcon sx={{ 
          animation: refreshing ? 'spin 1s linear infinite' : 'none',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }} />
      </Fab>
    </Container>
  );
}

export default Dashboard; 