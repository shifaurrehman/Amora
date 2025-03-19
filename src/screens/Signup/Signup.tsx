import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import AuthenticationButton from '../../components/Button/AuthenticationButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from '@react-native-firebase/auth'
import { getApp } from '@react-native-firebase/app';

type RootStackParamList = {
  Otp: {
    email: string;
  }
  Login: undefined;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Signup: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [invalidName, setInvalidName] = useState<string | null>(null);
  const [invalidEmail, setInvalidEmail] = useState<string | null>(null);
  const [invalidPassword, setInvalidPassword] = useState<string | null>(null);
  const [invalidConfirmPassword, setInvalidConfirmPassword] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validate = (): boolean => {
    let isValid = true;

    if (name === '') {
      setInvalidName('Name is required.');
      isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(name)) {
      setInvalidName('Name can only contain letters and spaces.');
      isValid = false;
    } else {
      setInvalidName(null);
    }

    if (email === '') {
      setInvalidEmail('Email is required.');
      isValid = false;
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
      setInvalidEmail('Please enter a valid email address.');
      isValid = false;
    } else {
      setInvalidEmail(null);
    }

    if (password === '') {
      setInvalidPassword('Password is required');
      isValid = false;
    } else if (
      !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/.test(password)
    ) {
      setInvalidPassword(
        'Password must be at least 8 characters long and contain at least one letter and one number.',
      );
      isValid = false;
    } else {
      setInvalidPassword(null);
    }

    if (confirmPassword === '') {
      setInvalidConfirmPassword(
        'Please enter your password again to confirm it.',
      );
      isValid = false;
    } else if (confirmPassword !== password) {
      setInvalidConfirmPassword('Passwords do not match.');
      isValid = false;
    } else {
      setInvalidConfirmPassword(null);
    }
    return isValid;
  };

  const signupWithFirebase = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        const auth = getAuth(getApp());
        const response = await createUserWithEmailAndPassword(auth, email, password);
        // console.log(response);

        await updateProfile(response.user, {
          displayName: name, // Set user name
        });

        await response.user.sendEmailVerification();
        Alert.alert("Account created", "Please check your email to verify your account and then login.");

        navigation.navigate("Login");
      } catch (error: any) {
        console.log("Signup failed: ", error.message.replace(/^\[.*?\]\s*/, ""));
        let errorMessage = "Something went wrong. Please try again.";
        if (error.code === "auth/email-already-in-use") errorMessage = "Email is already in use.";
        else if (error.code === "auth/invalid-email") errorMessage = "Invalid email format.";
        else if (error.code === "auth/weak-password") errorMessage = "Password should be at least 6 characters.";
        Alert.alert("Signup failed: ", errorMessage)
      }finally{
        setIsLoading(false);
      }
    }
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        </View>
        <Text style={styles.headerText}>Create New Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />
        {invalidName && <Text style={styles.errorText}>{invalidName}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        {invalidEmail && <Text style={styles.errorText}>{invalidEmail}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {invalidPassword && <Text style={styles.errorText}>{invalidPassword}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {invalidConfirmPassword && (
          <Text style={styles.errorText}>{invalidConfirmPassword}</Text>
        )}

        {/* Signup button */}
        <AuthenticationButton onPress={signupWithFirebase} title={"Signup"} buttonWidth={"100%"} bgColor={"#ff008c"} textColor={"#fff"} isLoading={isLoading} />

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Already have account! </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.registerLink}>Login here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginVertical: 20,
    overflow: 'hidden',
    borderRadius: 50,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#bd4b8a',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
    fontSize: 16,
    color: "#bd4b8a",
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
  },
  button: {
    height: 50,
    backgroundColor: '#ff008c',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: "#000",
  },
  registerLink: {
    color: '#ff008c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});