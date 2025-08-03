import { View, StyleSheet, FlatList, ListRenderItemInfo, Text, RefreshControl } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
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
  const [refreshing, setRefreshing] = useState(false);
  console.log("🏠 Home component rendered");

  const ITEM_HEIGHT = 230; // Height of each item in pixels


  const { profiles, loading } = useSelector((state: RootState) => state.filteredUsers);

  useEffect(() => {
    dispatch(fetchUsersRequest());
  }, [dispatch])

  const onRefresh = async () => {
    setRefreshing(true);
    dispatch(fetchUsersRequest());
    setTimeout(() => setRefreshing(false), 1000); // Prevent infinite loading
  };

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
          keyExtractor={(item) => item?.userId || item.id || Math.random().toString()} // Ensure a stable key
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          refreshing={refreshing}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff008c']} 
              tintColor="#ff008c"
              title="Refreshing..."
              titleColor="#ff008c"
            />
          }        
          showsVerticalScrollIndicator={false}
          initialScrollIndex={0}
        />
      ) : (
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
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
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