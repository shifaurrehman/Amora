import notifee, {AndroidImportance} from '@notifee/react-native';

export async function createChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

export async function showLocalNotification(title: string, body: string) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default',
      pressAction: {
        id: 'default',
      },
    },
  });
}

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data: any,
) => {
  const FIREBASE_API_KEY = 'YOUR_FIREBASE_SERVER_KEY'; // TODO: Replace with your actual Server Key

  if (FIREBASE_API_KEY === 'YOUR_FIREBASE_SERVER_KEY') {
    console.warn(
      'FCM_SEND: Firebase Server Key not set. Notification will not be sent.',
    );
    return;
  }

  const message = {
    to: token,
    notification: {
      title: title,
      body: body,
      sound: 'default',
    },
    data: data,
    priority: 'high',
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FIREBASE_API_KEY}`,
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    console.log('FCM_SEND: Notification sent successfully:', responseData);
  } catch (error) {
    console.error('FCM_SEND: Error sending notification:', error);
  }
};
