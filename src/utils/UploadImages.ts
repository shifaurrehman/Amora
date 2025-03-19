import { Alert } from "react-native";

interface ImageType {
    uri: string;
    type: string;
    fileName: string;
}

export const uploadProfileImage = async (profileImage: ImageType) => {
    try {
        if (!profileImage.uri) {
            console.error("No image selected for upload.");
            Alert.alert("No image selected for upload.")
            return null;
        }

        const formData = new FormData();
        formData.append("image", {
            uri: profileImage.uri,
            name: profileImage.fileName || "profile.jpg",
            type: profileImage.type || "image/jpeg",
        } as unknown as Blob); // Explicitly cast to Blob

        const API_KEY = "7d2e899e187767a908546e53439be92c";
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            console.log("✅ Image Uploaded:", data.data.url);
            // Alert.alert("Image uploaded: ",data.data.url)
            return data.data.url; // Return the uploaded URL
        } else {
            console.error("Upload Error:", data.error.message);
            return null;
        }
    } catch (error) {
        console.error("Upload Exception:", error);
        return null;
    }
};
