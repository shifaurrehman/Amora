import React, { useEffect, useState } from "react";
import {View,Text,StyleSheet,Image,ScrollView,TouchableOpacity} from "react-native";
import { User, Users } from "../../dummydata/Users";
import { getprofileImagePath } from "../../utils/profileImage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { getItem, removeItem } from "../../utils/MMKV_STORAGE/mmkvStorage";
import { getApp } from "@react-native-firebase/app";
import { collection, getDocs, getFirestore, query, where } from "@react-native-firebase/firestore";
import BubbleLoading from "../Animations/BubbleAnimation";

type UserProfileProps = {
  user?: User
}

const app = getApp();
const db = getFirestore(app);

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [ProfileImageLocal, setProfileImageLocal] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();



  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try{
        const localStorageData = await AsyncStorage.getItem("userProfile");
        const uid = getItem("USERUID");

        if (!uid) {
          setLoading(false);
          return;
        }

        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          
          // Check if the userId in local storage matches the UID from MMKV
          if (parsedData?.userId === uid) {
            setProfileData(parsedData);
            setLoading(false);
            return;
          }
            await AsyncStorage.removeItem("userProfile"); // Remove the old data
        }
        const userDoc = collection(db, "usersProfiles");
        const q = query(userDoc, where("userId", "==", uid));
        const querySnapshot = await getDocs(q);
        
        if(!querySnapshot.empty){
          const userData = querySnapshot.docs[0].data();
          await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
          setProfileData(userData);
        }else{
          console.log("No user data found in firestore");
        }
      }catch (error){
        console.log("Error in fetchUserData", error);
      }finally{
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);


  useEffect(() => {
    const fetchProfileImage = async () => {
      const profileName = "profile_authentication1.jpg";
      const profileImagePath = await getprofileImagePath(profileName);

      if (profileImagePath) {
        console.log("Image fetched from local storage.");
        setProfileImageLocal(`file://${profileImagePath}`);
      }
    };

    fetchProfileImage();
  }, []); // Runs only once 

  const logOut = async () => {
    await AsyncStorage.removeItem("userProfile");
    removeItem("UserToken");
    navigation.navigate("Login");
  }


  return (
    <>
      {!loading ?
        (
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Image source={ProfileImageLocal ? { uri: ProfileImageLocal } : { uri: profileData?.profileImage?.uri }} resizeMode="stretch" style={styles.profileImage} />
              <Text style={styles.nameText}>{profileData?.name}, {profileData?.age}</Text>
              <Text style={styles.subText}>{profileData?.city}</Text>
            </View>

            {/* Quick Stats Section */}
            <View style={styles.quickStatsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileData?.height} cm</Text>
                <Text style={styles.statLabel}>Height</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileData?.weight} kg</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileData?.maritalStatus}</Text>
                <Text style={styles.statLabel}>Marital Status</Text>
              </View>
            </View>

            {/* About Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <Text style={styles.sectionText}>{profileData?.about}</Text>
            </View>

            {/* Additional Details */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>💼</Text>
                  <Text style={styles.detailText}>Profession: {profileData?.profession}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🎓</Text>
                  <Text style={styles.detailText}>Education: {profileData?.education}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🕌</Text>
                  <Text style={styles.detailText}>Religion: {profileData?.religion}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🧭</Text>
                  <Text style={styles.detailText}>Sect: {profileData?.sect}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🌍</Text>
                  <Text style={styles.detailText}>Languages: {profileData?.languages?.map((lang) => lang?.name).join(", ")}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>Location: {profileData?.city}</Text>
                </View>
              </View>
            </View>


            {/* Interests Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {profileData && profileData?.hobbies?.split(',').map((hobby, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text key={index} style={styles.interestText}>{hobby?.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Gallery Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {profileData?.extraimages?.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img?.uri }}
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.connectButton} onPress={() => logOut()}>
              <Text style={styles.connectButtonText}>Log out</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <BubbleLoading />
        )
      }
    </>
  );

};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 15,
  },
  NoUserContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  NoUserText: {
    fontSize: 20,
    color: '#333',
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    fontSize: 16,
    color: "#555",
  },
  quickStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#777",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionText: {
    textAlign: "justify",
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestTag: {
    backgroundColor: "#ff008c",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  interestText: {
    color: "#fff",
    fontSize: 14,
    letterSpacing: 1,
  },
  galleryImage: {
    width: 150,
    height: 200,
    borderRadius: 10,
    marginRight: 15,
  },
  connectButton: {
    backgroundColor: "#ff008c",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 30
  },
  connectButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    fontSize: 18,
    color: '#ff008c',
    marginRight: 10,
  },

});

export default UserProfile;
