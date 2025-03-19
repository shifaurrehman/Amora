import { View, StyleSheet } from 'react-native';
import React from 'react';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const ShimmerUserCard: React.FC = () => {
  return (
    <View style={styles.mainCard}>
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.imageStyle}
      />

      <View style={styles.detailsContainer}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.distancePlaceholder}
        />

        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.textPlaceholder}
        />

        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.occupationPlaceholder}
        />
      </View>

      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.favoriteIconPlaceholder}
      />
    </View>
  );
};

export default ShimmerUserCard;

const styles = StyleSheet.create({
  mainCard: {
    width: '45%',
    height: 230,
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 10,
  },
  imageStyle: {
    width: '100%',
    height: '70%',
    borderRadius: 8,
  },
  detailsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  distancePlaceholder: {
    width: 80,
    height: 14,
    marginBottom: 5,
    borderRadius: 10,
    elevation:2,
  },
  textPlaceholder: {
    width: '60%',
    height: 14,
    marginBottom: 5,
    borderRadius: 10,
    elevation:2,
  },
  occupationPlaceholder: {
    width: '50%',
    height: 14,
    borderRadius: 10,
    elevation:2,
  },
  favoriteIconPlaceholder: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    elevation: 5,
  },
});
