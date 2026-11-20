import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../redux/store';
import { loadFavorites, toggleFavorite } from '../../redux/favoriteThunks';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FavoriteUserCard from '../../components/HomeScreenComp/FavoriteUserCard';
import { useNavigation } from '@react-navigation/native';
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import BubbleLoading from '../Animations/BubbleAnimation';

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();

  const { favorites, loading } = useSelector((state: RootState) => state.favorites);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  const handleRemoveFavorite = (user: UserProfileType) => {
    dispatch(toggleFavorite(user));
  };

  const renderItem = ({ item }: { item: UserProfileType }) => (
    <FavoriteUserCard user={item} onRemoveFavorite={handleRemoveFavorite} />
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <BubbleLoading />
      ) : (!favorites || favorites.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={80} color="#ff008c" />
          <Text style={styles.emptyText}>No favorites yet! Start exploring.</Text>
          <Pressable style={styles.exploreButton}>
            <Text onPress={()=>navigation.navigate("Home")} style={styles.exploreText}>Explore Profiles</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item?.userId || item?.id || ''}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    padding: 16,
  },
  list: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
  exploreButton: {
    marginTop: 15,
    backgroundColor: '#ff008c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  exploreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FavoritesScreen;
