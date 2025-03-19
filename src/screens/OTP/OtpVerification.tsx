import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import OtpInputs from 'react-native-otp-inputs';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';
import { verifyOtpFromBackend } from '../../Api/OtpVerifyApi';
import AuthenticationButton from '../../components/Button/AuthenticationButton';
import { RootStackParamList } from '../../navigation/Types';
import { useDispatch, useSelector } from 'react-redux';
import { otpVerifyRequest } from '../../redux/authSlice';
import { RootState } from '../../redux/store';

type OtpVerificationRouteProp = RouteProp<RootStackParamList, 'Otp'>;
type OtpVerificationNavigationProp = NavigationProp<RootStackParamList, 'Otp'>;

type OtpVerificationProps = {
    route: OtpVerificationRouteProp;
    navigation: OtpVerificationNavigationProp;
};
const OtpVerification: React.FC<OtpVerificationProps> = ({ route, navigation }) => {
    const { email = 'default.email@example.com' } = route.params || {};

    const [otp, setOtp] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    console.log("Email where otp sent: ", email);
    console.log("OTP: ", otp)

    const handleOtpChange = (otp: string) => {
        setTimeout(() => {
            setOtp(otp.trim());
        }, 0);
    };

    // const verifyOtp = async () => {
    //     if (otp.trim().length !== 6) {
    //         Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
    //         return;
    //     }

    //     setIsLoading(true);
    //     try {
    //         // Send OTP to API
    //         const response = await verifyOtpFromBackend(email, otp);

    //         if (response.status === 200) {
    //             Alert.alert('Success', 'OTP Verified Successfully!');
    //             navigation.navigate("Login");
    //         } else {
    //             Alert.alert('Error', response.data.message || 'Verification Failed');
    //         }
    //     } catch (error) {
    //         console.error("Error in otp verification: ",error);

    //     } finally {
    //         setIsLoading(false); // Stop loading
    //     }
    // };

    const dispatch = useDispatch();
    const { loading, error, isOtpVerified } = useSelector((state: RootState) => state.auth);

    const verifyOtp = () => {
        if (otp.trim().length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
            return;
        }

        setIsLoading(true);  // Show loading state
        dispatch(otpVerifyRequest({ email, otp }));
    };

    useEffect(() => {
        if (isOtpVerified) {
            Alert.alert('Success', 'OTP Verified Successfully!');
            navigation.navigate('Login');
            setIsLoading(false);
        }

        if (error) {
            Alert.alert('Error', error);
            setIsLoading(false);
        }
    }, [isOtpVerified, error]);


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to your phone</Text>

            <OtpInputs
                handleChange={handleOtpChange}
                numberOfInputs={6}
                autofillFromClipboard={true}
                style={styles.otpContainer}
                inputStyles={styles.otpBox}
            />

            <AuthenticationButton title={"Verify"} buttonWidth={"50%"} bgColor={"#ff008c"} textColor={"#fff"} onPress={verifyOtp} isLoading={isLoading} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff008c', // Primary color
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6C757D',
        marginBottom: 20,
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    otpBox: {
        width: 45,
        height: 55,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff008c', // Primary color
        textAlign: 'center',
        fontSize: 20,
        color: '#000',
    },
    button: {
        marginTop: 30,
        backgroundColor: '#ff008c', // Primary color
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OtpVerification;
