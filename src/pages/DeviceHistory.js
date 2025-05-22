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
      setError('无法加载历史数据');
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
              亮度: {payload[0].value}%
            </Typography>
          )}
          
          {dataType === 'WIFI' && (
            <>
              <Typography variant="body2">
                WiFi状态: {data.statusText === 'ON' ? '开启' : '关闭'}
              </Typography>
              <Typography variant="body2">
                网络: {data.ssid || '未连接'}
              </Typography>
            </>
          )}
          
          {dataType === 'BLUETOOTH' && (
            <>
              <Typography variant="body2">
                蓝牙状态: {data.statusText === 'ON' ? '开启' : '关闭'}
              </Typography>
              <Typography variant="body2">
                已配对设备: {data.pairedDevices}台
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
            暂无历史数据
          </Typography>
          <Typography variant="body2" color="text.secondary">
            选择的时间范围内没有找到数据
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
              label={{ value: '亮度 (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              name="屏幕亮度" 
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
              label={{ value: 'WiFi状态', angle: -90, position: 'insideLeft' }}
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(value) => value === 1 ? '开启' : '关闭'}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="stepAfter" 
              dataKey="status" 
              name="WiFi状态"
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
              label={{ value: '蓝牙状态', angle: -90, position: 'insideLeft' }}
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(value) => value === 1 ? '开启' : '关闭'}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="devices"
              orientation="right"
              label={{ value: '已配对设备', angle: 90, position: 'insideRight' }}
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="status"
              type="stepAfter" 
              dataKey="status" 
              name="蓝牙状态" 
              stroke="#2196f3"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="devices"
              type="monotone" 
              dataKey="pairedDevices" 
              name="已配对设备" 
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
        <LoadingSpinner message="正在加载历史数据..." />
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
              返回设备详情
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
            设备历史数据: {deviceId}
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
                  数据类型
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
                    屏幕亮度
                  </ToggleButton>
                  <ToggleButton value="WIFI" aria-label="wifi">
                    <WifiIcon sx={{ mr: 1 }} />
                    WiFi状态
                  </ToggleButton>
                  <ToggleButton value="BLUETOOTH" aria-label="bluetooth">
                    <BluetoothIcon sx={{ mr: 1 }} />
                    蓝牙状态
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="time-range-label">时间范围</InputLabel>
                  <Select
                    labelId="time-range-label"
                    id="time-range"
                    value={timeRange}
                    label="时间范围"
                    onChange={handleTimeRangeChange}
                  >
                    <MenuItem value="1h">过去1小时</MenuItem>
                    <MenuItem value="6h">过去6小时</MenuItem>
                    <MenuItem value="24h">过去24小时</MenuItem>
                    <MenuItem value="7d">过去7天</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Typography variant="caption" color="text.secondary">
                  数据点数量: {historyData?.data?.length || 0}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 图表区域 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, minHeight: 450 }}>
            <Typography variant="h6" gutterBottom>
              {dataType === 'BRIGHTNESS' && '屏幕亮度趋势'}
              {dataType === 'WIFI' && 'WiFi状态变化'}
              {dataType === 'BLUETOOTH' && '蓝牙状态变化'}
            </Typography>
            
            {renderChart()}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DeviceHistory;