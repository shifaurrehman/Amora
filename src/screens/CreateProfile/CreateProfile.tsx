import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Alert, Image, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/Types';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthenticationButton from '../../components/Button/AuthenticationButton';
import DropdownSelector from '../../components/Dropdown/CreateProfile/DropdownSelector';
import dummylanguages, { dummycities, dummydataforreligions, dummyeducationLevels, dummyemploymentStatus, dummymaritalStatus, dummyprofessions, islamicSects, genderOptions } from './dummydata';
import { getApp } from '@react-native-firebase/app';
import { addDoc, collection, getFirestore } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { getprofileImagePath, saveProfileImageToFile } from '../../utils/profileImage';
import MultiSelectDropdown from '../../components/Dropdown/CreateProfile/MultiSelect';
import CameraRoll from "@react-native-camera-roll/camera-roll";
import { uploadProfileImage } from '../../utils/UploadImages';
import { useRoute } from '@react-navigation/native';
import { PermissionsAndroid, } from "react-native";

interface ImageType {
    uri: string;
    type: string;
    fileName: string;
}


interface languageType {
    id: number;
    name: string;
}

interface ProfileTypes {
    name: string,
    age: string;
    gender: string;
    profession: string;
    education: string;
    height: string;
    weight: string;
    languages: languageType[];
    hobbies: string;
    religion: string;
    sect: string;
    city: string;
    employmentStatus: string;
    maritalStatus: string;
    extraImages: ImageType[];
    profileImage: ImageType | null;
    dateOfBirth: string | undefined;
    about: string;
}

type CreateProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateProfile">;

const CreateProfile: React.FC<{ navigation: CreateProfileScreenNavigationProp }> = ({ navigation }) => {

    const route = useRoute();
    const { uid } = route.params as any;

    const [isloading, setLoading] = useState<boolean>(false);

    const [profile, setProfile] = useState<ProfileTypes>({
        name: '',
        age: '',
        gender: '',
        profession: '',
        education: '',
        height: '',
        weight: '',
        languages: [],
        hobbies: '',
        religion: '',
        sect: '',
        city: '',
        employmentStatus: '',
        maritalStatus: '',
        extraImages: [],
        profileImage: null,
        dateOfBirth: '',
        about: '',
    })


    const [showPicker, setShowPicker] = useState<boolean>(false);

    const handleInputChange = (field: keyof ProfileTypes, value: any) => {
        setProfile((prevProfile) => ({
            ...prevProfile,
            [field]: value,
        }));
    };

    const onChange = (event: any, selectedDate: Date | undefined) => {
        setShowPicker(false);
        if (selectedDate) {
            setProfile((prevProfile) => ({
                ...prevProfile,
                dateOfBirth: selectedDate.toISOString().split("T")[0],  // Store only YYYY-MM-DD
            }));
        }
    };

    const showDatePicker = () => {
        setShowPicker(true);
    };

    const pickImage = useCallback(async () => {
        const response = await launchImageLibrary({ mediaType: 'photo' });

        if (response.assets && response.assets.length > 0) {
            const selectedImage = response.assets[0];

            console.log("Profile Image Picked:", selectedImage.uri);


            // Update state with the selected image
            setProfile(prevProfile => ({
                ...prevProfile,
                profileImage: {
                    uri: selectedImage.uri,
                    type: selectedImage.type || "image/jpeg",
                    fileName: selectedImage.fileName || `profile-${Date.now()}.jpg`
                } as ImageType,
            }));
        }
    }, []);

    const pickExtraImages = async () => {
        try {
            const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 3 });

            if (response.assets && response.assets.length > 0) {
                const newImages = response.assets.slice(0, 3 - profile.extraImages.length);
                const selectedImages: ImageType[] = newImages.map((image) => ({
                    uri: image.uri!,
                    type: image.type || "image/jpeg",
                    fileName: image.fileName || `image-${Date.now()}.jpg`
                }))

                setProfile((prevProfile) => ({
                    ...prevProfile,
                    extraImages: [...prevProfile.extraImages, ...selectedImages],
                }));

            }
        } catch (error) {
            console.error("Image picker error: ", error);
        }
    };

    const renderImageItem = ({ item }: { item: { uri: string } }) => {
        return <Image source={{ uri: item.uri }} style={styles.profileImage} />;
    };

    async function requestStoragePermission() {
        if (Platform.OS === "android") {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: "Storage Permission Required",
                    message: "App needs access to your storage to save images",
                    buttonPositive: "OK",
                }
            );
    
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // iOS does not require extra permissions
    }


    const saveProfile = async () => {
        setLoading(true);
        if (
            !profile.name ||
            !profile.age ||
            !profile.city ||
            !profile.profession ||
            !profile.education ||
            !profile.height ||
            !profile.employmentStatus ||
            !profile.maritalStatus ||
            !profile.religion ||
            !profile.dateOfBirth ||
            !profile.gender ||
            !profile.weight ||
            !profile.hobbies
        ) {
            setLoading(false);
            Alert.alert("Error", "Please fill in all required fields and select a profile image");
            return;
        }
        try {
            const userId = uid;
            let uploadedImageUrl = profile.profileImage?.uri; // Keep existing image if already uploaded

            // 🔹 If the image is local, upload it first
            if (profile.profileImage && !profile.profileImage.uri.startsWith("http")) {
                console.log("Uploading Profile Image...");
                uploadedImageUrl = await uploadProfileImage(profile.profileImage);

                if (!uploadedImageUrl) {
                    throw new Error("Image upload failed");
                }
                console.log("Image Uploaded Successfully:", uploadedImageUrl);

                // 🔹 Update the profile state
                setProfile((prevProfile) => ({
                    ...prevProfile,
                    profileImage: {
                        uri: uploadedImageUrl,
                        type: "image/jpeg",
                        fileName: "uploaded.jpg"
                    } as ImageType,
                }));
            }

            //  save 🙋‍♂️PROFILE_IMAGE in gallery
            if (profile.profileImage?.uri) {
                const ProfileImageUri = profile?.profileImage?.uri;
                const profileName = `profileImage_${userId}.jpg`;

                try {
                    // Get the previous image path
                    const previousImagePath = await getprofileImagePath(profileName);

                    // Delete the previous image file if exists
                    if (previousImagePath) {
                        await RNFS.unlink(previousImagePath);
                        console.log("🗑️ Previous image deleted:", previousImagePath);
                    }

                    // Save new image
                    const savedPath = await saveProfileImageToFile(ProfileImageUri, profileName);
                    console.log("New Profile image saved at:", savedPath);

                    // 🔹 Now save the image to phone's gallery under "EternalVows" folder
                    const galleryFolder = `${RNFS.PicturesDirectoryPath}/EternalVows`;
                    const galleryImagePath = `${galleryFolder}/${profileName}`;

                    // Ensure the folder exists
                    await RNFS.mkdir(galleryFolder);

                    // Copy the file to the gallery folder
                    if (savedPath) {
                        await RNFS.copyFile(savedPath, galleryImagePath);
                    } else {
                        console.error("Error: savedPath is null");
                    }

                    // Save the image in the device's gallery
                    // await CameraRoll.saveAsset(galleryImagePath, { type: "photo" });
                    const hasPermission = await requestStoragePermission();
                    if (hasPermission) {
                        await CameraRoll.save(galleryImagePath, { type: "photo" });
                    } else {
                        console.error("Permission Denied!");
                    }
                    

                    console.log("Image saved to gallery", galleryImagePath);

                } catch (error) {
                    console.error("Error handling image replacement:", error);
                }
            }

            // 🔹 Upload extra images if needed
            const newExtraImages: ImageType[] = [];

            for (const image of profile.extraImages) {
                if (!image.uri.startsWith("http")) {
                    console.log("Uploading extra image:", image.uri);
                    const uploadedExtraImageUrl = await uploadProfileImage(image);

                    if (uploadedExtraImageUrl) {
                        newExtraImages.push({
                            uri: uploadedExtraImageUrl,
                            type: "image/jpeg",
                            fileName: `extra-${Date.now()}.jpg`,
                        });
                    } else {
                        console.error("❌ Image upload failed for:", image.uri);
                    }
                } else {
                    newExtraImages.push(image); // Keep already uploaded images
                }
            }

            // ✅ Use newExtraImages directly in profileData (DO NOT use profile.extraImages)
            console.log("✅ Updated Extra Images:", newExtraImages);

            const db = getFirestore(getApp());

            const profileData = {
                userId: userId,
                name: profile.name,
                age: profile.age,
                gender: profile.gender,
                profession: profile.profession,
                education: profile.education,
                height: profile.height,
                weight: profile.weight,
                languages: profile.languages,
                hobbies: profile.hobbies,
                religion: profile.religion,
                sect: profile.sect,
                city: profile.city,
                about: profile.about,
                profileImage: uploadedImageUrl ? { uri: uploadedImageUrl, type: "image/jpeg", fileName: "uploaded.jpg" } : null,
                extraimages: newExtraImages,
                employmentStatus: profile.employmentStatus,
                maritalStatus: profile.maritalStatus,
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth : null,
                createdAt: new Date().toISOString(),
            };

            // Add profile data to Firestore
            const docRef = await addDoc(collection(db, 'usersProfiles'), profileData);
            console.log("Profile saved with ID:", docRef.id);

            // Save profile in asyncstorage
            await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));

            Alert.alert("Success", "Profile saved successfully!");
            navigation.navigate("Home");
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Error saving profile:", error);
            Alert.alert("Error", "Failed to save profile. Please try again.");
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
        >
            <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>

                <Text style={styles.title}>Create Profile</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={profile.name}
                    placeholderTextColor={"#c4c1c0"}
                    onChangeText={(value) => handleInputChange('name', value)}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Age"
                    keyboardType="numeric"
                    value={profile.age}
                    placeholderTextColor={"#c4c1c0"}
                    onChangeText={(value) => handleInputChange('age', value)}
                />


                <TextInput
                    style={styles.input}
                    placeholder="Height"
                    value={profile.height}
                    placeholderTextColor={"#c4c1c0"}
                    onChangeText={(value) => handleInputChange('height', value)}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Weight in kgs"
                    value={profile.weight}
                    placeholderTextColor={"#c4c1c0"}
                    onChangeText={(value) => handleInputChange('weight', value)}
                />

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Hobbies"
                    value={profile.hobbies}
                    placeholderTextColor={"#c4c1c0"}
                    onChangeText={(value) => handleInputChange('hobbies', value)}
                />

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Write something about yourself..."
                    value={profile.about}
                    placeholderTextColor={"#c4c1c0"}
                    onChangeText={(value) => handleInputChange('about', value)}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                />


                {/* Choose Your city */}
                <DropdownSelector
                    label="City"
                    //    items={cities} // original values
                    items={dummycities} // Use the dummy cities 
                    selectedItem={profile.city}
                    onSelect={(selectedcity) => handleInputChange("city", selectedcity)} // Update profile state
                    placeholder={"Select your City"}
                />

                {/* Choose Your religion */}
                <DropdownSelector
                    label="Religion"
                    //    items={religions} // original values
                    items={dummydataforreligions} // Use the dummy data 
                    selectedItem={profile.religion}
                    onSelect={(selectedreligion) => handleInputChange("religion", selectedreligion)} // Update profile state
                    placeholder={"Select your Religion"}
                />

                {/* Choose Your sect in your religion */}
                <DropdownSelector
                    label="Sect"
                    //    items={sects} // original values
                    items={islamicSects} // Use the dummy data 
                    selectedItem={profile.sect}
                    onSelect={(selectedsect) => handleInputChange("sect", selectedsect)} // Update profile state
                    placeholder={"Select your sects"}
                />


                {/* Choose Your employement status */}
                <DropdownSelector
                    label="Employement Status"
                    //    items={religions} // original values
                    items={dummyemploymentStatus} // Use the dummy data 
                    selectedItem={profile.employmentStatus}
                    onSelect={(selectedemploymentStatus) => handleInputChange("employmentStatus", selectedemploymentStatus)} // Update profile state
                    placeholder={"Select your Employement Status"}
                />


                {/* Choose Your marital staus */}
                <DropdownSelector
                    label="Marital Status"
                    //    items={religions} // original values
                    items={dummymaritalStatus} // Use the dummy data 
                    selectedItem={profile.maritalStatus}
                    onSelect={(selectedmaritalStatus) => handleInputChange("maritalStatus", selectedmaritalStatus)} // Update profile state
                    placeholder={"Select your Marital Status"}
                />


                {/* Choose Your gender */}
                <DropdownSelector
                    label="Gender"
                    //    items={religions} // original values
                    items={genderOptions} // Use the dummy data 
                    selectedItem={profile.gender}
                    onSelect={(selectedgender) => handleInputChange("gender", selectedgender)} // Update profile state
                    placeholder={"Select your Gender"}
                />

                {/* Choose Your education */}
                <DropdownSelector
                    label="Education"
                    //    items={religions} // original values
                    items={dummyeducationLevels} // Use the dummy data 
                    selectedItem={profile.education}
                    onSelect={(selectededucation) => handleInputChange("education", selectededucation)} // Update profile state
                    placeholder={"Select your Education"}
                />


                {/* Choose Your profession */}
                <DropdownSelector
                    label="Profession"
                    //    items={religions} // original values
                    items={dummyprofessions} // Use the dummy data 
                    selectedItem={profile.profession}
                    onSelect={(selectedprofession) => handleInputChange("profession", selectedprofession)} // Update profile state
                    placeholder={"Select your Profession"}
                />

                {/* Choose Your languages */}
                <MultiSelectDropdown
                    label="Languages"
                    items={dummylanguages}
                    selectedItems={profile.languages || []}
                    onSelect={(selectedLanguages) => handleInputChange("languages", selectedLanguages)}
                    placeholder="Select your languages"
                />

                {/* Image Picker */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Profile Picture</Text>

                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                        <Text style={styles.imagePickerText}>
                            {profile.profileImage ? 'Change Profile Picture' : 'Select Profile Picture'}
                        </Text>
                    </TouchableOpacity>

                    {profile.profileImage && (
                        <Image
                            source={{ uri: profile?.profileImage?.uri }} style={styles.profileImage}
                        />
                    )}
                </View>

                {/* Image Picker for extras */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Extra Pictures</Text>

                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickExtraImages}>
                        <Text style={styles.imagePickerText}>
                            {profile.extraImages.length > 0 ? 'Add More Pictures' : 'Add Pictures'}
                        </Text>
                    </TouchableOpacity>

                    {/* Render selected images */}
                    {profile.extraImages.length > 0 && (
                        <FlatList
                            data={profile.extraImages}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            renderItem={renderImageItem}
                        />
                    )}
                </View>


                {/* Show the Date Picker */}
                <Text style={styles.label}>Selected Date:</Text>
                {profile.dateOfBirth &&
                    <Text style={styles.dateText}>
                        {profile.dateOfBirth} {/* Display the selected date */}
                    </Text>
                }

                <AuthenticationButton title='Select Your Date of Birth' bgColor='#ff008c' textColor='#fff' buttonWidth={"100%"} marginFromTop={"0"} onPress={showDatePicker} />

                {/* Show the Date Picker */}
                {showPicker && (
                    <DateTimePicker
                        value={new Date()} // Initial value
                        mode="date" // Can be 'date', 'time', or 'datetime'
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'} // Customize display
                        onChange={onChange} // Handle the date selection
                    />
                )}


                <TouchableOpacity
                    style={{ width: "100%", height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#ff008c", alignSelf: "center", marginTop: 20, borderRadius: 8, }}
                    onPress={() => {
                        saveProfile();
                    }}
                >
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>{isloading ? <ActivityIndicator size={"large"} color={"#ffffff"} /> : "save Profile"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#ffffff',
    },
    dateText: {
        fontSize: 16,
        marginBottom: 6,
        color: '#1A73E8', // Primary color
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#1A73E8',
        borderRadius: 8,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        overflow: "hidden",
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff008c', // Primary color
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ff008c',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 15,
        color: '#ff008c',
        backgroundColor: "#fff"
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ff008c',
        marginBottom: 8
    },
    inputContainer: {
        marginBottom: 15,
    },
    button: {
        marginTop: 30,
        backgroundColor: '#ff008c', // Primary color
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: [{ translateX: -140 }],
        width: 300,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    }, dropdownButton: {
        width: '100%',
        height: 50,
        backgroundColor: 'black',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff008c',
    },
    dropdownButtonText: {
        backgroundColor: 'black',
        textAlign: 'left',
        fontSize: 16,
        color: '#000',
    },
    dropdown: {
        borderRadius: 8,
        backgroundColor: 'black',

    },
    dropdownRow: {
        height: 50,
        backgroundColor: 'black',

    },
    dropdownRowText: {
        fontSize: 16,
        textAlign: 'left',
    },
    selectedGender: {
        marginTop: 10,
        fontSize: 16,
        fontStyle: 'italic',
        color: 'black',
    },
    listContainer: {
        maxHeight: 200,
    },
    dropdownMenuSubsection: {
        backgroundColor: '#ffe4e1', // Light pink background for the dropdown button
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 50,
        borderColor: '#f7b5cf', // Primary color for border
        elevation: 3,
        paddingLeft: 4,
    },
    imagePickerText: {
        color: "#7d7c7c",
        textAlign: "center",
        fontWeight: "800",
    },
    imagePickerButton: {
        width: "100%",
        backgroundColor: "#ffe4e1",
        padding: 10,
        borderRadius: 10,
        elevation: 4,
    },
    textArea: {

    },
    languageSelector: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFF',
        marginTop: 5,
    },
});
export default CreateProfile;

