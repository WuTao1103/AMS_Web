import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button,
  Chip,
  Box
} from '@mui/material';
import { Link } from 'react-router-dom';
import DevicesIcon from '@mui/icons-material/Devices';

function DeviceCard({ device }) {
  const getStatusColor = (lastSeen) => {
    const lastSeenTime = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenTime) / (1000 * 60);
    
    if (diffMinutes < 5) return 'success';
    if (diffMinutes < 30) return 'warning';
    return 'error';
  };

  const getStatusText = (lastSeen) => {
    const lastSeenTime = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSeenTime) / (1000 * 60));
    
    if (diffMinutes < 1) return '在线';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <DevicesIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            {device.deviceId}
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            最后活动:
          </Typography>
          <Chip 
            label={getStatusText(device.lastSeen)}
            color={getStatusColor(device.lastSeen)}
            size="small"
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {new Date(device.lastSeen).toLocaleString('zh-CN')}
        </Typography>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          component={Link} 
          to={`/device/${device.deviceId}`}
          variant="contained"
          fullWidth
        >
          查看详情
        </Button>
      </CardActions>
    </Card>
  );
}

export default DeviceCard; 