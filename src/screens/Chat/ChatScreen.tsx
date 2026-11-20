import { View, Text, StyleSheet, FlatList, Dimensions, Image, TextInput, Pressable, TouchableOpacity } from 'react-native'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/Types'
import BubbleLoading from '../Animations/BubbleAnimation'
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { getCurrentUserId } from '../../services/supabase/session';
import { fetchVisibleProfiles } from '../../services/supabase/profiles';

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

const ChatScreen: React.FC = () => {
    const [users, setUsers] = useState<UserProfileType[]>([]);
    const navigation = useNavigation<ChatScreenNavigationProp>();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<UserProfileType[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const getUserData = async () => {
            try {
                setLoadError(null);
                let myUserId: string | null = null;
                try {
                    myUserId = await getCurrentUserId();
                } catch (sessionError: any) {
                    console.log("Session error: ", sessionError);
                }
                if (!myUserId) return;
                setUserId(myUserId);

                // RLS returns discoverable profiles; exclude our own profile.
                const fetchedUsers = await fetchVisibleProfiles({ excludeUserId: myUserId });

                setUsers(fetchedUsers);
                setFilteredUsers(fetchedUsers);
            } catch (error: any) {
                console.log("Error: ", error);
                setLoadError(error instanceof Error ? error.message : 'Failed to load chats.');
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
                user?.name?.toLowerCase().includes(query.toLowerCase())
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
                : loadError ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{loadError}</Text>
                    </View>
                ) : (
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        color: '#ff008c',
        fontSize: 16,
        textAlign: 'center',
    },
})
