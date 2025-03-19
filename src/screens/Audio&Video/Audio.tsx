import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, PermissionsAndroid, Platform, Alert, StyleSheet } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Slider from '@react-native-community/slider';
import WaveformPlayer from './AudioSlider';

const audioRecorderPlayer = new AudioRecorderPlayer();

const VoiceMessageScreen = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playTime, setPlayTime] = useState('00:00');
    const [duration, setDuration] = useState('00:00');
    const [currentPositionSec, setCurrentPositionSec] = useState(0);
    const [currentDurationSec, setCurrentDurationSec] = useState(0);

    useEffect(() => {
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                ]);

                if (
                    granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED ||
                    granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !== PermissionsAndroid.RESULTS.GRANTED
                ) {
                    Alert.alert('Permissions not granted', 'You need to grant audio permissions to use this feature.');
                } else {
                    console.log('Permissions granted');
                }
            } catch (err) {
                console.warn('Permission error:', err);
            }
        }
    };

    const startRecording = async () => {
        try {
            setIsRecording(true);

            const path = Platform.select({
                ios: `${RNFS.DocumentDirectoryPath}/voiceMessage.m4a`,
                android: `${RNFS.CachesDirectoryPath}/voiceMessage.m4a`,
            })!;

            console.log('Recording Path:', path);

            await audioRecorderPlayer.startRecorder(path);
            audioRecorderPlayer.addRecordBackListener((e) => {
                console.log('Recording...', e);
            });

        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);
            setRecordedAudio(result); // Save recorded file path
            console.log('Recorded Audio:', result);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    const playRecording = async () => {
        try {
            if (recordedAudio) {
                console.log('Playing Audio:', recordedAudio);
                await audioRecorderPlayer.startPlayer(recordedAudio);
                setIsPlaying(true);
                audioRecorderPlayer.addPlayBackListener((e) => {
                    setCurrentPositionSec(e.currentPosition);
                    setCurrentDurationSec(e.duration);
                    setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
                    setDuration(audioRecorderPlayer.mmssss(Math.floor(e.duration)));

                    if (e.currentPosition >= e.duration) {
                        setIsPlaying(false);
                        audioRecorderPlayer.stopPlayer();
                        audioRecorderPlayer.removePlayBackListener();
                    }
                });
            }
        } catch (error) {
            console.error('Failed to play recording:', error);
        }
    };


    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.recordButton}>
                <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
            </TouchableOpacity>

            {recordedAudio && <WaveformPlayer recordedAudio={recordedAudio} />}

        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    recordButton: {
        backgroundColor: 'red',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    playPauseButton: {
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
    },
    audioPlayerContainer: {
        alignItems: 'center',
        width: '80%',
    },
    slider: {
        width: '100%',
        height: 40,
        backgroundColor:"red"
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    timeText: {
        color: 'black',
    },
});

export default VoiceMessageScreen;
