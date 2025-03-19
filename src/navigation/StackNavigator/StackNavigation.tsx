import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../../screens/Login/Login';
import Signup from '../../screens/Signup/Signup';
import OtpVerification from '../../screens/OTP/OtpVerification';
import SplashScreen from '../../screens/Splash/SplashScreen';
import TabNavigator from '../TabNavigator/TabNavigator';
import { RootStackParamList } from '../Types';
import Details from '../../screens/Details/Details';
import CreateProfile from '../../screens/CreateProfile/CreateProfile';
import ActiveChatScreen from '../../screens/Chat/ActiveChatScreen';
import VoiceMessageScreen from '../../screens/Audio&Video/Audio';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigation: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name='Splash' component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name='Login' component={Login} options={{ headerShown: false }} />
            <Stack.Screen name='Signup' component={Signup} options={{ headerShown: false }} />
            <Stack.Screen name='ActiveChatScreen' component={ActiveChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name='VoiceMessageScreen' component={VoiceMessageScreen} options={{ headerShown: false }} />
            <Stack.Screen name='CreateProfile' component={CreateProfile} options={{ headerShown: false }} />
            <Stack.Screen name='Home' component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name='Otp' component={OtpVerification} options={{ headerShown: false }} />
            <Stack.Screen name='Details' component={Details} options={{ headerShown: false }} />
        </Stack.Navigator>
    )
}

export default StackNavigation;