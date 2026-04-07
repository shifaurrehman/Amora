import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

export const saveUserToken = async (userId: string) => {
  try {
    const token = await messaging().getToken();
    if (token) {
      await firestore().collection('usersProfiles').doc(userId).update({
        fcmToken: token,
      });
      console.log('FCM Token saved to Firestore for user:', userId);
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};
