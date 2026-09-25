import {
    router,
} from "expo-router";

import {
    Alert,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import {
    useState,
} from "react";

import {
    useCreateLiveMutation,
} from "@/hooks/api/live/useLive";

import { AppButton } from "@/shared/components/AppButton";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Screen } from "@/shared/components/Screen";

import {
    colors,
    radius,
    spacing,
} from "@/shared/constants/theme";

export function LiveCreateScreen() {
  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const mutation =
    useCreateLiveMutation();

  const create =
    async () => {
      if (!title.trim()) {
        Alert.alert(
          "라이브",
          "라이브 제목을 입력해 주세요.",
        );

        return;
      }

      try {
        const result =
          await mutation.mutateAsync(
            {
              title:
                title.trim(),

              description:
                description.trim() ||
                null,

              scheduledAt:
                null,
            },
          );

        const liveId =
          result.liveId ??
          result.audioStreamId;

        router.replace(
          `/band/live/room/${liveId}` as Parameters<
            typeof router.replace
          >[0],
        );
      } catch {
        Alert.alert(
          "라이브",
          "라이브를 시작하지 못했어요.",
        );
      }
    };

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="라이브 시작" />

      <AppTextInput
        label="라이브 제목"
        value={title}
        maxLength={80}
        placeholder="라이브 제목을 입력해 주세요"
        onChangeText={
          setTitle
        }
      />

      <View
        style={styles.field}
      >
        <TextInput
          value={
            description
          }
          multiline
          maxLength={500}
          textAlignVertical="top"
          placeholder="라이브 소개를 입력해 주세요"
          placeholderTextColor={
            colors.neutral500
          }
          style={
            styles.textArea
          }
          onChangeText={
            setDescription
          }
        />
      </View>

      <AppButton
        label="라이브 시작"
        loading={
          mutation.isPending
        }
        onPress={() =>
          void create()
        }
      />
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: spacing.lg,
    },

    field: {
      gap: spacing.sm,
    },

    textArea: {
      minHeight: 140,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius:
        radius.md,
      backgroundColor:
        colors.white,
      padding:
        spacing.lg,
      color:
        colors.neutral900,
      fontSize: 15,
      lineHeight: 22,
    },
  });