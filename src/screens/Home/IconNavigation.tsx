import { View, Text, Pressable, Image, StyleSheet } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';

const IconNavigation = () => {
    return (
        <Pressable style={styles.menuIcon}>
            <Image source={require("../../assets/images/menus.png")} style={{ width: 30, height: 30 }} tintColor={"#fff"} />
        </Pressable>
    )
}

export default IconNavigation

const styles = StyleSheet.create({
    menuIcon: {
        marginLeft: 12,
        marginRight: 12,
    }
})