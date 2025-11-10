import json
import boto3
from boto3.dynamodb.conditions import Key
import decimal
from datetime import datetime, timedelta

# 帮助序列化Decimal类型
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AMS')

def lambda_handler(event, context):
    try:
        device_id = event['pathParameters']['deviceId']
        
        # 获取查询参数
        query_params = event.get('queryStringParameters', {}) or {}
        data_type = query_params.get('type', 'BRIGHTNESS')
        
        # 处理时间范围
        from_time = query_params.get('from')
        to_time = query_params.get('to')
        
        # 如果没有指定时间范围，默认查询过去24小时
        if not from_time:
            from_time = (datetime.now() - timedelta(hours=24)).isoformat()
        if not to_time:
            to_time = datetime.now().isoformat()
        
        # 将数据类型转换为正确的格式
        if data_type.upper() not in ['BRIGHTNESS', 'WIFI', 'BLUETOOTH']:
            data_type = 'BRIGHTNESS'
        else:
            data_type = data_type.upper()
        
        # 查询指定设备和数据类型的历史记录
        response = table.query(
            KeyConditionExpression=
                Key('PK').eq(f"DEVICE#{device_id}") & 
                Key('SK').between(f"{data_type}#{from_time}", f"{data_type}#{to_time}")
        )
        
        # 提取相关数据点
        history_points = []
        for item in response.get('Items', []):
            point = {
                'timestamp': item.get('timestamp')
            }
            
            # 根据数据类型添加相关值
            if data_type == 'BRIGHTNESS':
                point['value'] = item.get('screenBrightness', 0)
            elif data_type == 'WIFI':
                point['status'] = item.get('wifiStatus', 'OFF')
                point['ssid'] = item.get('connectedSSID', 'Not connected')
            elif data_type == 'BLUETOOTH':
                point['status'] = item.get('bluetoothStatus', 'OFF')
                point['pairedDevices'] = item.get('pairedDevicesCount', 0)
                
            history_points.append(point)
        
        # 按时间排序
        history_points.sort(key=lambda x: x['timestamp'])
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'deviceId': device_id,
                'dataType': data_type,
                'from': from_time,
                'to': to_time,
                'data': history_points
            }, cls=DecimalEncoder)
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