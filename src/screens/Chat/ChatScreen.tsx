import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity, TextInput, Pressable } from 'react-native'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApp } from '@react-native-firebase/app'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/Types'
import { getItem } from '../../utils/MMKV_STORAGE/mmkvStorage'
import BubbleLoading from '../Animations/BubbleAnimation'
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { opacity } from 'react-native-reanimated/lib/typescript/Colors'

const MemoizedRenderItem = memo(({ item, userId, navigation }: { item: UserProfileType, userId: string | null, navigation: ChatScreenNavigationProp }) => (
    <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
            if (userId) {
                navigation.navigate("ActiveChatScreen", { data: item, id: userId });
            } else {
                console.error("User ID is null");
            }
        }}
    >
        <Image
            style={styles.userIcon}
            source={{
                uri: item?.profileImage?.uri,
            }}
            resizeMode='cover'
        />
        <Text style={styles.userName}>{item.name}</Text>
    </TouchableOpacity>
))

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ActiveChatScreen'>;

const db = getFirestore(getApp());

const ChatScreen: React.FC = () => {
    const [users, setUsers] = useState<UserProfileType[]>([]);
    const navigation = useNavigation<ChatScreenNavigationProp>();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [filteredUsers, setFilteredUsers] = useState<UserProfileType[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const getUserData = async () => {
            try {
                const MMKVuserId = getItem("USERUID");
                let myUserId = MMKVuserId || null;

                if (!MMKVuserId) {
                    const myAccount = await AsyncStorage.getItem("userProfile");
                    const parsedAccount = JSON.parse(myAccount);
                    myUserId = parsedAccount?.userId;
                }
                if (!myUserId) return;
                setUserId(myUserId);

                const userQuery = query(collection(db, "usersProfiles"), where("userId", "!=", myUserId));
                const allUsers = await getDocs(userQuery);
                const fetchedUsers: UserProfileType[] = allUsers.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as UserProfileType),
                }))

                setUsers(fetchedUsers);
                setFilteredUsers(fetchedUsers);
            } catch (error: any) {
                console.log("Error: ", error);
            } finally {
                setLoading(false);
            }
        };
        getUserData();
    }, []);

    // Function to handle search input
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredUsers(users); // Show all users if search is empty
        } else {
            const filtered = users.filter((user) =>
                user?.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    };


    const renderItem = useCallback(({ item }: { item: UserProfileType }) => (
        <MemoizedRenderItem item={item} userId={userId} navigation={navigation} />
    ), [userId, navigation]);

    return (
        <View style={styles.mainContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.appnameText}>eternalvows chats</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchInputContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor={"gray"}
                    cursorColor={"#ff008c"}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <Pressable style={({ pressed }) => [styles.searchIcon,{ opacity: pressed ? 0.5 : 1 }]} onPress={()=>handleSearch(searchQuery)}>
                    <Ionicons name="search" size={28} color="#fff" />
                </Pressable>
            </View>

            {loading ?
                (<BubbleLoading />)
                : (
                    <FlatList
                        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
                        data={filteredUsers}
                        renderItem={renderItem} // Use a separate memoized function
                        initialNumToRender={10} // Render only 10 items initially
                        maxToRenderPerBatch={10} // Load 10 at a time
                        windowSize={5} // Keep only a few items in memory
                        removeClippedSubviews={true} // Remove items not visible on screen
                    />
                )
            }

        </View>
    )
}

export default ChatScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    headerContainer: {
        width: "100%",
        height: 60,
        backgroundColor: "#fff",
        elevation: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    appnameText: {
        fontSize: 22,
        fontWeight: "600",
        color: "#ff008c",
        textShadowColor: 'rgba(0, 0, 0, 0.32)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
    },
    userItem: {
        width: Dimensions.get("window").width - 50,
        alignSelf: "center",
        marginTop: 20,
        flexDirection: "row",
        height: 60,
        borderWidth: 0.5,
        borderColor: "#ff008c",
        borderRadius: 10,
        alignItems: "center"
    },
    userIcon: {
        height: 50,
        width: 50,
        alignSelf: "center",
        left: 10,
        borderRadius: 25,
        elevation: 5,
        borderColor: "#ff008c",
        borderWidth: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: "500",
        color: "#4e4f4f",
        marginLeft: 20,
    },
    searchInputContainer: {
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "#ff008c",
        paddingHorizontal: 10,
        width: "90%",
        alignSelf: "center",
        marginVertical: 10,
        position: "relative",
        marginTop:20,
    },
    searchInput: {
        color:"#ff008c",
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
        paddingRight: 40, // 🔥 Ensures text does not overlap the icon
    },
    searchIcon: {
        position: "absolute",
        right: 0,
        backgroundColor: "#ff008c",
        borderRadius: 30,
        padding: 10,
    },
})