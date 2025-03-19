import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { RootStackParamList } from '../../navigation/Types';
import { addDoc, collection, doc, getFirestore, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';

// Define the route type
type ActiveChatScreenRouteProp = RouteProp<RootStackParamList, 'ActiveChatScreen'>;
const db = getFirestore(getApp());

const ActiveChatScreen:React.FC = () => {
    const [messagesList, setMessagesList] = useState<IMessage[]>([]);
    const navigation = useNavigation();
    const route = useRoute<ActiveChatScreenRouteProp>();

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
    
        return unsubscribe;
    }, [route.params]);


    const onSend = useCallback(async(messages: IMessage[] = []) => {
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
    }, [route.params]);


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
            <GiftedChat
                messages={messagesList}
                onSend={(messages) => onSend(messages)}
                user={{ _id: route?.params?.id }}
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
});