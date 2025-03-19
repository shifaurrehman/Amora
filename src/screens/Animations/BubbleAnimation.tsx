import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";

const BubbleLoading = () => {
    const bubbles = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];


    useEffect(() => {
        const animateBubbles = () => {
            bubbles.forEach((bubble, index) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(index * 150), // Delay the start of each bubble's animation
                        Animated.timing(bubble, {
                            toValue: 1,
                            duration: 200,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(bubble, {
                            toValue: 0.3,
                            duration: 200,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.delay(150), // Delay between the end of one bubble's animation and the start of the next
                    ]),
                    { iterations: -1 }
                ).start();
            });
        };

        animateBubbles();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.bubblesContainer}>
                {bubbles.map((bubble, index) => (
                    <Animated.View key={index} style={[styles.bubble, { opacity: bubble }]} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#ff008c",
    },
    bubblesContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    bubble: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#ff008c",
        marginHorizontal: 5,
    },
});

export default BubbleLoading;
