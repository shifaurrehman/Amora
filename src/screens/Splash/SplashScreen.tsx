import { Alert, Pressable, View, StyleSheet, Animated, Easing, Text } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/Types';
import { setItem } from '../../utils/MMKV_STORAGE/mmkvStorage';
import { supabase } from '../../lib/supabase';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'Splash'>;
type Destination =
    | { screen: 'Login' | 'Home' }
    | { screen: 'CreateProfile'; uid: string };

const SplashScreen: React.FC = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(100)).current;
    const navigation = useNavigation<NavigationProps>();
    const [destination, setDestination] = useState<Destination | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    const checkSession = useCallback(async () => {
        setDestination(null);
        setAuthError(null);
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            if (!sessionData.session) {
                setDestination({ screen: 'Login' });
                return;
            }

            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!userData.user) {
                setDestination({ screen: 'Login' });
                return;
            }

            if (!userData.user.email_confirmed_at) {
                const { error: signOutError } = await supabase.auth.signOut();
                if (signOutError) throw signOutError;
                Alert.alert('Email not verified', 'Please verify your email address before logging in.');
                setDestination({ screen: 'Login' });
                return;
            }

            setItem('USERUID', userData.user.id);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', userData.user.id)
                .maybeSingle();
            if (profileError) throw profileError;

            setDestination(
                profile
                    ? { screen: 'Home' }
                    : { screen: 'CreateProfile', uid: userData.user.id },
            );
        } catch (error: unknown) {
            setAuthError(error instanceof Error ? error.message : 'Unable to restore the saved session.');
        }
    }, []);

    useEffect(() => {
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
    }, [fadeAnim, translateYAnim]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        if (destination) {
            const timeout = setTimeout(() => {
                if (destination.screen === 'CreateProfile') {
                    navigation.replace('CreateProfile', { uid: destination.uid });
                } else {
                    navigation.replace(destination.screen);
                }
            }, 3000);

            return () => clearTimeout(timeout);
        }
    }, [destination, navigation]);

    return (
        <View style={styles.mainContainer}>
            <Animated.Text testID="welcomeText" style={[styles.appName, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
                Amora
            </Animated.Text>
            {authError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{authError}</Text>
                    <Pressable onPress={checkSession}>
                        <Text style={styles.actionText}>Retry</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.replace('Login')}>
                        <Text style={styles.actionText}>Go to login</Text>
                    </Pressable>
                </View>
            )}
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
    errorContainer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    actionText: {
        color: '#fff',
        fontWeight: '700',
        padding: 8,
    },
});
