import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Users } from '../../dummydata/Users';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { addFavorites, removeFavorite } from '../../redux/favoriteSlice';
import { RootStackParamList } from '../../navigation/Types';
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';


interface ImageType {
    uri: string;
    type: string;
    fileName: string;
}

interface languageType {
    id: number;  // ✅ Change from string to number
    name: string;
}

interface FireBaseUsers {
    id: string,
    name: string,
    age: string;
    gender: string;
    profession: string;
    education: string;
    height: string;
    weight: string;
    languages: languageType[];
    hobbies: string;
    religion: string;
    sect: string;
    city: string;
    employmentStatus: string;
    maritalStatus: string;
    uri:string;
    extraImages: ImageType[] | null;
    profileImage: ImageType | null;
    dateOfBirth: string | undefined;
}

// type RootStackParamList = {
//     Details: { item: FireBaseUsers };
// }

interface UserCardProps {
    item: UserProfileType;
}



const UserCard: React.FC<UserCardProps> = ({ item }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Details'>>();
    const dispatch = useDispatch();

    const favorites = useSelector((state: RootState) => state.favorites.favorites);

    const isFavorite = useMemo(() => favorites.some(user => user.id === item.id),[favorites,item.id]);

    const handleToggleFavorites = () => {
       dispatch(isFavorite ? removeFavorite(item?.id) : addFavorites(item))
    }

    // Early return if `item` is not provided (though it shouldn't happen if props are valid)
    if (!item) return null;

    const randomUserIndex = Math.floor(Math.random() * Users.length);
    const defaultDistance = Users[randomUserIndex]?.distance; 

    const handleDetails = () => {
        navigation.navigate("Details", { item });
    }
    return (
        <View style={styles.mainCard}>
            <Pressable onPress={handleDetails}>
                <Image
                    source={item.profileImage?{uri: item?.profileImage?.uri}:{uri:item.uri}} 
                    style={styles.imageStyle}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.detailsContainer}>
                        {/* Conditionally render distance if it exists */}
                        {defaultDistance && (
                        <View style={styles.distance}>
                            <Text style={styles.distanceText}>{defaultDistance}</Text>
                        </View>
                    )}

                        <Text style={styles.userName}>
                            {item.name}, {item.age}
                        </Text>
                        {/* Conditionally render occupation if it exists and trim long occupation */}
                        {item.profession && (
                            <Text style={styles.occupation}>
                                {item.profession.length > 15
                                    ? item.profession.slice(0, 15) + "..."
                                    : item.profession}
                            </Text>
                        )}
                    </View>
                </LinearGradient>
                <Pressable style={styles.faouriteIcon} onPress={(event) => { event.stopPropagation(); handleToggleFavorites(); }} >
                    <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={40} color={isFavorite ? "#ff008c" : "#ff008c"} />
                </Pressable>
            </Pressable>
        </View>
    );
};

export default React.memo(UserCard);

const styles = StyleSheet.create({
    mainCard: {
        width: 170,
        height: 230,
        elevation: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        margin: 10,
    },
    imageStyle: {
        width: '100%',
        height: '100%',
    },
    faouriteIcon: {
        position: "absolute",
        top: 15,
        right: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'left', // ✅ FIXED
        paddingHorizontal: 8,
        paddingVertical: 6,
        color: '#fff',
    },
    occupation: {
        fontSize: 16,
        textAlign: 'left', // ✅ FIXED
        color: '#fff',
        paddingHorizontal: 8,
    },
    detailsContainer: {
        width: "100%",
        paddingHorizontal: 10,
        paddingVertical: 10,
        position: "absolute",
        bottom: 0,
    },
    distance: {
        backgroundColor: "rgba(0, 0, 0, 0.7)", // ✅ FIXED HEX ISSUE
        borderRadius: 50,
        overflow: "hidden",
        paddingHorizontal: 6,
        paddingVertical: 3,
        alignSelf: "flex-start",
    },
    distanceText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "400",
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
});
