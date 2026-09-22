from plyer import notification
try:
    notification.notify(title='Test', message='Test', app_name='DAILTAK')
    print('Success')
except Exception as e:
    print('Error:', e)
