import json
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime
import logging

# 设置日志
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AMS')  # 表名请确认

def lambda_handler(event, context):
    try:
        logger.info("开始获取统一设备列表")
        
        # 🔥 核心修改：查找所有设备的数据，但统一返回为android-device
        
        # 查找所有以 EVENT# 或 RAW_EVENT# 开头的记录
        response = table.scan(
            ProjectionExpression="PK, SK, #ts",
            FilterExpression="begins_with(SK, :event_prefix) OR begins_with(SK, :raw_event_prefix)",
            ExpressionAttributeValues={
                ":event_prefix": "EVENT#",
                ":raw_event_prefix": "RAW_EVENT#"
            },
            ExpressionAttributeNames={"#ts": "timestamp"}
        )
        
        # 🔧 修改：收集所有设备的最新时间戳，然后取最新的
        all_timestamps = []
        device_data = {}  # 记录每个设备的数据用于调试
        
        # 处理初次扫描结果
        for item in response.get('Items', []):
            pk = item.get('PK', '')
            sk = item.get('SK', '')
            timestamp = item.get('timestamp', '')
            
            # 提取设备ID
            if pk.startswith('DEVICE#'):
                device_id = pk.replace('DEVICE#', '')
                
                # 验证时间戳格式
                if timestamp and device_id:
                    try:
                        # 验证时间戳是否有效
                        if isinstance(timestamp, str):
                            # 尝试解析时间戳
                            parsed_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                            
                            # 收集所有有效的时间戳
                            all_timestamps.append(timestamp)
                            
                            # 记录设备数据用于调试
                            if device_id not in device_data:
                                device_data[device_id] = []
                            device_data[device_id].append({
                                'timestamp': timestamp,
                                'sk': sk
                            })
                            
                            logger.info(f"收集时间戳: {timestamp} (来自设备 {device_id}, SK: {sk})")
                    except Exception as e:
                        logger.warning(f"解析时间戳失败: {timestamp}, 错误: {e}")
        
        # 处理分页
        while 'LastEvaluatedKey' in response:
            logger.info("处理下一页数据")
            response = table.scan(
                ProjectionExpression="PK, SK, #ts",
                FilterExpression="begins_with(SK, :event_prefix) OR begins_with(SK, :raw_event_prefix)",
                ExpressionAttributeValues={
                    ":event_prefix": "EVENT#",
                    ":raw_event_prefix": "RAW_EVENT#"
                },
                ExpressionAttributeNames={"#ts": "timestamp"},
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            
            for item in response.get('Items', []):
                pk = item.get('PK', '')
                sk = item.get('SK', '')
                timestamp = item.get('timestamp', '')
                
                if pk.startswith('DEVICE#'):
                    device_id = pk.replace('DEVICE#', '')
                    
                    if timestamp and device_id:
                        try:
                            if isinstance(timestamp, str):
                                parsed_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                                all_timestamps.append(timestamp)
                                
                                if device_id not in device_data:
                                    device_data[device_id] = []
                                device_data[device_id].append({
                                    'timestamp': timestamp,
                                    'sk': sk
                                })
                        except Exception as e:
                            logger.warning(f"解析时间戳失败: {timestamp}, 错误: {e}")
        
        # 🎯 关键修改：找到所有时间戳中最新的一个
        latest_timestamp = None
        if all_timestamps:
            # 按时间戳排序，取最新的
            all_timestamps.sort(reverse=True)
            latest_timestamp = all_timestamps[0]
            logger.info(f"所有时间戳中最新的: {latest_timestamp}")
        
        # 🔍 调试信息：记录找到的设备和时间戳
        logger.info(f"找到的原始设备数据: {device_data}")
        logger.info(f"收集到的所有时间戳数量: {len(all_timestamps)}")
        
        # 🎯 构造返回体：只返回一个统一的android-device
        devices = []
        current_time = datetime.now().isoformat()
        
        if latest_timestamp:
            # 计算时间差用于调试
            try:
                last_seen_time = datetime.fromisoformat(latest_timestamp.replace('Z', '+00:00'))
                current_time_obj = datetime.now()
                time_diff = current_time_obj - last_seen_time.replace(tzinfo=None)
                logger.info(f"统一设备 android-device: lastSeen={latest_timestamp}, 时间差={time_diff.total_seconds()/60:.1f}分钟")
            except Exception as e:
                logger.warning(f"计算时间差失败: {e}")
            
            # 🎯 只返回一个统一的设备
            devices.append({
                'deviceId': 'android-device',  # 固定为android-device
                'lastSeen': latest_timestamp
            })
        else:
            # 如果没有找到任何时间戳，返回一个默认的设备
            logger.warning("没有找到任何有效的时间戳，返回默认设备")
            devices.append({
                'deviceId': 'android-device',
                'lastSeen': current_time
            })
        
        logger.info(f"返回统一设备: android-device")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'devices': devices,  # 现在只包含一个设备
                'timestamp': current_time,
                'debug': {
                    'total_devices': len(devices),  # 应该是1
                    'scan_completed': True,
                    'unified_device': True,  # 标记这是统一设备
                    'original_devices_found': list(device_data.keys()),  # 原始找到的设备ID
                    'total_timestamps_collected': len(all_timestamps)
                }
            })
        }
        
    except Exception as e:
        logger.error(f"获取设备列表失败: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }


# ===== 替代方案：更简单的统一设备版本 =====

def lambda_handler_simple_unified(event, context):
    """
    更简单的统一设备版本：强制返回一个android-device，使用当前时间
    """
    try:
        logger.info("返回简单统一设备")
        
        current_time = datetime.now().isoformat()
        
        # 🎯 直接返回一个在线的android-device
        devices = [{
            'deviceId': 'android-device',
            'lastSeen': current_time  # 总是显示为当前时间（在线状态）
        }]
        
        logger.info("返回固定的在线android-device")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'devices': devices,
                'timestamp': current_time,
                'debug': {
                    'total_devices': 1,
                    'unified_device': True,
                    'always_online': True
                }
            })
        }
        
    except Exception as e:
        logger.error(f"返回统一设备失败: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }


