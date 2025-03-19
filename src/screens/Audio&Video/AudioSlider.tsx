import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Svg, { Line } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';  // Import icons



const audioRecorderPlayer = new AudioRecorderPlayer();
const { width: screenWidth } = Dimensions.get('window');

const WaveformPlayer = ({ recordedAudio }: { recordedAudio: string | null }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [duration, setDuration] = useState(1); // Default to avoid division by zero
    const [waveformData, setWaveformData] = useState<number[]>([]);

    useEffect(() => {
        generateWaveform();
    }, []);

    const generateWaveform = () => {
        // Simulating random waveform data (50-100 bars)
        const randomData = Array.from({ length: 50 }, () => Math.floor(Math.random() * 100) + 20);
        setWaveformData(randomData);
    };

    const playRecording = async () => {
        if (recordedAudio) {
            await audioRecorderPlayer.startPlayer(recordedAudio);
            setIsPlaying(true);

            audioRecorderPlayer.addPlayBackListener((e) => {
                setCurrentPosition(e.currentPosition);
                setDuration(e.duration);

                if (e.currentPosition >= e.duration) {
                    setIsPlaying(false);
                    audioRecorderPlayer.stopPlayer();
                    audioRecorderPlayer.removePlayBackListener();
                }
            });
        }
    };

    const stopPlayback = async () => {
        await audioRecorderPlayer.stopPlayer();
        setIsPlaying(false);
    };

    return (
        <View style={styles.container}>
            {/* Render Waveform */}
            <View style={styles.waveformOuterContainer}>
                <View style={{ width: "20%", alignSelf: "center", padding: 10 }}>
                    <Pressable style={({ pressed }) => [styles.AudioplayButton, { opacity: pressed ? 0.7 : 1 }]} onPress={isPlaying ? stopPlayback : playRecording}>
                        <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={32} color="white" />
                    </Pressable>
                </View>
                <Svg height="60" width="80%" style={styles.waveformContainer}>
                    {waveformData.map((value, index) => {
                        const totalBars = waveformData.length;
                        const containerWidth = screenWidth - 40;
                        const barWidth = containerWidth / totalBars - 2;
                        const xPosition = index * (barWidth + 2);

                        return (
                            <Line
                                key={index}
                                x1={xPosition}
                                y1={60 - value}
                                x2={xPosition}
                                y2={60}
                                stroke={index / totalBars < currentPosition / duration ? '#ff008c' : '#7a7b7d'}
                                strokeWidth={barWidth}
                            />
                        );
                    })}
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        width: '90%',
        alignSelf: 'center',
        marginTop: 20,
    },
    AudioplayButton: {
        width: "100%",
        height: "100%",
        borderRadius: 25,
        backgroundColor: '#ff008c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        backgroundColor: '#ff008c',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginBottom: 10,  // Adds spacing between button and waveform
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    waveformOuterContainer: {
        flexDirection: 'row',
        width: '100%',
        height: 75,
        paddingVertical: 4,
        paddingRight: 10,
        backgroundColor: '#cccccc',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: "center",
    },
    waveformContainer: {
        height: 60,  // Explicit height to avoid collapse
        width: '80%',
    },
});


export default WaveformPlayer;
