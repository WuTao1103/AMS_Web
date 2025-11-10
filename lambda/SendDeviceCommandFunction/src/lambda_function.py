import json
import boto3
import uuid
from datetime import datetime

# 初始化AWS IoT客户端
iot_client = boto3.client('iot-data')

def lambda_handler(event, context):
    try:
        # 获取设备ID和命令数据
        device_id = event['pathParameters']['deviceId']
        
        # 解析请求体
        body = json.loads(event['body'])
        command_type = body.get('commandType')
        parameters = body.get('parameters', {})
        
        # 验证命令类型
        if command_type not in ['SET_BRIGHTNESS', 'TOGGLE_WIFI', 'TOGGLE_BLUETOOTH']:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Invalid command type'})
            }
        
        # 构建命令消息
        command_message = {
            'deviceId': device_id,
            'commandId': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'type': command_type
        }
        
        # 添加特定命令的参数
        if command_type == 'SET_BRIGHTNESS':
            command_message['screenBrightness'] = parameters.get('brightness', 50)
            topic = 'AMS/brightness/control'
        elif command_type == 'TOGGLE_WIFI':
            command_message['wifiStatus'] = parameters.get('status', 'ON')
            topic = 'AMS/wifi/control'
        elif command_type == 'TOGGLE_BLUETOOTH':
            command_message['bluetoothStatus'] = parameters.get('status', 'ON')
            topic = 'AMS/bluetooth/control'
        
        # 发布命令到IoT主题
        iot_client.publish(
            topic=topic,
            qos=1,
            payload=json.dumps(command_message)
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Command {command_type} sent to device {device_id}',
                'commandId': command_message['commandId']
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }