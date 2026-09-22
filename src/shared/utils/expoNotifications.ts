import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type PushRegistrationResult =
  | {
      status: "granted";
      token: string;
    }
  | {
      status: "denied" | "unavailable";
      token: null;
    };

const getExpoProjectId = () => {
  const constantsWithEas = Constants as typeof Constants & {
    easConfig?: { projectId?: string };
  };

  return (
    constantsWithEas.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId
  );
};

export const requestExpoPushToken = async (): Promise<PushRegistrationResult> => {
  if (!Device.isDevice) {
    return { status: "unavailable", token: null };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (finalStatus !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== "granted") {
    return { status: "denied", token: null };
  }

  const projectId = getExpoProjectId();
  const tokenResult = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return { status: "granted", token: tokenResult.data };
};
