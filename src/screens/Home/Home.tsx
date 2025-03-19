import { View, StyleSheet, FlatList, ListRenderItemInfo, Text } from 'react-native';
import React, { useCallback, useEffect } from 'react';
import UserCard from '../../components/HomeScreenComp/UserCard';
import { getFirestore } from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import ShimmerUserCard from '../../components/HomeScreenComp/ShimmerUserCard';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { fetchUsersRequest } from '../../redux/FilteredUsersSlice';

//**** 🔥 INITIALIZE FIRESTORE ONLY ONCE  ****\\
const db = getFirestore(getApp());

const Home: React.FC = () => {
  const dispatch = useDispatch();
  console.log("🏠 Home component rendered");

  const { profiles, loading } = useSelector((state: RootState) => state.filteredUsers);

  useEffect(() => {
    dispatch(fetchUsersRequest());
  }, [dispatch])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<UserProfileType>) => {
    return <UserCard item={item} />
  }, []);

  const renderDummyItems = useCallback(() => {
    return <ShimmerUserCard />
  }, []);
  return (
    <View style={styles.mainContainer}>
      {loading ? (
        <FlatList
          data={[1, 1, 1, 1, 1, 1]}
          renderItem={renderDummyItems}
          keyExtractor={(_, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
        />
      ) : profiles.length > 0 ? (
        <FlatList
          data={profiles}
          renderItem={renderItem}
          keyExtractor={(item) => item?.userId || item.id || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
        />
      ) : (
        // 🔥 Only show "No Users Found" if loading is false and API call has completed
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Results not found</Text>
        </View>
      )}
    </View>
  );
}

export default React.memo(Home);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "#fff",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  LoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff"
  },
  notFoundText: {
    fontSize: 20,
    color: "#ccc",
  }
});
