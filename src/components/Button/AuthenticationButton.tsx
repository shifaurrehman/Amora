import { Text, ActivityIndicator, StyleSheet, Pressable, } from 'react-native';
import React from 'react';

// Define prop types
interface AuthenticationButtonProps {
    bgColor?: string;
    textColor?: string;
    title: string;
    buttonWidth?: string | number;
    isLoading?: boolean;
    onPress: () => void;
    marginFromTop?: string | number;
}

const AuthenticationButton: React.FC<AuthenticationButtonProps> = ({
    bgColor,
    textColor,
    title,
    buttonWidth,
    isLoading,
    onPress,
    marginFromTop
}) => {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }: { pressed: boolean }) => [styles.button, { backgroundColor: bgColor || "#ff008c", width: buttonWidth || "90%", height: 55, opacity: pressed ? 0.8 : 1, marginTop: marginFromTop? marginFromTop: 30  }]}
        >
            {isLoading ? (
                <ActivityIndicator size={'large'} color={"#fff"} />
            ) : (
                <Text style={[styles.buttonText, { color: textColor || "#fff" }]}>{title}</Text>
            )}
        </Pressable>
    );
};

export default AuthenticationButton;

const styles = StyleSheet.create({
    button: {
        alignSelf: "center",
        justifyContent: 'center',
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 6,
        elevation: 2,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "600",
    },
});
