import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export const useProfileImageSelection = () => {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [isDeleted, setIsDeleted] = useState(false);

  const applyResult = (result: ImagePicker.ImagePickerResult) => {
    const asset = result.assets?.[0];

    if (result.canceled || !asset) return;

    setSelectedImage({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
    setIsDeleted(false);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "사진 접근 권한",
        "프로필 사진을 선택하려면 사진 접근 권한이 필요해요.",
      );
      return;
    }

    applyResult(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "카메라 권한",
        "프로필 사진을 촬영하려면 카메라 권한이 필요해요.",
      );
      return;
    }

    applyResult(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const removeImage = () => {
    setSelectedImage(null);
    setIsDeleted(true);
  };

  return { selectedImage, isDeleted, pickFromGallery, takePhoto, removeImage };
};
