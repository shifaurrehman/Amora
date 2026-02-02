import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { RootStackParamList } from '../../navigation/Types';
import { getItem, removeItem } from '../../utils/MMKV_STORAGE/mmkvStorage';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(100)).current;
    const navigation = useNavigation<NavigationProps>();
    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

    const checkTokenAndNavigate = useCallback(async () => {
        try {
            const token = getItem('UserToken');
            if (!token) {
                setIsTokenValid(false);
                return;
            }
            const decodedToken: { exp: number } = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                removeItem("UserToken");
                console.log("Token expired");
                setIsTokenValid(false);
            } else {
                setIsTokenValid(true);
            }
        } catch (error) {
            setIsTokenValid(false);
            console.log("Error in checkToken", error);
        }
    }, [navigation]);


    useEffect(() => {
        checkTokenAndNavigate();

        const fadeIn = Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
        });

        const slideUp = Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
        });

        Animated.parallel([fadeIn, slideUp]).start();

        return () => {
            fadeIn.stop();
            slideUp.stop();
        };
    }, [fadeAnim, translateYAnim, checkTokenAndNavigate]);

    useEffect(() => {
        if (isTokenValid !== null) {
            const timeout = setTimeout(() => {
                navigation.replace(isTokenValid ? "Home" : "Login");
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, [isTokenValid, navigation]);

    return (
        <View style={styles.mainContainer}>
            <Animated.Text testID="welcomeText" style={[styles.appName, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
                Amora
            </Animated.Text>
        </View>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff008c',
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        alignSelf: 'center',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
        elevation: 2,
    },
});
