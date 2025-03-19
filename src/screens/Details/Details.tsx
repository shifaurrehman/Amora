import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Users } from '../../dummydata/Users';
import { RootStackParamList } from '../../navigation/Types';

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
  about: string,
  age: string,
  city: string;
  createdAt: string;
  dateOfBirth: string;
  education: string;
  employmentStatus: string;
  extraimages: ImageType[];
  gender: string;
  height: string;
  hobbies: string;
  id: string;
  languages: languageType[];
  maritalStatus: string;
  name: string;
  profession: string;
  profileImage: ImageType;
  religion: string;
  sect: string;
  userId: string;
  weight: string;
}

// Define types for navigation stack
// type RootStackParamList = {
//   Details: { item: FireBaseUsers };
// };

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Details'>;


const Details: React.FC = () => {
  const route = useRoute<DetailsScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { item } = route.params;

  const defaultDistance = Users[Math.floor(Math.random() * Users.length)].distance;

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.5 : 1 }]}>
        <Ionicons name="arrow-back" size={28} color="white" />
      </Pressable>

      {/* User Image */}
      <Image source={{ uri: item.profileImage?.uri }} style={styles.profileImage} />

      {/* Name, Age, Occupation */}
      <Text style={styles.name}>{item.name}, {item.age}</Text>
      <Text style={styles.occupation}>{item.profession} - {item.city}</Text>
      <Text style={styles.distance}>{defaultDistance}</Text>
      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>{item?.about}</Text>
      </View>

      {/* Interests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsContainer}>
          {(typeof item.hobbies === 'string' ? item.hobbies.split(',') : [])
            .map((interest, index) => (
              <LinearGradient key={index} colors={['#ff008c', '#ff4da6']} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest.trim()}</Text>
              </LinearGradient>
            ))}
        </View>
      </View>

      {/* additional details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.infoText}>🕌 Religion: {item.religion} ({item.sect})</Text>
        <Text style={styles.infoText}>🎓 Education: {item.education}</Text>
        <Text style={styles.infoText}>📏 Height: {item.height} cm | ⚖️ Weight: {item.weight} kg</Text>
        <Text style={styles.infoText}>💼 Employment: {item.employmentStatus}</Text>
        <Text style={styles.infoText}>💙Marital Status: {item.maritalStatus}</Text>
      </View>

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={[styles.interestsContainer, { backgroundColor: "transparent" }]}>
          {item?.languages?.map((lang, index) => (
            <LinearGradient key={index} colors={['#ff008c', '#ff4da6']} style={[styles.interestTag, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.interestText, { backgroundColor: "transparent" }]}>{lang.name}</Text>
            </LinearGradient>
          ))}
        </View>
      </View>

      {/* Image Carousel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gallery</Text>
        <FlatList
          data={item.extraimages}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={styles.carouselImage} resizeMode='stretch' />
          )}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
    </ScrollView>
  );
};

export default Details;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e', // Dark background
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,0,140,0.9)', // Semi-transparent white
    padding: 8,
    borderRadius: 30,
  },
  profileImage: {
    width: '100%',
    height: 400,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    textAlign: 'center',
    marginTop: 10,
  },
  occupation: {
    fontSize: 16,
    color: '#d1d1d6', // Light gray text
    textAlign: 'center',
    marginVertical: 4,
  },
  distance: {
    fontSize: 14,
    color: '#ff9500', // Accent color (orange)
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff', // White text
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 16,
    color: '#d1d1d6', // Light gray text
    textAlign: 'justify',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ff9500', // Accent color (orange)
  },
  interestText: {
    color: '#ffffff', // White text
    fontSize: 14,
  },
  infoText: {
    fontSize: 16,
    color: '#d1d1d6', // Light gray text
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#2c2c2e', // Darker background for stats
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff', // White text
  },
  statLabel: {
    fontSize: 14,
    color: '#d1d1d6', // Light gray text
  },
  carouselImage: {
    width: 200,
    height: 250,
    borderRadius: 12,
    marginRight: 10,
  },
});
