# Android Monitoring System (AMS) - Web Dashboard

一个基于 React 的 Android 设备远程监控和控制系统 Web 仪表板。

## 功能特性

- 📱 实时监控多个 Android 设备状态
- 📊 设备历史数据可视化（亮度、WiFi、蓝牙）
- 🎛️ 远程控制设备（WiFi 开关、蓝牙开关、屏幕亮度调节）
- 🔄 自动刷新（30秒间隔）
- 📈 多时间范围历史数据查询（1小时、6小时、24小时、7天）
- 🐳 Docker 容器化部署支持

## 技术栈

- **前端框架**: React 18.2.0
- **UI 组件库**: Material-UI (MUI) 5.14.20
- **路由**: React Router DOM 6.20.1
- **图表库**: Recharts 2.8.0
- **HTTP 客户端**: Axios 1.6.2
- **构建工具**: React Scripts 5.0.1
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx (Alpine)

## 快速开始

### 前置要求

- Node.js 14+
- npm 或 yarn
- Docker 和 Docker Compose (用于容器化部署)

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3000)
npm start

# 运行测试
npm test

# 构建生产版本
npm run build
```

### Docker 部署

```bash
# 构建并启动容器
docker-compose up --build

# 后台运行
docker-compose up -d

# 停止容器
docker-compose down
```

部署后访问: `http://localhost:1004`

## 系统架构

### 完整系统架构图（文本版）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         👤 用户 (User)                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Browser Access
                                 │ http://localhost:1004
┌────────────────────────────────▼────────────────────────────────────────┐
│                    Frontend Layer (React 18.2.0)                        │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                     App.js (主应用)                          │       │
│  │  • ThemeProvider (Material-UI)                               │       │
│  │  • React Router (客户端路由)                                 │       │
│  │  • AppBar (导航栏)                                            │       │
│  └──────────────────────┬──────────────────────────────────────┘       │
│                         │                                                │
│  ┌──────────────────────┼──────────────────────────────────────┐       │
│  │                      │   Page Components                      │       │
│  │  ┌──────────────┐   │   ┌──────────────┐   ┌─────────────┐ │       │
│  │  │  Dashboard   │◄──┼──►│DeviceDetails │   │DeviceHistory│ │       │
│  │  │   (/)        │   │   │ (/device/:id)│   │(/device/:id/│ │       │
│  │  │              │   │   │              │   │   history)  │ │       │
│  │  │ • 设备列表    │   │   │ • WiFi控制   │   │ • 图表展示  │ │       │
│  │  │ • 状态监控    │   │   │ • 蓝牙控制   │   │ • 时间筛选  │ │       │
│  │  │ • 自动刷新    │   │   │ • 亮度调节   │   │ • 数据类型  │ │       │
│  │  └──────┬───────┘   │   └──────┬───────┘   └──────┬──────┘ │       │
│  └─────────┼───────────┴──────────┼──────────────────┼────────┘       │
│            │                       │                  │                  │
│  ┌─────────▼───────────────────────▼──────────────────▼────────┐       │
│  │              Shared Components                                │       │
│  │  • DeviceCard     • LoadingSpinner     • ErrorMessage        │       │
│  └───────────────────────────┬───────────────────────────────────┘       │
│                               │                                           │
│  ┌────────────────────────────▼──────────────────────────────────┐      │
│  │                 API Service Layer (api.js)                     │      │
│  │  • Axios Client (baseURL, timeout: 10s)                       │      │
│  │  • Request Interceptor (日志记录)                             │      │
│  │  • Response Interceptor (错误处理)                            │      │
│  │                                                                │      │
│  │  Methods:                                                      │      │
│  │    - getDevices()           GET  /devices                     │      │
│  │    - getDeviceDetails(id)   GET  /devices/:id                 │      │
│  │    - getDeviceHistory(...)  GET  /devices/:id/history         │      │
│  │    - sendCommand(...)       POST /devices/:id/command         │      │
│  └────────────────────────────┬──────────────────────────────────┘      │
│                                │                                          │
│  ┌────────────────────────────▼──────────────────────────────────┐      │
│  │                  config.js (配置)                              │      │
│  │  • apiBaseUrl: AWS API Gateway Endpoint                       │      │
│  │  • refreshInterval: 30000ms (30秒自动刷新)                    │      │
│  └────────────────────────────┬──────────────────────────────────┘      │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │ HTTPS/REST
                                  │ Content-Type: application/json
┌──────────────────────────────────▼─────────────────────────────────────┐
│                      AWS Cloud Services Layer                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │           🚪 API Gateway (REST API)                           │      │
│  │  Endpoint: sk056pygke.execute-api.us-east-1.amazonaws.com    │      │
│  │  Stage: /dev                                                  │      │
│  │                                                               │      │
│  │  Features:                                                    │      │
│  │    • CORS (跨域支持)                                          │      │
│  │    • Throttling (限流: 10,000 req/sec)                       │      │
│  │    • API Key / IAM 认证 (可选)                               │      │
│  │    • CloudWatch 日志记录                                      │      │
│  └─────────┬────────────────────────────────────────────────────┘      │
│            │                                                             │
│  ┌─────────┼─────────────────────────────────────────────────────┐     │
│  │         │         Lambda Functions (Node.js 18)               │     │
│  │         │                                                      │     │
│  │  ┌──────▼──────────┐  ┌───────────────┐  ┌────────────────┐ │     │
│  │  │ GetDevices      │  │GetDeviceDetails│  │GetDeviceHistory│ │     │
│  │  │ GET /devices    │  │GET /devices/:id│  │GET /devices/:id│ │     │
│  │  │ Memory: 256MB   │  │Memory: 256MB   │  │    /history    │ │     │
│  │  │ Timeout: 10s    │  │Timeout: 10s    │  │Memory: 512MB   │ │     │
│  │  └──────┬──────────┘  └───────┬────────┘  └────────┬───────┘ │     │
│  │         │                     │                     │          │     │
│  │  ┌──────▼──────────┐  ┌──────▼─────────┐                     │     │
│  │  │ SendCommand     │  │ProcessHeartbeat│                     │     │
│  │  │ POST /devices/  │  │POST /devices/  │                     │     │
│  │  │    :id/command  │  │   heartbeat    │                     │     │
│  │  │ Memory: 256MB   │  │Memory: 256MB   │                     │     │
│  │  │ Timeout: 10s    │  │Timeout: 10s    │                     │     │
│  │  └──────┬──────────┘  └───────┬────────┘                     │     │
│  │         │                     │                               │     │
│  │         └──────────┬──────────┴───────────┬──────────────────┘     │
│  │                    │                      │                         │
│  │         ┌──────────▼──────────┐          │                         │
│  │         │  📢 SNS/SQS         │          │                         │
│  │         │  消息队列服务        │          │                         │
│  │         │  • Topic: device-   │          │                         │
│  │         │    commands         │          │                         │
│  │         │  • FCM Push         │          │                         │
│  │         └──────────┬──────────┘          │                         │
│  └────────────────────┼─────────────────────┼─────────────────────────┘
│                       │                     │
│  ┌────────────────────┼─────────────────────▼─────────────────────┐   │
│  │                    │        🗄️ DynamoDB (NoSQL)                │   │
│  │                    │                                            │   │
│  │  ┌─────────────────▼─────────┐  ┌──────────────────────────┐  │   │
│  │  │     Devices 表             │  │   HistoryData 表         │  │   │
│  │  │  PK: deviceId              │  │   PK: deviceId           │  │   │
│  │  │                            │  │   SK: timestamp          │  │   │
│  │  │  Attributes:               │  │                          │  │   │
│  │  │  • lastSeen                │  │   Attributes:            │  │   │
│  │  │  • lastUpdated             │  │   • dataType             │  │   │
│  │  │  • wifi {status, ssid}     │  │   • value                │  │   │
│  │  │  • bluetooth {status,      │  │   • status               │  │   │
│  │  │    pairedDevices}          │  │   • ttl (30天自动清理)   │  │   │
│  │  │  • screen {brightness}     │  │                          │  │   │
│  │  └────────────────────────────┘  └──────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │              Commands 表                                  │  │   │
│  │  │  PK: commandId (UUID)                                     │  │   │
│  │  │  GSI: deviceId-timestamp-index                            │  │   │
│  │  │                                                            │  │   │
│  │  │  Attributes:                                              │  │   │
│  │  │  • deviceId                                               │  │   │
│  │  │  • commandType (SET_BRIGHTNESS, TOGGLE_WIFI, etc.)       │  │   │
│  │  │  • parameters                                             │  │   │
│  │  │  • status (PENDING, SENT, EXECUTED, FAILED)              │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              ☁️ CloudWatch (监控和日志)                       │      │
│  │  • Lambda 调用次数、错误率、持续时间                          │      │
│  │  • API Gateway 4xx/5xx 错误率                                │      │
│  │  • DynamoDB 读写容量监控                                      │      │
│  │  • 告警: 错误率 > 5%, 延迟 > 2s                              │      │
│  └──────────────────────────────────────────────────────────────┘      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ FCM Push / Pull
                                 │ Command Execution
┌────────────────────────────────▼────────────────────────────────────────┐
│                      📱 Device Layer (Android)                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              Android 监控应用                                  │      │
│  │                                                                │      │
│  │  功能:                                                         │      │
│  │    • 接收 FCM 推送的控制命令                                   │      │
│  │    • 执行设备控制 (WiFi, Bluetooth, Brightness)               │      │
│  │    • 每 30 秒上报设备状态到 API Gateway                       │      │
│  │    • 返回命令执行结果                                          │      │
│  │                                                                │      │
│  │  心跳上报:                                                     │      │
│  │    POST /devices/heartbeat                                    │      │
│  │    Body: { deviceId, wifi, bluetooth, screen, timestamp }    │      │
│  └──────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘

Data Flow:
  1. 用户操作 → React 组件更新 → API Service 发送请求
  2. Axios → API Gateway → Lambda 函数处理
  3. Lambda → DynamoDB 读写 → 返回数据
  4. Lambda → SNS → Android 设备推送命令
  5. Android 设备 → API Gateway → 上报状态更新
```

### 完整系统架构图（Mermaid 图表版）

```mermaid
graph TB
    subgraph "客户端层"
        User[👤 用户] --> Browser[🌐 Web 浏览器<br/>Chrome/Safari/Firefox]
        Browser --> ReactApp[React 应用<br/>localhost:3000 开发<br/>Port 1004 生产]
    end

    subgraph "前端应用层 - React SPA"
        ReactApp --> Router{React Router}

        Router --> Page1[📊 Dashboard<br/>设备列表页<br/>路由: /]
        Router --> Page2[🎛️ DeviceDetails<br/>设备控制页<br/>路由: /device/:id]
        Router --> Page3[📈 DeviceHistory<br/>历史数据页<br/>路由: /device/:id/history]

        Page1 --> APIService[API Service Layer<br/>Axios 客户端<br/>baseURL + 拦截器]
        Page2 --> APIService
        Page3 --> APIService

        APIService --> Config[⚙️ config.js<br/>API Base URL<br/>刷新间隔: 30s]
    end

    subgraph "AWS 云服务层"
        APIService -->|HTTPS 请求| APIG[🚪 API Gateway<br/>REST API<br/>sk056pygke.execute-api<br/>us-east-1.amazonaws.com/dev]

        APIG -->|GET /devices| Lambda1[λ Lambda Function<br/>获取设备列表<br/>Node.js 18]
        APIG -->|GET /devices/:id| Lambda2[λ Lambda Function<br/>获取设备详情<br/>Node.js 18]
        APIG -->|GET /devices/:id/history| Lambda3[λ Lambda Function<br/>获取历史数据<br/>Node.js 18]
        APIG -->|POST /devices/:id/command| Lambda4[λ Lambda Function<br/>发送控制命令<br/>Node.js 18]

        Lambda1 --> DDB[(🗄️ DynamoDB<br/>Devices 表<br/>NoSQL 数据库)]
        Lambda2 --> DDB
        Lambda3 --> DDB2[(🗄️ DynamoDB<br/>HistoryData 表<br/>时间序列数据)]
        Lambda4 --> DDB

        Lambda4 --> SNS[📢 SNS/SQS<br/>消息队列<br/>推送通知]
    end

    subgraph "设备层"
        SNS --> AndroidApp[📱 Android 监控 App<br/>接收控制命令<br/>上报设备状态]
        AndroidApp -->|POST /devices/heartbeat<br/>每 30 秒上报| APIG
    end

    subgraph "监控层"
        Lambda1 -.-> CloudWatch[☁️ CloudWatch<br/>日志 & 指标<br/>告警监控]
        Lambda2 -.-> CloudWatch
        Lambda3 -.-> CloudWatch
        Lambda4 -.-> CloudWatch
    end

    style Browser fill:#e1f5ff
    style ReactApp fill:#61dafb
    style APIG fill:#ff9900
    style Lambda1 fill:#ff9900
    style Lambda2 fill:#ff9900
    style Lambda3 fill:#ff9900
    style Lambda4 fill:#ff9900
    style DDB fill:#4053d6
    style DDB2 fill:#4053d6
    style AndroidApp fill:#3ddc84
    style SNS fill:#ff4f8b
    style CloudWatch fill:#e7157b
```

### AWS 服务层详细架构

```mermaid
graph TB
    subgraph "API Gateway 层"
        APIG[API Gateway REST API<br/>端点: /dev]

        subgraph "路由配置"
            R1[GET /devices<br/>获取设备列表]
            R2[GET /devices/:deviceId<br/>获取设备详情]
            R3[GET /devices/:deviceId/history<br/>获取历史数据]
            R4[POST /devices/:deviceId/command<br/>发送控制命令]
            R5[POST /devices/heartbeat<br/>设备心跳上报]
        end

        APIG --> R1
        APIG --> R2
        APIG --> R3
        APIG --> R4
        APIG --> R5

        APIG --> Auth[授权配置<br/>API Key/IAM<br/>可选 Cognito]
        APIG --> Throttle[限流配置<br/>速率限制]
        APIG --> CORS[CORS 配置<br/>跨域支持]
    end

    subgraph "Lambda 函数层"
        R1 --> L1[GetDevices<br/>Memory: 256MB<br/>Timeout: 10s]
        R2 --> L2[GetDeviceDetails<br/>Memory: 256MB<br/>Timeout: 10s]
        R3 --> L3[GetDeviceHistory<br/>Memory: 512MB<br/>Timeout: 30s]
        R4 --> L4[SendCommand<br/>Memory: 256MB<br/>Timeout: 10s]
        R5 --> L5[ProcessHeartbeat<br/>Memory: 256MB<br/>Timeout: 10s]
    end

    subgraph "数据存储层"
        T1[(Devices 表<br/>设备状态<br/>PK: deviceId)]
        T2[(HistoryData 表<br/>历史数据<br/>PK: deviceId<br/>SK: timestamp)]
        T3[(Commands 表<br/>控制命令<br/>PK: commandId)]
    end

    subgraph "消息服务层"
        SNS[SNS Topic<br/>设备通知]
        SQS[SQS 队列<br/>命令队列]
        FCM[Firebase Cloud<br/>Messaging]

        SNS --> SQS
        SNS --> FCM
    end

    L1 --> T1
    L2 --> T1
    L3 --> T2
    L4 --> T1
    L4 --> T3
    L4 --> SNS
    L5 --> T1

    style APIG fill:#ff9900
    style L1 fill:#ff9900
    style L2 fill:#ff9900
    style L3 fill:#ff9900
    style L4 fill:#ff9900
    style L5 fill:#ff9900
    style T1 fill:#4053d6
    style T2 fill:#4053d6
    style T3 fill:#4053d6
    style SNS fill:#ff4f8b
```

### 前端架构

```mermaid
graph LR
    subgraph "React 应用结构"
        App[App.js<br/>主应用 + 主题]
        Config[config.js<br/>配置]

        subgraph "服务层"
            API[api.js<br/>API 服务]
        end

        subgraph "页面"
            Dashboard[Dashboard<br/>设备列表]
            Details[DeviceDetails<br/>设备详情]
            History[DeviceHistory<br/>历史数据]
        end

        subgraph "组件"
            DeviceCard[DeviceCard]
            Loading[LoadingSpinner]
            Error[ErrorMessage]
        end

        App --> Dashboard
        App --> Details
        App --> History
        Dashboard --> DeviceCard
        Dashboard --> API
        Details --> API
        Details --> Loading
        Details --> Error
        History --> API
        API --> Config
    end
```

### 详细数据流程图

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 用户
    participant Browser as 🌐 浏览器
    participant React as ⚛️ React App
    participant Axios as 🔌 Axios Client
    participant APIG as 🚪 API Gateway
    participant Lambda as λ Lambda Function
    participant DDB as 🗄️ DynamoDB
    participant SNS as 📢 SNS
    participant Device as 📱 Android 设备

    Note over User,Device: 场景 1: 查看设备列表流程
    User->>Browser: 访问 http://localhost:1004
    Browser->>React: 加载 React 应用
    React->>React: 路由到 Dashboard 组件
    React->>Axios: getDevices()
    Axios->>APIG: GET /dev/devices<br/>Headers: Content-Type: application/json

    APIG->>APIG: 验证请求 & 限流检查
    APIG->>Lambda: 触发 GetDevices Lambda
    Lambda->>DDB: Scan Devices 表
    DDB-->>Lambda: 返回设备列表数据

    Lambda->>Lambda: 格式化响应<br/>body: JSON.stringify(data)
    Lambda-->>APIG: 200 OK<br/>{ statusCode, body }
    APIG-->>Axios: 返回 JSON 响应

    Axios->>Axios: JSON.parse(response.data.body)
    Axios-->>React: 返回设备数组
    React->>React: setState & 渲染 DeviceCard
    React-->>Browser: 显示设备卡片列表
    Browser-->>User: 展示设备状态

    Note over User,Device: 场景 2: 控制设备（设置亮度）
    User->>Browser: 拖动亮度滑块到 80%
    Browser->>React: handleBrightnessChange(80)
    React->>Axios: sendCommand(deviceId, 'SET_BRIGHTNESS', {brightness: 80})

    Axios->>APIG: POST /dev/devices/{id}/command<br/>Body: { commandType, parameters }
    APIG->>Lambda: 触发 SendCommand Lambda

    Lambda->>DDB: PutItem 到 Commands 表
    Lambda->>SNS: 发布消息到设备主题

    SNS->>Device: 推送 FCM 消息
    Device->>Device: 执行亮度调节命令
    Device-->>SNS: 返回执行结果

    Lambda-->>APIG: 200 OK { message: "Command sent" }
    APIG-->>Axios: 返回成功响应
    Axios-->>React: 显示成功消息

    React->>React: setTimeout 延迟 2 秒
    React->>Axios: fetchDeviceDetails() 刷新
    Axios->>APIG: GET /dev/devices/{id}
    APIG->>Lambda: 触发 GetDeviceDetails Lambda
    Lambda->>DDB: GetItem { deviceId }
    DDB-->>Lambda: 返回最新设备状态
    Lambda-->>APIG: 设备详情数据
    APIG-->>Axios: 返回数据
    Axios-->>React: 更新 state
    React-->>Browser: 显示更新后的亮度值
    Browser-->>User: 确认亮度已改变为 80%

    Note over User,Device: 场景 3: 查看历史数据
    User->>Browser: 点击"查看历史数据"
    Browser->>React: 导航到 /device/:id/history
    React->>Axios: getDeviceHistory(deviceId, 'BRIGHTNESS', from, to)

    Axios->>APIG: GET /dev/devices/{id}/history<br/>?type=BRIGHTNESS&from=ISO&to=ISO
    APIG->>Lambda: 触发 GetDeviceHistory Lambda

    Lambda->>DDB: Query HistoryData 表<br/>KeyCondition: deviceId & timestamp
    DDB-->>Lambda: 返回时间序列数据

    Lambda->>Lambda: 聚合和采样数据
    Lambda-->>APIG: 返回历史数据数组
    APIG-->>Axios: JSON 响应

    Axios-->>React: 历史数据数组
    React->>React: formatChartData()<br/>转换为 Recharts 格式
    React-->>Browser: 渲染 AreaChart/LineChart
    Browser-->>User: 显示历史趋势图表
```

### 部署架构

```mermaid
graph TB
    subgraph "Docker 容器"
        subgraph "构建阶段"
            Node[Node:14 镜像] --> Build[npm run build]
            Build --> Static[/build 静态文件/]
        end

        subgraph "运行阶段"
            Nginx[Nginx Alpine] --> Static
            Nginx --> Config[nginx.conf<br/>端口 1004]
        end
    end

    Compose[docker-compose.yml] --> Node
    Compose --> Nginx

    User[用户] --> Port[localhost:1004]
    Port --> Nginx

    Nginx --> SPA[SPA 路由回退<br/>try_files]

    style Nginx fill:#4caf50
    style Static fill:#2196f3
```

## 数据模型设计

### DynamoDB 表结构

#### 1. Devices 表（设备状态表）
```javascript
{
  // 主键
  "deviceId": "device_001",  // Partition Key

  // 设备信息
  "lastSeen": "2025-11-10T10:30:00Z",      // 最后在线时间
  "lastUpdated": "2025-11-10T10:30:00Z",   // 最后更新时间

  // WiFi 状态
  "wifi": {
    "status": "ON",           // ON | OFF
    "ssid": "MyWiFi",         // WiFi 名称
    "signalStrength": -45     // 信号强度
  },

  // 蓝牙状态
  "bluetooth": {
    "status": "ON",           // ON | OFF | Unknown
    "pairedDevices": 3        // 配对设备数量
  },

  // 屏幕信息
  "screen": {
    "brightness": 75,         // 亮度 0-100
    "screenOn": true          // 屏幕是否开启
  }
}
```

#### 2. HistoryData 表（历史数据表）
```javascript
{
  // 复合主键
  "deviceId": "device_001",                // Partition Key
  "timestamp": "2025-11-10T10:00:00Z",     // Sort Key

  // 数据类型
  "dataType": "BRIGHTNESS",   // BRIGHTNESS | WIFI | BLUETOOTH

  // 数据值（根据类型不同）
  "value": 75,               // 用于 BRIGHTNESS (0-100)
  "status": "ON",            // 用于 WIFI/BLUETOOTH (ON/OFF)
  "ssid": "MyWiFi",          // 用于 WIFI (网络名称)
  "pairedDevices": 3,        // 用于 BLUETOOTH (配对数量)

  // TTL（数据过期时间，自动删除旧数据）
  "ttl": 1699632000          // Unix timestamp（例如：保留 30 天）
}
```

#### 3. Commands 表（控制命令表）
```javascript
{
  // 主键
  "commandId": "cmd_12345",  // Partition Key (UUID)

  // 设备和时间
  "deviceId": "device_001",
  "timestamp": "2025-11-10T10:30:00Z",

  // 命令信息
  "commandType": "SET_BRIGHTNESS",  // 命令类型
  "parameters": {
    "brightness": 80
  },

  // 执行状态
  "status": "PENDING",       // PENDING | SENT | EXECUTED | FAILED
  "executedAt": null,        // 执行时间
  "errorMessage": null       // 错误信息
}
```

### API Gateway 路由映射

| HTTP 方法 | API 路径 | Lambda 函数 | DynamoDB 表 | 说明 |
|-----------|---------|-------------|-------------|------|
| GET | `/devices` | GetDevices | Devices | 扫描所有设备 |
| GET | `/devices/{deviceId}` | GetDeviceDetails | Devices | 获取单个设备 |
| GET | `/devices/{deviceId}/history` | GetDeviceHistory | HistoryData | 查询历史数据 |
| POST | `/devices/{deviceId}/command` | SendCommand | Commands, SNS | 发送控制命令 |
| POST | `/devices/heartbeat` | ProcessHeartbeat | Devices | 更新设备状态 |

## API 接口文档

### Base URL

```
https://sk056pygke.execute-api.us-east-1.amazonaws.com/dev
```

可在 `src/config.js` 中修改

### 接口列表

#### 1. 获取所有设备

```http
GET /devices
```

**响应示例**:
```json
{
  "statusCode": 200,
  "body": "{\"devices\":[{\"deviceId\":\"device_001\",\"lastSeen\":\"2025-11-10T10:30:00Z\"}]}"
}
```

**注意**: 响应的 `body` 是字符串格式，需要 JSON 解析

**前端处理** (`src/services/api.js:36-40`):
```javascript
const bodyData = JSON.parse(response.data.body);
return bodyData.devices;
```

---

#### 2. 获取设备详情

```http
GET /devices/{deviceId}
```

**路径参数**:
- `deviceId` (string, required): 设备 ID

**响应示例**:
```json
{
  "deviceId": "device_001",
  "lastUpdated": "2025-11-10T10:30:00Z",
  "wifi": {
    "status": "ON",
    "ssid": "MyWiFi"
  },
  "bluetooth": {
    "status": "ON",
    "pairedDevices": 3
  },
  "screen": {
    "brightness": 75
  }
}
```

---

#### 3. 获取设备历史数据

```http
GET /devices/{deviceId}/history?type={type}&from={from}&to={to}
```

**路径参数**:
- `deviceId` (string, required): 设备 ID

**查询参数**:
- `type` (string, required): 数据类型
  - `BRIGHTNESS` - 屏幕亮度
  - `WIFI` - WiFi 状态
  - `BLUETOOTH` - 蓝牙状态
- `from` (string, optional): 开始时间 (ISO 8601 格式)
- `to` (string, optional): 结束时间 (ISO 8601 格式)

**响应示例**:
```json
{
  "deviceId": "device_001",
  "type": "BRIGHTNESS",
  "data": [
    {
      "timestamp": "2025-11-10T10:00:00Z",
      "value": 75
    },
    {
      "timestamp": "2025-11-10T10:05:00Z",
      "value": 80
    }
  ]
}
```

---

#### 4. 发送控制命令

```http
POST /devices/{deviceId}/command
```

**路径参数**:
- `deviceId` (string, required): 设备 ID

**请求体**:
```json
{
  "commandType": "SET_BRIGHTNESS",
  "parameters": {
    "brightness": 80
  }
}
```

**命令类型**:

| commandType | 说明 | parameters |
|------------|------|------------|
| `SET_BRIGHTNESS` | 设置屏幕亮度 | `{ brightness: 0-100 }` |
| `TOGGLE_WIFI` | 切换 WiFi 状态 | `{ status: "ON" \| "OFF" }` |
| `TOGGLE_BLUETOOTH` | 切换蓝牙状态 | `{ status: "ON" \| "OFF" }` |

**响应示例**:
```json
{
  "statusCode": 200,
  "message": "Command sent successfully"
}
```

---

### 错误处理

所有 API 请求都通过 Axios 拦截器处理:

**请求拦截器** (`src/services/api.js:10-18`):
- 记录请求日志

**响应拦截器** (`src/services/api.js:20-30`):
- 记录响应日志
- 统一错误处理

**错误响应格式**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid device ID"
}
```

## 页面路由

| 路由 | 组件 | 说明 |
|------|------|------|
| `/` | Dashboard | 设备列表仪表板 |
| `/device/:deviceId` | DeviceDetails | 设备详情和控制页面 |
| `/device/:deviceId/history` | DeviceHistory | 历史数据可视化页面 |

## 配置说明

### API 配置 (`src/config.js`)

```javascript
const config = {
  apiBaseUrl: 'https://your-api-endpoint.com/dev',  // API 基础地址
  refreshInterval: 30000,  // 自动刷新间隔（毫秒）
};
```

### Nginx 配置 (`nginx.conf`)

```nginx
server {
    listen 1004;
    location / {
        root   /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # SPA 路由回退
    }
}
```

## 项目结构

```
AMS_Web/
├── public/
│   └── index.html              # HTML 模板
├── src/
│   ├── components/             # 可复用组件
│   │   ├── DeviceCard.js       # 设备卡片组件
│   │   ├── LoadingSpinner.js   # 加载动画
│   │   └── ErrorMessage.js     # 错误消息
│   ├── pages/                  # 页面组件
│   │   ├── Dashboard.js        # 设备列表页
│   │   ├── DeviceDetails.js    # 设备详情页
│   │   └── DeviceHistory.js    # 历史数据页
│   ├── services/               # 服务层
│   │   └── api.js              # API 服务
│   ├── App.js                  # 主应用组件
│   ├── config.js               # 配置文件
│   ├── index.js                # 入口文件
│   └── index.css               # 全局样式
├── docker-compose.yml          # Docker Compose 配置
├── Dockerfile                  # Docker 镜像构建文件
├── nginx.conf                  # Nginx 配置
├── package.json                # 项目依赖
└── README.md                   # 项目文档
```

## 开发指南

### 添加新的设备控制功能

1. 在 `src/services/api.js` 中添加新的 API 函数
2. 在 `src/pages/DeviceDetails.js` 中添加控制 UI
3. 实现命令发送和状态刷新逻辑

示例：
```javascript
// 在 api.js 中
export const sendCustomCommand = async (deviceId, parameters) => {
  const response = await api.post(`/devices/${deviceId}/command`, {
    commandType: 'CUSTOM_COMMAND',
    parameters,
  });
  return response.data;
};

// 在 DeviceDetails.js 中
const handleCustomCommand = async () => {
  await sendCustomCommand(deviceId, { /* params */ });
  setTimeout(fetchDeviceDetails, 2000);
};
```

### 添加新的历史数据类型

1. 在 `src/pages/DeviceHistory.js` 的 `dataType` 状态中添加新类型
2. 在 `formatChartData` 函数中添加数据格式化逻辑
3. 在 `renderChart` 函数中添加对应的图表渲染

## 常见问题

### Q: API 响应解析失败？
A: 检查 API 返回的 `body` 字段是否为字符串格式，需要先用 `JSON.parse()` 解析

### Q: 设备状态更新不及时？
A: 命令发送后，系统会延迟 2-3 秒刷新状态，确保设备有足够时间执行命令

### Q: Docker 容器无法访问？
A: 检查端口 1004 是否被占用，确保 Docker 服务正常运行

### Q: 历史数据为空？
A: 确认时间范围内设备有数据上报，检查 API 接口是否正常

## 性能优化建议

- 调整 `refreshInterval` 以平衡实时性和服务器负载
- 对于大量设备，考虑实现分页或虚拟滚动
- 使用 React.memo 优化组件渲染
- 考虑添加 Service Worker 实现离线功能

