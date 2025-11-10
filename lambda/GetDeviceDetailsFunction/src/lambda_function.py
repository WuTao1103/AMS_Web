import json
import boto3
from boto3.dynamodb.conditions import Key
import decimal
from datetime import datetime

# 帮助序列化Decimal类型
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AMS')  # 确保表名正确

def lambda_handler(event, context):
    try:
        device_id = event['pathParameters']['deviceId']
        print(f"获取设备详情: {device_id}")

        # 查询设备的所有数据，按时间降序排列
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f"DEVICE#{device_id}"),
            ScanIndexForward=False,  # 降序，最新的优先
            Limit=100  # 增加限制数量，确保能获取到各种类型的最新数据
        )

        if not response.get('Items'):
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Device not found'})
            }

        print(f"查询到 {len(response['Items'])} 条记录")

        # 分别获取每种数据类型的最新记录
        latest_wifi = None
        latest_bluetooth = None
        latest_brightness = None
        latest_timestamp = ""

        for item in response.get('Items', []):
            sk = item.get('SK', '')
            timestamp = item.get('timestamp', '')
            
            print(f"处理记录: SK={sk}, timestamp={timestamp}")
            
            # 更新最新时间戳
            if timestamp > latest_timestamp:
                latest_timestamp = timestamp
            
            # WiFi数据
            if sk.startswith('WIFI#') and not latest_wifi:
                latest_wifi = {
                    'wifiStatus': item.get('wifiStatus', 'Unknown'),
                    'connectedSSID': item.get('connectedSSID', 'Not connected'),
                    'timestamp': timestamp
                }
                print(f"找到WiFi数据: {latest_wifi}")
            
            # 蓝牙数据 - 兼容新旧格式
            elif sk.startswith('BLUETOOTH#') and not latest_bluetooth:
                latest_bluetooth = {
                    'bluetoothStatus': item.get('bluetoothStatus', 'Unknown'),
                    'pairedDevicesCount': item.get('pairedDevicesCount', 0),
                    'connectedDevicesCount': item.get('connectedDevicesCount', 0),  # 新字段
                    'connectedDeviceNames': item.get('connectedDeviceNames', []),   # 新字段
                    'timestamp': timestamp
                }
                print(f"找到蓝牙数据: {latest_bluetooth}")
            
            # 亮度数据
            elif sk.startswith('BRIGHTNESS#') and not latest_brightness:
                latest_brightness = {
                    'screenBrightness': item.get('screenBrightness', 0),
                    'timestamp': timestamp
                }
                print(f"找到亮度数据: {latest_brightness}")

        # 构建设备状态响应 - 包含完整蓝牙信息
        device_status = {
            'deviceId': device_id,
            'lastUpdated': latest_timestamp,
            'wifi': {
                'status': latest_wifi.get('wifiStatus', 'Unknown') if latest_wifi else 'Unknown',
                'ssid': latest_wifi.get('connectedSSID', 'Not connected') if latest_wifi else 'Not connected'
            },
            'bluetooth': {
                'status': latest_bluetooth.get('bluetoothStatus', 'Unknown') if latest_bluetooth else 'Unknown',
                'pairedDevices': int(latest_bluetooth.get('pairedDevicesCount', 0)) if latest_bluetooth else 0,
                'connectedDevices': int(latest_bluetooth.get('connectedDevicesCount', 0)) if latest_bluetooth else 0,
                'connectedDeviceNames': latest_bluetooth.get('connectedDeviceNames', []) if latest_bluetooth else []
            },
            'screen': {
                'brightness': float(latest_brightness.get('screenBrightness', 0)) if latest_brightness else 0
            }
        }

        print(f"最终响应: {device_status}")

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(device_status, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"错误: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }