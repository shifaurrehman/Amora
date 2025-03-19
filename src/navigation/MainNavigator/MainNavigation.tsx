import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from '../StackNavigator/StackNavigation'; // Ensure this is correctly imported

// Define the MainNavigation component
const MainNavigation: React.FC = () => {

  return (
    <NavigationContainer>
      <StackNavigation />
    </NavigationContainer>
  );
};

export default MainNavigation;