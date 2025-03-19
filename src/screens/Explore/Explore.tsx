import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface User {
  id: number;
  name: string;
  image: string;  // URL or path to profile image
}

const Users: User[] = [
  { id: 1, name: 'John Doe', image: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 2, name: 'Jane Smith', image: 'https://randomuser.me/api/portraits/women/1.jpg' },
  { id: 3, name: 'Sam Wilson', image: 'https://randomuser.me/api/portraits/men/2.jpg' },
  // Add more users here
];

const Explore: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = () => {
    setIsSearching(true);
    if (searchQuery.length > 2) {
      setTimeout(() => {
        const filtered = Users.filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
        setIsSearching(false);
      }, 300);
    } else {
      setIsSearching(false);
      setFilteredUsers([]); // Reset if search term is too short
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleSearch, 300);
    } else {
      setIsSearching(false);
      setFilteredUsers([]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <Image source={{ uri: item.image }} style={styles.profileImage} />
      <Text style={styles.userName}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={24} color="#ff008c" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for profiles..."
          placeholderTextColor="#868687"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Search Status */}
      {isSearching && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ff008c" />
          <Text style={styles.messageText}>Searching...</Text>
        </View>
      )}

      {/* No results or No search term */}
      {!isSearching && searchQuery.length > 0 && searchQuery.length < 3 && (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>Please enter at least 3 characters to search</Text>
        </View>
      )}

      {/* No results found */}
      {!isSearching && searchQuery.length >= 3 && filteredUsers.length === 0 && (
        <View style={styles.centerContainer}>
          <Icon name="search-outline" size={50} color="#9d9d9e" />
          <Text style={styles.messageText}>No results found</Text>
        </View>
      )}

      {/* Search Results */}
      {!isSearching && filteredUsers.length > 0 && (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#9d9d9e',
    marginTop: 10,
    fontWeight: '600',
  },
  resultsContainer: {
    paddingBottom: 100, // Ensure content is not clipped by the bottom
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default Explore;
