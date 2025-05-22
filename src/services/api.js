import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getDevices = async () => {
  try {
    const response = await api.get('/devices');
    
    // 根据您的API响应格式，需要先解析body字符串
    if (response.data.body && typeof response.data.body === 'string') {
      const bodyData = JSON.parse(response.data.body);
      return bodyData.devices;
    }
    
    // 如果直接返回devices数组
    return response.data.devices || [];
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

export const getDeviceDetails = async (deviceId) => {
  try {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching device details:', error);
    throw error;
  }
};

export const getDeviceHistory = async (deviceId, type = 'BRIGHTNESS', from, to) => {
  try {
    const params = { type };
    if (from) params.from = from;
    if (to) params.to = to;
    
    const response = await api.get(`/devices/${deviceId}/history`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching device history:', error);
    throw error;
  }
};

export const sendCommand = async (deviceId, commandType, parameters) => {
  try {
    const response = await api.post(`/devices/${deviceId}/command`, {
      commandType,
      parameters,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending command:', error);
    throw error;
  }
}; 