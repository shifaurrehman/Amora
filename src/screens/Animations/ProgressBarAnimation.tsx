import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

const ProgressBarLoading = () => {
    const progressValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(progressValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: false,
            })
        ).start();
    }, []);

    const widthInterpolation = progressValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <View style={styles.container}>
            <View style={styles.progressBar}>
                <Animated.View
                    style={[styles.progress, { width: widthInterpolation }]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    progressBar: {
        width: "80%",
        height: 10,
        backgroundColor: "#e0e0e0",
        borderRadius: 5,
        overflow: "hidden",
    },
    progress: {
        height: "100%",
        backgroundColor: "#ff008c",
    },
});

export default ProgressBarLoading;