import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Paper, 
  ToggleButtonGroup, 
  ToggleButton, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Box,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import WifiIcon from '@mui/icons-material/Wifi';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import {
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getDeviceHistory } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function DeviceHistory() {
  const { deviceId } = useParams();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataType, setDataType] = useState('BRIGHTNESS');
  const [timeRange, setTimeRange] = useState('24h');

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 计算时间范围
      const to = new Date().toISOString();
      let from;
      
      switch (timeRange) {
        case '1h':
          from = new Date(Date.now() - 3600000).toISOString();
          break;
        case '6h':
          from = new Date(Date.now() - 21600000).toISOString();
          break;
        case '24h':
          from = new Date(Date.now() - 86400000).toISOString();
          break;
        case '7d':
          from = new Date(Date.now() - 604800000).toISOString();
          break;
        default:
          from = new Date(Date.now() - 86400000).toISOString();
      }
      
      const data = await getDeviceHistory(deviceId, dataType, from, to);
      setHistoryData(data);
      setLoading(false);
    } catch (err) {
      setError('Unable to load history data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [deviceId, dataType, timeRange]);

  const handleDataTypeChange = (event, newType) => {
    if (newType !== null) {
      setDataType(newType);
    }
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const formatChartData = (data) => {
    if (!data || !data.data) return [];
    
    return data.data.map(point => {
      const date = new Date(point.timestamp);
      const time = timeRange === '7d' ? 
        date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) :
        date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      
      if (dataType === 'BRIGHTNESS') {
        return {
          time,
          value: Math.round(point.value),
          timestamp: point.timestamp,
          fullTime: date.toLocaleString('zh-CN')
        };
      } else if (dataType === 'WIFI') {
        return {
          time,
          status: point.status === 'ON' ? 1 : 0,
          statusText: point.status,
          ssid: point.ssid,
          timestamp: point.timestamp,
          fullTime: date.toLocaleString('zh-CN')
        };
      } else if (dataType === 'BLUETOOTH') {
        return {
          time,
          status: point.status === 'ON' ? 1 : 0,
          statusText: point.status,
          pairedDevices: point.pairedDevices,
          timestamp: point.timestamp,
          fullTime: date.toLocaleString('zh-CN')
        };
      }
      
      return { time };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.fullTime}
          </Typography>
          
          {dataType === 'BRIGHTNESS' && (
            <Typography variant="body2">
              Brightness: {payload[0].value}%
            </Typography>
          )}
          
          {dataType === 'WIFI' && (
            <>
              <Typography variant="body2">
                WiFi Status: {data.statusText === 'ON' ? 'On' : 'Off'}
              </Typography>
              <Typography variant="body2">
                Network: {data.ssid || 'Not connected'}
              </Typography>
            </>
          )}
          
          {dataType === 'BLUETOOTH' && (
            <>
              <Typography variant="body2">
                Bluetooth Status: {data.statusText === 'ON' ? 'On' : 'Off'}
              </Typography>
              <Typography variant="body2">
                Paired devices: {data.pairedDevices} devices
              </Typography>
            </>
          )}
        </Paper>
      );
    }
    
    return null;
  };

  const renderChart = () => {
    const chartData = formatChartData(historyData);
    
    if (chartData.length === 0) {
      return (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No historical data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No data found for the selected time range
          </Typography>
        </Box>
      );
    }
    
    if (dataType === 'BRIGHTNESS') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="brightnessGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3f51b5" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'Brightness (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              name="Screen Brightness" 
              stroke="#3f51b5"
              fill="url(#brightnessGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (dataType === 'WIFI') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'WiFi Status', angle: -90, position: 'insideLeft' }}
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(value) => value === 1 ? 'On' : 'Off'}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="stepAfter" 
              dataKey="status" 
              name="WiFi Status"
              stroke="#4caf50"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (dataType === 'BLUETOOTH') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="status"
              label={{ value: 'Bluetooth Status', angle: -90, position: 'insideLeft' }}
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(value) => value === 1 ? 'On' : 'Off'}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="devices"
              orientation="right"
              label={{ value: 'Paired Devices', angle: 90, position: 'insideRight' }}
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="status"
              type="stepAfter" 
              dataKey="status" 
              name="Bluetooth Status" 
              stroke="#2196f3"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="devices"
              type="monotone" 
              dataKey="pairedDevices" 
              name="Paired Devices" 
              stroke="#ff9800"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LoadingSpinner message="Loading history data..." />
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
              to={`/device/${deviceId}`} 
              startIcon={<ArrowBackIcon />}
              variant="outlined"
            >
              Return to Device Details
            </Button>
            
            <IconButton 
              onClick={fetchHistoryData}
              color="primary"
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Device History Data: {deviceId}
          </Typography>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <ErrorMessage error={error} onRetry={fetchHistoryData} />
          </Grid>
        )}

        {/* 控制面板 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Data Type
                </Typography>
                <ToggleButtonGroup
                  value={dataType}
                  exclusive
                  onChange={handleDataTypeChange}
                  aria-label="data type"
                  size="small"
                >
                  <ToggleButton value="BRIGHTNESS" aria-label="brightness">
                    <BrightnessHighIcon sx={{ mr: 1 }} />
                    Screen Brightness
                  </ToggleButton>
                  <ToggleButton value="WIFI" aria-label="wifi">
                    <WifiIcon sx={{ mr: 1 }} />
                    WiFi Status
                  </ToggleButton>
                  <ToggleButton value="BLUETOOTH" aria-label="bluetooth">
                    <BluetoothIcon sx={{ mr: 1 }} />
                    Bluetooth Status
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="time-range-label">Time Range</InputLabel>
                  <Select
                    labelId="time-range-label"
                    id="time-range"
                    value={timeRange}
                    label="Time Range"
                    onChange={handleTimeRangeChange}
                  >
                    <MenuItem value="1h">Last 1 hour</MenuItem>
                    <MenuItem value="6h">Last 6 hours</MenuItem>
                    <MenuItem value="24h">Last 24 hours</MenuItem>
                    <MenuItem value="7d">Last 7 days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Number of data points: {historyData?.data?.length || 0}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 图表区域 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, minHeight: 450 }}>
            <Typography variant="h6" gutterBottom>
              {dataType === 'BRIGHTNESS' && 'Screen Brightness Trend'}
              {dataType === 'WIFI' && 'WiFi Status Changes'}
              {dataType === 'BLUETOOTH' && 'Bluetooth Status Changes'}
            </Typography>
            
            {renderChart()}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DeviceHistory;