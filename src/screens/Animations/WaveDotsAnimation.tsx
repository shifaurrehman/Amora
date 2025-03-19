import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

const DotsWaveLoading = () => {
    const dots = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const animateDots = () => {
            dots.forEach((dot, index) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(index * 200), // Delay each dot's animation start
                        Animated.timing(dot, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            });
        };

        animateDots();
    }, [dots]);

    return (
        <View style={styles.container}>
            {dots.map((dot, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            transform: [
                                {
                                    translateY: dot.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -20], // Move upward
                                    }),
                                },
                            ],
                            opacity: dot.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0.3], // Decrease opacity when moving upward
                            }),
                        },
                    ]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    dot: {
        width: 25,
        height: 25,
        borderRadius: 13,
        backgroundColor: "#ff008c",
        marginHorizontal: 5,
    },
});

export default DotsWaveLoading;