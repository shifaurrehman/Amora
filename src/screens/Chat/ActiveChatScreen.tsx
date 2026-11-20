import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { RootStackParamList } from '../../navigation/Types';
import {
    ChatMessage,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    subscribeToMessages,
    unsubscribeChannel,
} from '../../services/supabase/chat';
import { getCurrentUserId } from '../../services/supabase/session';

// Define the route type
type ActiveChatScreenRouteProp = RouteProp<RootStackParamList, 'ActiveChatScreen'>;

const toIMessage = (message: ChatMessage): IMessage => ({
    _id: message.id,
    text: message.text,
    createdAt: message.createdAt,
    user: { _id: message.senderId },
});

const ActiveChatScreen: React.FC = () => {
    const [messagesList, setMessagesList] = useState<IMessage[]>([]);
    const [myUserId, setMyUserId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const myUserIdRef = useRef<string | null>(null);
    const conversationIdRef = useRef<string | null>(null);
    const navigation = useNavigation();
    const route = useRoute<ActiveChatScreenRouteProp>();

    useEffect(() => {
        let cancelled = false;

        const setupChat = async () => {
            const otherUserId = route?.params?.data?.userId;
            if (!otherUserId) {
                setLoadError('This chat is missing a participant.');
                return;
            }

            try {
                setLoadError(null);
                // Resolve our own id from the session rather than trusting the
                // route param, so chats opened from any screen stay correct.
                const resolvedMyUserId = await getCurrentUserId();
                if (!resolvedMyUserId) {
                    throw new Error('You must be signed in to chat.');
                }
                if (cancelled) return;
                myUserIdRef.current = resolvedMyUserId;
                setMyUserId(resolvedMyUserId);

                const conversationId = await getOrCreateConversation(resolvedMyUserId, otherUserId);
                if (cancelled) return;
                conversationIdRef.current = conversationId;

                const messages = await fetchMessages(conversationId);
                if (cancelled) return;
                setMessagesList(messages.map(toIMessage));
            } catch (error: unknown) {
                if (cancelled) return;
                console.log('Error opening chat: ', error);
                setLoadError(error instanceof Error ? error.message : 'Failed to open the chat.');
                return;
            }

            // Realtime updates for new messages in this conversation only.
            const channel = subscribeToMessages(
                conversationIdRef.current as string,
                (message) => {
                    setMessagesList((previous) => {
                        // Own sends are reconciled in onSend; realtime copies
                        // of any message are deduplicated by id.
                        if (previous.some((existing) => existing._id === message.id)) {
                            return previous;
                        }
                        return [toIMessage(message), ...previous];
                    });
                },
                (error) => {
                    console.log('Realtime error: ', error.message);
                },
            );

            return () => {
                unsubscribeChannel(channel);
            };
        };

        const cleanupPromise = setupChat();
        return () => {
            cancelled = true;
            cleanupPromise.then((cleanup) => cleanup?.());
        };
    }, [route.params]);


    const onSend = useCallback(async (messages: IMessage[] = []) => {
        if (!messages.length) return;

        const myUserId = myUserIdRef.current;
        const conversationId = conversationIdRef.current;
        if (!myUserId || !conversationId) return;

        const msg: IMessage = messages[0];
        const optimisticId = `local-${Date.now()}`;
        const optimisticMessage: IMessage = {
            ...msg,
            _id: optimisticId,
            user: { _id: myUserId },
        };

        setMessagesList(previousMessages =>
            GiftedChat.append(previousMessages, [optimisticMessage]),
        );

        try {
            const saved = await sendMessage(conversationId, myUserId, msg.text || '');
            setMessagesList((previousMessages) => {
                // Drop the optimistic bubble and add the stored row once,
                // whether or not realtime already delivered it.
                const withoutOptimistic = previousMessages.filter(
                    (existing) => existing._id !== optimisticId,
                );
                if (withoutOptimistic.some((existing) => existing._id === saved.id)) {
                    return withoutOptimistic;
                }
                return [toIMessage(saved), ...withoutOptimistic];
            });
        } catch (error: unknown) {
            console.log('Error sending message: ', error);
            setMessagesList(previousMessages =>
                previousMessages.filter((existing) => existing._id !== optimisticId),
            );
            Alert.alert(
                'Message not sent',
                error instanceof Error ? error.message : 'Failed to send the message. Please try again.',
            );
        }
    }, []);


    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleGoBack} style={styles.goBackButton}>
                    <Ionicons name="arrow-back" size={32} color="#ffffff" />
                </Pressable>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flex: 1, }}>
                    <Text style={styles.userName}>{route?.params?.data?.name}</Text>
                    <Image source={{ uri: route?.params?.data?.profileImage?.uri }} style={styles.userIcon} />
                </View>
            </View>

            {/* Chat UI */}
            {loadError ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{loadError}</Text>
                </View>
            ) : (
                <GiftedChat
                    messages={messagesList}
                    onSend={(messages) => onSend(messages)}
                    user={{ _id: myUserId || 'loading' }}
                />
            )}
        </View>
    );
};

export default ActiveChatScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ff008c",
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    goBackButton: {
        marginRight: 15,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    userIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
        borderColor: "#fff",
        borderWidth: 1,
    },
});
