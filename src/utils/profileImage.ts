import AsyncStorage from "@react-native-async-storage/async-storage"
import RNFS from 'react-native-fs';

export const saveProfileImagePath = async (key: string, path: string) => {
    try {
        await AsyncStorage.setItem(key, path);
        console.log("✅ Image path saved in AsyncStorage:", path);
    } catch (error) {
        console.error("❌ Error saving image path:", error);
    }
}


export const getprofileImagePath = async (key: string) => {
    try {
        const path = await AsyncStorage.getItem(key);
        return path;
    } catch (error) {
        console.error("❌ Error getting image path:", error);
        return null;
    }
}


export const saveProfileImageToFile = async (ImageUri: string, fileName: string) => {
    try {
        const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

        await RNFS.copyFile(ImageUri, destPath);

        console.log("✅ Image saved at:", destPath);

        saveProfileImagePath(fileName, destPath);

        return destPath.toString();
    } catch (error) {
        console.log("❌ error saving image", error);
        return null;
    }
}



