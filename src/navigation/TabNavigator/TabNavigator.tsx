import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Profile from '../../screens/Profile/Profile';
import { Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootTabParamList } from '../Types';
import TopNavigation from '../TopNavigator/TopNavigation';
import ChatScreen from '../../screens/Chat/ChatScreen';
import Filters from '../../components/HeaderFilterIcon/Filters';
import IconNavigation from '../../screens/Home/IconNavigation';

// Type for the Tab navigator
const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator: React.FC = () => {

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#ff008c',
          tabBarInactiveTintColor: '#ccc',
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: '#ff008c',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.5,
            elevation: 5,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#fff',
          },
          headerLeft: () => (
            <IconNavigation />
          ),
        }}

      >
        {/* Home Screen with Settings Icon */}
        <Tab.Screen
          name="Dashboard"
          component={TopNavigation}
          options={{
            headerShown: true,
            title: 'EternalVows',
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require('../../assets/images/home2.png')
                    : require('../../assets/images/home.png')
                }
                style={[styles.homeIcon, { tintColor: focused ? '#ff008c' : '#ff008c', }]}
              />
            ),
            headerRight: () => (
              <Filters />
            )

          }}
        />

        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require('../../assets/images/chat2.png')
                    : require('../../assets/images/chat1.png')
                }
                style={[styles.chatIcon, { tintColor: focused ? '#ff008c' : '#ff008c' }]}
              />
            ),
          }}
        />

        {/* Profile Screen */}
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require('../../assets/images/user2.png')
                    : require('../../assets/images/user.png')
                }
                style={[styles.userIcon, { tintColor: focused ? '#ff008c' : '#ff008c' }]}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  userIcon: {
    width: 25,
    height: 25,
    marginTop: 5,
  },
  chatIcon: {
    width: 30,
    height: 30,
    marginTop: 5,
  },
  homeIcon: {
    width: 25,
    height: 25,
    marginTop: 5,
  }
})