import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';
import AuthenticationButton from '../../components/Button/AuthenticationButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from '@react-native-firebase/firestore'
import { RootStackParamList } from '../../navigation/Types';
import { setItem } from '../../utils/MMKV_STORAGE/mmkvStorage';
import { storeUserToken } from '../../Api/StoreUserToken';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string | false>(false);
  const [passwordError, setPasswordError] = useState<string | false>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProp>();

  const usersQuery = useMemo(() => query(collection(db, "usersProfiles")), []);

  const validate = (): boolean => {
    let isValid = true;
    if (!email) {
      setEmailError('Please fill in all fields');
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setEmailError("Your email format is invalid");
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (!password) {
      setPasswordError("please fill in all fields");
      isValid = false;
    }
    else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      setPasswordError("Your password must be at least 8 characters and contain both letters and numbers.");
      isValid = false;
    }
    else {
      setPasswordError(false);
    }

    return isValid;
  };

  
  const handleLoginWithFirebase = useCallback(async() => {
    Keyboard.dismiss();
    setIsLoading(true);
    if (!validate()) {
      setIsLoading(false);
      return;
    }
      try {
        const response = await signInWithEmailAndPassword(auth, email, password);
        const user = response.user;
        const uid = user.uid;
  
        if (!user.emailVerified) {
          Alert.alert('Email not verified', 'Please verify your email address before logging in.');
          setIsLoading(false);
          return;
        }
  
        setItem("USERUID", uid);
  
        // Fetch user profile
        const q = query(usersQuery, where("userId", "==", uid));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {          
          const idToken = await user.getIdToken();
          await storeUserToken(idToken).then(() => {
            navigation.replace("Home");
          });
        } else {
          navigation.navigate("CreateProfile", { uid });
        }
      } catch (error: any) {
        let errorMessage = "An error occurred. Please try again.";
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = "Invalid email format.";
            break;
          case "auth/user-not-found":
            errorMessage = "No account found with this email.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Try again.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many login attempts. Try later.";
            break;
          default:
            errorMessage = error.message;
          break;
        }
        Alert.alert("Login Failed", errorMessage);
      } finally {
        setIsLoading(false);
      }
  }, [email, password, navigation, validate, usersQuery])


  return (
    <View style={styles.container} >
      <Text style={styles.title}> Login </Text>

      {/* Email Input */}
      <TextInput
       testID="email-input"
        style={[styles.input]}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      {emailError && <Text style={styles.invalidText}> {emailError} </Text>
      }

      {/* Password Input */}
      <TextInput
      testID="password-input"
        style={[styles.input, styles.passwordInput]}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {passwordError && <Text style={styles.invalidText}> {passwordError} </Text>}


      {/* Login Button */}
      <AuthenticationButton testID="login-button" onPress={handleLoginWithFirebase} bgColor={"#ff008c"} title={"Login"} textColor={"#fff"} buttonWidth={"100%"} isLoading={isLoading} />
    
      {/* Register Link */}
      < View style={styles.registerContainer} >
        <Text style={styles.registerText}> Don't have an account? </Text>
        < TouchableOpacity testID="register-button" onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.registerLink}> Register here </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#bd4b8a',
    color: "#bd4b8a",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
  },
  passwordInput: {
    marginTop: 30
  },
  button: {
    backgroundColor: '#ff008c',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: "#000"
  },
  registerLink: {
    color: '#ff008c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  invalidText: {
    fontSize: 12,
    color: "red",
    marginTop: 2,
  }
});

export default LoginScreen;
