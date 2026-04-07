import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveChatUserId, clearActiveChatUserId } from '../../redux/chatSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { Bubble, Composer, GiftedChat, IMessage, InputToolbar, Send } from 'react-native-gifted-chat';
import { RootStackParamList } from '../../navigation/Types';
import { addDoc, collection, doc, getFirestore, onSnapshot, orderBy, query, getDoc } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { sendPushNotification } from '../../utils/fcm-service/notification-service';

// Define the route type
type ActiveChatScreenRouteProp = RouteProp<RootStackParamList, 'ActiveChatScreen'>;
const db = getFirestore(getApp());

const ActiveChatScreen:React.FC = () => {
    const [messagesList, setMessagesList] = useState<IMessage[]>([]);
    const navigation = useNavigation();
    const route = useRoute<ActiveChatScreenRouteProp>();
    const dispatch = useDispatch();
    console.log("ACTIVE-CHAT-SCREEN: params in screen: ", JSON.stringify(route?.params, null, 2));

    useEffect(() => {
        if (!route?.params?.id || !route?.params?.data?.userId) return;
        const chatId = route?.params?.id < route?.params?.data?.userId
            ? route?.params?.id + route?.params?.data?.userId
            : route?.params?.data?.userId + route?.params?.id;
    
            const chatRef = query(
                collection(doc(db, 'chats', chatId), 'messages'),
                orderBy("createdAt", "desc")
              );
    
              const unsubscribe = onSnapshot(chatRef, (querySnapshot) => {
                const allMessages = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data as IMessage,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                    };
                });
                setMessagesList(allMessages);
            });
        return () => {
            console.log("ACTIVE-CHAT-SCREEN: Unmounting active chat screen. Clearing ID.");
            unsubscribe();
            dispatch(clearActiveChatUserId());
        }
    }, [route.params, dispatch]);

    useEffect(() => {
        const userId = route?.params?.data?.userId;
        if (userId) {
            console.log("ACTIVE-CHAT-SCREEN: Setting active chat user ID:", userId);
            dispatch(setActiveChatUserId(userId));
        } else {
            console.warn("ACTIVE-CHAT-SCREEN: No user ID found in route params to set active chat!");
        }
    }, [route.params?.data?.userId, dispatch]);


    const onSend = useCallback(async (messages: IMessage[] = []) => {
        if (!messages.length) return;
    
        const msg: IMessage = messages[0];
        const myMsg = {
            ...msg,
            sendBy: route?.params?.id,
            sendTo: route?.params?.data?.userId,
            createdAt: msg.createdAt,
        };
    
        const chatId = route?.params?.id < route?.params?.data?.userId
            ? route?.params?.id + route?.params?.data?.userId
            : route?.params?.data?.userId + route?.params?.id;
    
        setMessagesList(previousMessages =>
            GiftedChat.append(previousMessages, [myMsg]),
        );
    
        await addDoc(collection(doc(db, 'chats', chatId), 'messages'), myMsg);

        // Send Push Notification
        try {
            const recipientId = route?.params?.data?.userId;
            if (recipientId) {
                const userDoc = await getDoc(doc(db, 'usersProfiles', recipientId));
                const recipientToken = userDoc.data()?.fcmToken;

                if (recipientToken) {
                    console.log('ACTIVE-CHAT-SCREEN: Sending notification to:', recipientToken);
                    await sendPushNotification(
                        recipientToken,
                        'New Message', // You might want to customize this with the sender's name
                        msg.text,
                        {
                            userId: route?.params?.id, // Sender ID (Me)
                            type: 'chat',
                        }
                    );
                } else {
                    console.warn('ACTIVE-CHAT-SCREEN: Recipient has no FCM token.');
                }
            }
        } catch (error) {
            console.error('ACTIVE-CHAT-SCREEN: Error sending notification:', error);
        }
    }, [route.params]);


    const handleGoBack = () => {
        navigation.goBack();
    };

    const renderSend = (props: any) => {
        return (
            <Send {...props}>
                <View style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#ffffff" />
                </View>
            </Send>
        );
    };

    const renderInputToolbar = (props: any) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={styles.inputToolbar}
                primaryStyle={{ alignItems: 'center' }}
            />
        );
    };

    const renderComposer = (props: any) => {
        return (
            <Composer
                {...props}
                textInputStyle={styles.chatInput}
            />
        );
    };
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: "#8b888aff",
                        padding: 8,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        borderBottomLeftRadius: 20,
                        borderBottomRightRadius: 3,
                        paddingVertical: 2,
                        paddingHorizontal: 6,
                    },
                    left: {
                        backgroundColor: "#8b888aff",
                        padding: 8,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 20,
                        paddingVertical: 2,
                        paddingHorizontal: 6,
                    }
                }}
                textStyle={{
                    right: {
                        color: "#ffffff",
                        fontSize: 16,
                    },
                    left: {
                        color: "#ffffff",
                        fontSize: 16,
                    }
                }}
            />
        );
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
            <GiftedChat
                messages={messagesList}
                onSend={(messages) => onSend(messages)}
                user={{ _id: route?.params?.id }}
                renderInputToolbar={renderInputToolbar}
                renderComposer={renderComposer}
                renderSend={renderSend}
                renderBubble={renderBubble}
            />
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
    },
    userIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
        borderColor: "#fff",
        borderWidth: 1,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: "#ff008c",
        justifyContent: "center",
        alignItems: "center",
    },
    inputToolbar: {
        backgroundColor: "#e1e1dfff",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    chatInput: {
        backgroundColor: "#d2d2d0ff",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
    }
});