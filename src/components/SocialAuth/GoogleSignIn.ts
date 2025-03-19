import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your Web Client ID
});

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    const userCredential = await auth().signInWithCredential(googleCredential);
    Alert.alert("Success", "Signed in with Google!");
    console.log("User Info: ", userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    console.log("Google Sign-In Error: ", error);
    Alert.alert("Error", "Google Sign-In failed!");
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    await auth().signOut();
    Alert.alert("Signed Out", "You have been signed out!");
  } catch (error) {
    console.log("Google Sign-Out Error: ", error);
  }
};
