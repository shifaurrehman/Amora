import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Home from '../../screens/Home/Home';
import FavoritesScreen from '../../screens/Favorites/FavoritesScreen';


const Tab = createMaterialTopTabNavigator();

const TopNavigation = () => {
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor: '#ff008c', 
      tabBarInactiveTintColor: '#555', 
      tabBarIndicatorStyle: { backgroundColor: '#ff008c' },
      tabBarStyle: { backgroundColor: '#fff' }, 
      tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
    }}>
      <Tab.Screen name='Home' component={Home} />
      <Tab.Screen name='Favorites' component={FavoritesScreen} />
    </Tab.Navigator>
  )
}

export default TopNavigation