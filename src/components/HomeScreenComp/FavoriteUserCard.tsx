import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { User } from '../../dummydata/Users';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


interface FavoriteUserCardProps {
    user: User;
    onRemoveFavorite: (userId: number) => void;
}

type RootStackParamList = {
    Details: { item: User };
}

const FavoriteUserCard: React.FC<FavoriteUserCardProps> = ({ user, onRemoveFavorite }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Details'>>();
    const handleRemoveFavorite = () => {
        onRemoveFavorite(user.id);
    };

    const moveToDetails = () => {
        navigation.navigate("Details", { item: user });
    }

    return (
        <View style={styles.mainCard}>
            <Pressable onPress={moveToDetails}>
                <Image
                    source={{ uri: user?.profileImage?.uri }}
                    style={styles.imageStyle}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.detailsContainer}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.userName}>
                                {user.name},
                            </Text>
                            <Text style={styles.userAge}>
                                {user.age}
                            </Text>
                        </View>

                        {/* Optional fields */}
                        {user.occupation && (
                            <Text style={styles.occupation}>{user.occupation}</Text>
                        )}

                        {user.location && (
                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={20} color="#ff008c" />
                                <Text style={styles.locationText}>{user.location}</Text>
                            </View>
                        )}

                        {user.distance && (
                            <View style={styles.distance}>
                                <Text style={styles.distanceText}>{user.distance}</Text>
                            </View>
                        )}

                        {user.about && (
                            <Text style={styles.aboutText}>{user.about}</Text>
                        )}

                        {user.interests && user.interests.length > 0 && (
                            <View style={styles.interestsContainer}>
                                {user.interests.slice(0, 3).map((interest, index) => (
                                    <View key={index} style={styles.interestBadge}>
                                        <Text style={styles.interestText}>{interest}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                    </View>
                </LinearGradient>
            </Pressable>

            {/* Remove icon */}
            <Pressable style={styles.removeButton} onPress={handleRemoveFavorite}>
                <Text style={styles.removeText}>Remove</Text>
            </Pressable>
        </View>
    );
};

export default FavoriteUserCard;

const styles = StyleSheet.create({
    mainCard: {
        width: '90%',
        marginHorizontal: '5%',
        height: 350,
        elevation: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 10,
    },
    imageStyle: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: "#ff008c",
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 12,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'left',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    occupation: {
        fontSize: 16,
        textAlign: 'left',
        color: '#fff',
        paddingHorizontal: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    locationText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 0,
    },
    detailsContainer: {
        width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 10,
        position: 'absolute',
        bottom: 0,
    },
    distance: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 50,
        overflow: 'hidden',
        paddingHorizontal: 6,
        paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    distanceText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '400',
    },
    aboutText: {
        color: '#fff',
        fontSize: 14,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    removeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff"
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    interestBadge: {
        backgroundColor: '#ff008c',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 5, // Adds spacing between badges
        marginBottom: 5,
    },
    interestText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    nameContainer:{
        flexDirection:"row",
    },
    userAge:{
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'left',
        color: 'orange',
        paddingVertical: 6,
    }
});