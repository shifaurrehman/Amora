import React, { useEffect } from 'react';
import MainNavigation from './navigation/MainNavigator/MainNavigation';
import { Provider } from 'react-redux';
import store, { persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { createChannel, showLocalNotification } from './utils/fcm-service/notification-service';

const App = () => {

  async function requestPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

    await messaging().requestPermission(); // iOS safe
  }

  useEffect(() => {
    async function init() {
      await requestPermission();
      await createChannel();
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
    }

    init();
  }, []);


  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('NOTIFICATION_DEBUG: Message received in foreground:', JSON.stringify(remoteMessage, null, 2));

      // Get current state
      const state = store.getState();
      const activeChatUserId = state.chat.activeChatUserId;

      // Get sender ID from data payload
      // Ideally, the backend should send 'senderId' or 'userId' in the data object
      const senderId = remoteMessage.data?.userId || remoteMessage.data?.senderId || remoteMessage.data?._id;

      console.log('NOTIFICATION_DEBUG: Current Global Active Chat User ID:', activeChatUserId);
      console.log('NOTIFICATION_DEBUG: Notification Sender ID:', senderId);

      // Validation logic
      if (!senderId) {
        console.warn('NOTIFICATION_DEBUG: Could not find senderId in notification data. Showing notification by default.');
        showLocalNotification(
          remoteMessage.notification?.title || '',
          remoteMessage.notification?.body || ''
        );
        return;
      }

      const isActiveChatWithSender = activeChatUserId === senderId;
      console.log(`NOTIFICATION_DEBUG: Is app on active chat with sender? ${isActiveChatWithSender ? 'YES' : 'NO'}`);

      // Only show notification if we are NOT in the active chat with this user
      if (!isActiveChatWithSender) {
        console.log('NOTIFICATION_DEBUG: Showing local notification.');
        showLocalNotification(
          remoteMessage.notification?.title || '',
          remoteMessage.notification?.body || ''
        );
      } else {
        console.log('NOTIFICATION_DEBUG: Suppressing local notification because user is in active chat.');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <MainNavigation />
      </PersistGate>
    </Provider>
  )
}

export default App