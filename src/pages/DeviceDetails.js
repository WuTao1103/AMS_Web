import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Divider,
  Grid, 
  Slider, 
  Button, 
  Alert,
  IconButton,
  Box,
  Chip,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import BluetoothDisabledIcon from '@mui/icons-material/BluetoothDisabled';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getDeviceDetails, sendCommand } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import config from '../config';

function DeviceDetails() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brightness, setBrightness] = useState(50);
  const [message, setMessage] = useState(null);
  const [commandLoading, setCommandLoading] = useState({});

  const fetchDeviceDetails = async () => {
    try {
      setError(null);
      const data = await getDeviceDetails(deviceId);
      setDevice(data);
      
      if (data.screen && data.screen.brightness !== undefined) {
        setBrightness(Math.round(data.screen.brightness));
      }
      setLoading(false);
    } catch (err) {
      setError('Unable to load device details');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceDetails();
    
    // 每30秒刷新一次数据
    const intervalId = setInterval(fetchDeviceDetails, config.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [deviceId]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleBrightnessChange = (event, newValue) => {
    setBrightness(newValue);
  };

  const handleBrightnessChangeCommitted = async () => {
    try {
      setCommandLoading(prev => ({ ...prev, brightness: true }));
      showMessage('info', 'Setting brightness...');
      
      await sendCommand(deviceId, 'SET_BRIGHTNESS', { brightness });
      showMessage('success', `Brightness set to ${brightness}%`);
      
      // 延迟刷新设备状态
      setTimeout(fetchDeviceDetails, 2000);
    } catch (err) {
      showMessage('error', 'Failed to set brightness');
    } finally {
      setCommandLoading(prev => ({ ...prev, brightness: false }));
    }
  };

  const handleToggleWifi = async () => {
    try {
      setCommandLoading(prev => ({ ...prev, wifi: true }));
      const newStatus = device.wifi.status === 'ON' ? 'OFF' : 'ON';
      showMessage('info', `Turning ${newStatus === 'ON' ? 'on' : 'off'} WiFi...`);
      
      await sendCommand(deviceId, 'TOGGLE_WIFI', { status: newStatus });
      showMessage('success', `WiFi ${newStatus === 'ON' ? 'on' : 'off'} command sent`);
      
      setTimeout(fetchDeviceDetails, 3000);
    } catch (err) {
      showMessage('error', 'WiFi control failed');
    } finally {
      setCommandLoading(prev => ({ ...prev, wifi: false }));
    }
  };

  const handleToggleBluetooth = async () => {
    try {
      setCommandLoading(prev => ({ ...prev, bluetooth: true }));
      const newStatus = device.bluetooth.status === 'ON' ? 'OFF' : 'ON';
      showMessage('info', `Turning ${newStatus === 'ON' ? 'on' : 'off'} Bluetooth...`);
      
      await sendCommand(deviceId, 'TOGGLE_BLUETOOTH', { status: newStatus });
      showMessage('success', `Bluetooth ${newStatus === 'ON' ? 'on' : 'off'} command sent`);
      
      setTimeout(fetchDeviceDetails, 3000);
    } catch (err) {
      showMessage('error', 'Bluetooth control failed');
    } finally {
      setCommandLoading(prev => ({ ...prev, bluetooth: false }));
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading device details..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <ErrorMessage error={error} onRetry={fetchDeviceDetails} />
        <Button 
          component={Link} 
          to="/" 
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Device not found</Typography>
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, pb: 4 }}>
      <Grid container spacing={3}>
        {/* 头部导航 */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button 
              component={Link} 
              to="/" 
              startIcon={<ArrowBackIcon />}
              variant="outlined"
            >
              Return to Dashboard
            </Button>
            
            <IconButton 
              onClick={fetchDeviceDetails}
              color="primary"
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Grid>
        
        {/* 设备信息头部 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h4" gutterBottom>
              {deviceId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date(device.lastUpdated).toLocaleString('en-US')}
            </Typography>
          </Paper>
        </Grid>

        {/* 消息提示 */}
        {message && (
          <Grid item xs={12}>
            <Alert 
              severity={message.type} 
              onClose={() => setMessage(null)}
              sx={{ mb: 2 }}
            >
              {message.text}
            </Alert>
          </Grid>
        )}

        {/* WiFi状态卡片 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {device.wifi.status === 'ON' ? 
                  <WifiIcon color="primary" sx={{ mr: 1 }} /> : 
                  <WifiOffIcon color="disabled" sx={{ mr: 1 }} />
                }
                <Typography variant="h6">WiFi Status</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Status:</Typography>
                <Chip 
                  label={device.wifi.status === 'ON' ? 'ON' : 'OFF'}
                  color={device.wifi.status === 'ON' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Network:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {device.wifi.ssid || 'Not connected'}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                fullWidth
                onClick={handleToggleWifi}
                disabled={commandLoading.wifi}
                startIcon={device.wifi.status === 'ON' ? <WifiOffIcon /> : <WifiIcon />}
              >
                {commandLoading.wifi ? 'Processing...' : 
                 (device.wifi.status === 'ON' ? 'Turn off WiFi' : 'Turn on WiFi')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 蓝牙状态卡片 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {device.bluetooth.status === 'ON' ? 
                  <BluetoothIcon color="primary" sx={{ mr: 1 }} /> : 
                  <BluetoothDisabledIcon color="disabled" sx={{ mr: 1 }} />
                }
                <Typography variant="h6">Bluetooth Status</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Status:</Typography>
                <Chip 
                  label={device.bluetooth.status === 'ON' ? 'ON' : 
                         device.bluetooth.status === 'OFF' ? 'OFF' : 'Unknown'}
                  color={device.bluetooth.status === 'ON' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Paired devices:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {device.bluetooth.pairedDevices} devices
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                fullWidth
                onClick={handleToggleBluetooth}
                disabled={commandLoading.bluetooth || device.bluetooth.status === 'Unknown'}
                startIcon={device.bluetooth.status === 'ON' ? <BluetoothDisabledIcon /> : <BluetoothIcon />}
              >
                {commandLoading.bluetooth ? 'Processing...' : 
                 (device.bluetooth.status === 'ON' ? 'Turn off Bluetooth' : 'Turn on Bluetooth')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 屏幕亮度卡片 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BrightnessHighIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Screen Brightness</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box textAlign="center" mb={3}>
                <Typography variant="h3" color="primary">
                  {brightness}%
                </Typography>
              </Box>
              
              <Slider
                value={brightness}
                onChange={handleBrightnessChange}
                onChangeCommitted={handleBrightnessChangeCommitted}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                disabled={commandLoading.brightness}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                Drag the slider to adjust brightness
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 快速操作卡片 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="contained"
                    fullWidth
                    component={Link}
                    to={`/device/${deviceId}/history`}
                    startIcon={<HistoryIcon />}
                  >
                    View History Data
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="outlined"
                    fullWidth
                    onClick={() => setBrightness(0)}
                  >
                    Minimum Brightness
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="outlined"
                    fullWidth
                    onClick={() => setBrightness(50)}
                  >
                    Medium Brightness
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button 
                    variant="outlined"
                    fullWidth
                    onClick={() => setBrightness(100)}
                  >
                    Maximum Brightness
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DeviceDetails; 