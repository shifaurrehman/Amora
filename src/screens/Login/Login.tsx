import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';
import AuthenticationButton from '../../components/Button/AuthenticationButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/Types';
import { setItem } from '../../utils/MMKV_STORAGE/mmkvStorage';
import { emailRegex, passwordRegex } from '../../services/Regex/Regex';
import { emptyEmailMessage, emptyPasswordMessage, invalidEmailMessage, invalidPasswordMessage } from '../../services/ValidationMessages/ValidationMessage';
import { supabase } from '../../lib/supabase';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string | false>(false);
  const [passwordError, setPasswordError] = useState<string | false>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProp>();

  const validate = useCallback((): boolean => {
    let isValid = true;
    if (!email) {
      setEmailError(emptyEmailMessage);
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError(invalidEmailMessage);
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (!password) {
      setPasswordError(emptyPasswordMessage);
      isValid = false;
    }
    else if (!passwordRegex.test(password)) {
      setPasswordError(invalidPasswordMessage);
      isValid = false;
    }
    else {
      setPasswordError(false);
    }

    return isValid;
  }, [email, password]);

  
  const handleLogin = useCallback(async() => {
    Keyboard.dismiss();
    if (!validate()) {
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const user = data.user;
      if (!user.email_confirmed_at) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        Alert.alert('Email not verified', 'Please verify your email address before logging in.');
        return;
      }

      setItem('USERUID', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      if (profile) {
        navigation.replace('Home');
      } else {
        navigation.navigate('CreateProfile', { uid: user.id });
      }
    } catch (error: unknown) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, password, navigation, validate]);


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
      <AuthenticationButton testID="login-button" onPress={handleLogin} bgColor={"#ff008c"} title={"Login"} textColor={"#fff"} buttonWidth={"100%"} isLoading={isLoading} />
    
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
