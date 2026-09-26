import {
  router,
} from "expo-router";

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useState,
} from "react";

import {
  useCreateLiveMutation,
} from "@/hooks/api/live/useLive";

import { AppHeader } from "@/shared/components/AppHeader";
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

  const canSubmit =
    Boolean(title.trim()) &&
    !mutation.isPending;

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader title="라이브 시작" />

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          라이브 방송을{"\n"}
          시작해볼까요?
        </Text>
        <Text style={styles.heroDescription}>
          밴드의 순간을 팬들과 실시간으로 나눠보세요
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>
          라이브 시간 설정
        </Text>

        <View style={styles.choiceCardSelected}>
          <View style={styles.radioSelected} />
          <View style={styles.choiceTextWrap}>
            <Text style={styles.choiceTitle}>
              지금 바로 시작
            </Text>
            <Text style={styles.choiceDescription}>
              입력 완료 후 바로 라이브 룸으로 이동해요
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>
          라이브 정보
        </Text>

        <View style={styles.fields}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              라이브 제목
              <Text style={styles.required}>
                {" "}*
              </Text>
            </Text>

            <TextInput
              value={title}
              maxLength={50}
              placeholder="라이브 제목을 입력해주세요"
              placeholderTextColor={
                colors.neutral500
              }
              style={styles.input}
              onChangeText={
                setTitle
              }
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              라이브 소개
            </Text>

            <TextInput
              value={
                description
              }
              multiline
              maxLength={100}
              textAlignVertical="top"
              placeholder="라이브에 대해 소개해주세요 (선택)"
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
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            !canSubmit
              ? styles.submitButtonDisabled
              : null,
            pressed && canSubmit
              ? styles.submitButtonPressed
              : null,
          ]}
          onPress={() =>
            void create()
          }
        >
          <Text style={styles.submitButtonText}>
            {mutation.isPending
              ? "라이브 시작 중..."
              : "라이브 시작"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      gap: spacing.lg,
      backgroundColor:
        colors.neutral100,
    },

    hero: {
      gap: spacing.sm,
      paddingTop:
        spacing.sm,
      paddingBottom:
        spacing.sm,
    },

    heroTitle: {
      color:
        colors.neutral900,
      fontSize: 28,
      lineHeight: 38,
      fontWeight: "800",
      letterSpacing: 0,
    },

    heroDescription: {
      color:
        colors.neutral600,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "500",
      letterSpacing: 0,
    },

    formCard: {
      gap: spacing.lg,
      borderRadius: 14,
      backgroundColor:
        colors.white,
      paddingHorizontal: 18,
      paddingVertical:
        spacing.md,
      shadowColor:
        colors.neutral900,
      shadowOpacity: 0.08,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 3,
    },

    cardTitle: {
      color:
        colors.neutral900,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "700",
      letterSpacing: 0,
    },

    choiceCardSelected: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      borderWidth: 1,
      borderColor:
        colors.secondary500,
      borderRadius:
        radius.sm,
      backgroundColor:
        colors.secondary0,
      paddingHorizontal:
        spacing.md,
      paddingVertical:
        spacing.md,
    },

    radioSelected: {
      width: 12,
      height: 12,
      marginTop: 2,
      borderWidth: 1,
      borderColor:
        colors.secondary500,
      borderRadius:
        radius.pill,
      backgroundColor:
        colors.secondary500,
    },

    choiceTextWrap: {
      flex: 1,
      minWidth: 0,
    },

    choiceTitle: {
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 0,
    },

    choiceDescription: {
      marginTop: 2,
      color:
        colors.neutral500,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
      letterSpacing: 0,
    },

    fields: {
      gap: spacing.lg,
    },

    fieldRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },

    fieldLabel: {
      width: 76,
      paddingTop: 5,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: 0,
    },

    required: {
      color:
        colors.error,
    },

    input: {
      height: 32,
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.lg,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    textArea: {
      minHeight: 64,
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor:
        colors.neutral300,
      borderRadius: 4,
      backgroundColor:
        colors.white,
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.sm,
      color:
        colors.neutral900,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      letterSpacing: 0,
    },

    footer: {
      marginTop: "auto",
      paddingTop:
        spacing.md,
    },

    submitButton: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius:
        radius.md,
      backgroundColor:
        colors.secondary500,
    },

    submitButtonDisabled: {
      backgroundColor:
        colors.neutral400,
    },

    submitButtonPressed: {
      opacity: 0.84,
    },

    submitButtonText: {
      color:
        colors.white,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "800",
      letterSpacing: 0,
    },
  });
