
import { getApp } from '@react-native-firebase/app'
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore'
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';

const app = getApp()
const db = getFirestore(app);

export const fetchFilteredProfiles = async (ageRange: number[], religion: string, gender: string)
  : Promise<UserProfileType[]> => {

  console.log("fetching start filtered users...");

  try {
    // Fetch all data
    const snapshot = await getDocs(collection(db, 'usersProfiles'));

    // Convert Firestore documents to an array
    const allProfiles = snapshot.docs.map(doc => doc.data());

    // Filter data manually on client side
    const filteredProfiles = allProfiles.filter(profile => {
      const isWithinAgeRange = ageRange ?  profile.age >= ageRange[0] && profile.age <= ageRange[1] : true;
      const isMatchingGender = gender ? profile.gender === gender : true;
      const isMatchingReligion = religion ? profile.religion === religion : true; 
      return isWithinAgeRange && isMatchingGender && isMatchingReligion;
    });
    return filteredProfiles;

  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }

}