import json
import boto3
from datetime import datetime
import uuid
import os
import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)


dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE', 'AMS')  
table = dynamodb.Table(table_name)


iot_client = boto3.client('iot-data', region_name='us-east-1')  

def lambda_handler(event, context):
    """
    Process device monitoring data received from IoT Core and store it in DynamoDB
    Supports both individual metric messages and combined device status messages
    """
    try:
        # Log received event
        logger.info(f"Event received: {json.dumps(event)}")
        
        # Get device ID - use default ID if not present in event
        device_id = event.get('deviceId', 'android-device')
        
        # Get timestamp from event, generate new one if not present
        timestamp_ms = event.get('timestamp')
        if timestamp_ms:
            # Convert millisecond timestamp to ISO format
            timestamp = datetime.fromtimestamp(timestamp_ms/1000).isoformat()
        else:
            timestamp = datetime.now().isoformat()
        
        logger.info(f"Using timestamp: {timestamp}")
        
        # Create base partition key
        partition_key = f"DEVICE#{device_id}"
        
        # Store raw event data (ensure every message is recorded)
        raw_event_item = {
            'PK': partition_key,
            'SK': f"RAW_EVENT#{timestamp}",
            'timestamp': timestamp,
            'raw_data': json.dumps(event)
        }
        table.put_item(Item=raw_event_item)
        logger.info("Raw event data saved")
        
        # Check if this is a combined device status message (contains multiple metrics)
        is_combined_status = all(key in event for key in ['wifiStatus', 'bluetoothStatus', 'screenBrightness'])
        
        # Process combined device status message
        if is_combined_status:
            logger.info("Combined device status message detected")
            
            # 1. Store WiFi data
            if 'wifiStatus' in event and 'connectedSSID' in event:
                wifi_item = {
                    'PK': partition_key,
                    'SK': f"WIFI#{timestamp}",
                    'wifiStatus': event['wifiStatus'],
                    'connectedSSID': event['connectedSSID'],
                    'timestamp': timestamp
                }
                table.put_item(Item=wifi_item)
                logger.info(f"WiFi data stored: {wifi_item}")
            
            # 2. Store Bluetooth data
            if 'bluetoothStatus' in event:
                bluetooth_item = {
                    'PK': partition_key,
                    'SK': f"BLUETOOTH#{timestamp}",
                    'bluetoothStatus': event['bluetoothStatus'],
                    'pairedDevicesCount': event.get('pairedDevicesCount', 0),
                    'timestamp': timestamp
                }
                table.put_item(Item=bluetooth_item)
                logger.info(f"Bluetooth data stored: {bluetooth_item}")
            
            # 3. Store brightness data
            if 'screenBrightness' in event:
                brightness_item = {
                    'PK': partition_key,
                    'SK': f"BRIGHTNESS#{timestamp}",
                    'screenBrightness': event['screenBrightness'],
                    'timestamp': timestamp
                }
                table.put_item(Item=brightness_item)
                logger.info(f"Brightness data stored: {brightness_item}")
            
            return {
                'statusCode': 200,
                'body': json.dumps('Combined device status data processed successfully!')
            }
        
        # Process individual metric messages
        else:
            # Process brightness data
            if 'screenBrightness' in event:
                brightness_item = {
                    'PK': partition_key,
                    'SK': f"BRIGHTNESS#{timestamp}",
                    'screenBrightness': event['screenBrightness'],
                    'timestamp': timestamp
                }
                table.put_item(Item=brightness_item)
                logger.info(f"Individual brightness data stored: {brightness_item}")
                
                # Process brightness control request
                if event.get('isControlRequest', False):
                    logger.info(f"Sending brightness control command: {event['screenBrightness']}%")
                    iot_client.publish(
                        topic='AMS/brightness/control',
                        qos=1,
                        payload=json.dumps({'screenBrightness': event['screenBrightness']})
                    )
            
            # Process WiFi data
            elif 'wifiStatus' in event:
                wifi_item = {
                    'PK': partition_key,
                    'SK': f"WIFI#{timestamp}",
                    'wifiStatus': event['wifiStatus'],
                    'connectedSSID': event.get('connectedSSID', 'Unknown'),
                    'timestamp': timestamp
                }
                table.put_item(Item=wifi_item)
                logger.info(f"Individual WiFi data stored: {wifi_item}")
            
            # Process Bluetooth data
            elif 'bluetoothStatus' in event:
                bluetooth_item = {
                    'PK': partition_key,
                    'SK': f"BLUETOOTH#{timestamp}",
                    'bluetoothStatus': event['bluetoothStatus'],
                    'pairedDevicesCount': event.get('pairedDevicesCount', 0),
                    'timestamp': timestamp
                }
                table.put_item(Item=bluetooth_item)
                logger.info(f"Individual Bluetooth data stored: {bluetooth_item}")
            
            # Process Bluetooth device connection/disconnection status
            elif 'deviceName' in event and 'status' in event:
                device_status_item = {
                    'PK': partition_key,
                    'SK': f"DEVICE_STATUS#{timestamp}",
                    'deviceName': event['deviceName'],
                    'status': event['status'],
                    'timestamp': timestamp
                }
                table.put_item(Item=device_status_item)
                logger.info(f"Device status stored: {device_status_item}")
            
            return {
                'statusCode': 200,
                'body': json.dumps('Individual metric data processed successfully!')
            }
    
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        logger.error(f"Event content: {json.dumps(event)}")
        
        # Attempt to save error record
        try:
            error_record = {
                'PK': f"ERROR#{str(uuid.uuid4())}",
                'SK': f"ERROR#{datetime.now().isoformat()}",
                'error_message': str(e),
                'event_data': json.dumps(event)
            }
            table.put_item(Item=error_record)
        except Exception as inner_e:
            logger.error(f"Failed to save error record: {str(inner_e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }