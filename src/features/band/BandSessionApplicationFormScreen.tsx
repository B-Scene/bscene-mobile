import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SessionChips,
  SessionCountedTextArea,
  SessionFormTopBar,
  SessionSelect,
  SessionTextInput,
} from "@/features/session/RecruitmentApplicationFormParts";
import {
  useCreateSessionApplicationMutation,
  useMySessionApplicationDetailQuery,
  useMySessionApplicationSummaryQuery,
  useUpdateSessionApplicationMutation,
} from "@/hooks/api/session/useSessionApplication";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppIcon } from "@/shared/components/AppIcon";
import { AppState } from "@/shared/components/AppState";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Screen } from "@/shared/components/Screen";
import { colors, shadows, textStyles } from "@/shared/constants/theme";
import type {
  CreateSessionApplicationRequest,
  MySessionApplicationDetailResponse,
} from "@/types/session/sessionApplication";

const PART_OPTIONS = [
  "보컬",
  "기타",
  "베이스",
  "키보드",
  "드럼",
  "etc.",
];

const SKILL_OPTIONS = [
  "입문",
  "중급",
  "상급",
];

const GENRE_OPTIONS = [
  "인디",
  "팝",
  "팝록",
  "재즈",
  "블루스",
  "얼터너티브록",
  "사이키델릭록",
  "일렉트로닉록",
  "포크록",
  "펑크록",
  "하드록",
  "메탈",
  "etc.",
];

const REGION_OPTIONS = [
  "서울",
  "경기",
  "인천",
  "강원",
  "대전",
  "세종",
  "충북",
  "충남",
  "대구",
  "경북",
  "부산",
  "울산",
  "경남",
  "광주",
  "전북",
  "전남",
  "제주",
];

const ACTIVITY_OPTIONS = [
  "정기 합주",
  "경연",
  "라이브 공연",
  "멤버 전환",
  "앨범 및 음원 작업",
];

type CareerDraft = {
  id: number;
  name: string;
  period: string;
  description: string;
};

type FormInitialValues = {
  purpose: string;
  title: string;
  oneLineIntro: string;
  intro: string;
  part: string;
  skillLevel: string;
  genre: string;
  region: string;
  activities: string[];
  careers: CareerDraft[];
  portfolioLinks: string[];
};

const EMPTY_INITIAL_VALUES: FormInitialValues = {
  purpose: "",
  title: "",
  oneLineIntro: "",
  intro: "",
  part: "",
  skillLevel: "",
  genre: "",
  region: "",
  activities: [],
  careers: [],
  portfolioLinks: [""],
};

const parseRouteId = (
  value?: string | string[],
) => {
  const raw = Array.isArray(value)
    ? value[0]
    : value;

  const parsed = Number(raw);

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 0;
};

const normalizeEnumValue = (
  value: string,
) => {
  const trimmed =
    value.trim();

  return trimmed.toLowerCase() ===
    "etc."
    ? "etc"
    : trimmed;
};

const createEditInitialValues = (
  detail: MySessionApplicationDetailResponse,
): FormInitialValues => {
  return {
    purpose:
      detail.purpose ?? "",

    title:
      detail.title ?? "",

    oneLineIntro:
      detail.oneLineIntro ?? "",

    intro:
      detail.intro ?? "",

    part:
      detail.part ||
      detail.defaultPart ||
      "",

    skillLevel:
      detail.skillLevel ||
      detail.defaultSkillLevel ||
      "",

    genre:
      detail.genre ?? "",

    region:
      detail.region ||
      detail.defaultRegion ||
      "",

    activities:
      detail.availableActivities ??
      [],

    careers:
      detail.careers.map(
        (
          career,
          index,
        ) => ({
          id:
            career.sessionApplicationCareerId ||
            -(index + 1),

          name:
            career.name ?? "",

          period:
            career.period ?? "",

          description:
            career.description ??
            "",
        }),
      ),

    portfolioLinks:
      detail.portfolioLinks.length >
      0
        ? detail.portfolioLinks.map(
            (link) => link.url,
          )
        : [""],
  };
};

export function BandSessionApplicationFormScreen() {
  const params =
    useLocalSearchParams<{
      applicationId?: string;
    }>();

  const applicationId =
    parseRouteId(
      params.applicationId,
    );

  const isEdit =
    applicationId > 0;

  const summaryQuery =
    useMySessionApplicationSummaryQuery();

  const detailQuery =
    useMySessionApplicationDetailQuery(
      applicationId,
    );

  if (
    isEdit &&
    detailQuery.isLoading
  ) {
    return (
      <Screen>
        <AppHeader title="지원서 수정" />

        <AppState
          loading
          title="지원서를 불러오는 중이에요"
        />
      </Screen>
    );
  }

  if (
    !isEdit &&
    summaryQuery.isLoading
  ) {
    return (
      <Screen>
        <AppHeader title="지원서 작성" />

        <AppState
          loading
          title="지원서 정보를 불러오는 중이에요"
        />
      </Screen>
    );
  }

  if (
    isEdit &&
    (
      detailQuery.isError ||
      !detailQuery.data
    )
  ) {
    return (
      <Screen>
        <AppHeader title="지원서 수정" />

        <AppState
          title="지원서를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() =>
            void detailQuery.refetch()
          }
        />
      </Screen>
    );
  }

  if (
    !isEdit &&
    summaryQuery.isError
  ) {
    return (
      <Screen>
        <AppHeader title="지원서 작성" />

        <AppState
          title="지원서 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() =>
            void summaryQuery.refetch()
          }
        />
      </Screen>
    );
  }

  let initialValues =
    EMPTY_INITIAL_VALUES;

  if (
    isEdit &&
    detailQuery.data
  ) {
    initialValues =
      createEditInitialValues(
        detailQuery.data,
      );
  } else {
    const shouldCreateDefault =
      !summaryQuery.data
        ?.hasDefaultApplication &&
      (
        summaryQuery.data
          ?.applicationCount ??
        0
      ) === 0;

    initialValues = {
      ...EMPTY_INITIAL_VALUES,

      purpose:
        shouldCreateDefault
          ? "기본"
          : "",
    };
  }

  return (
    <BandSessionApplicationForm
      key={
        isEdit
          ? `edit-${applicationId}`
          : "create"
      }
      applicationId={
        applicationId
      }
      isEdit={isEdit}
      initialValues={
        initialValues
      }
    />
  );
}

function BandSessionApplicationForm({
  applicationId,
  isEdit,
  initialValues,
}: {
  applicationId: number;
  isEdit: boolean;
  initialValues: FormInitialValues;
}) {
  const createMutation =
    useCreateSessionApplicationMutation();

  const updateMutation =
    useUpdateSessionApplicationMutation();

  const [purpose, setPurpose] =
    useState(
      initialValues.purpose,
    );

  const [title, setTitle] =
    useState(
      initialValues.title,
    );

  const [
    oneLineIntro,
    setOneLineIntro,
  ] = useState(
    initialValues.oneLineIntro,
  );

  const [intro, setIntro] =
    useState(
      initialValues.intro,
    );

  const [part, setPart] =
    useState(
      initialValues.part,
    );

  const [
    skillLevel,
    setSkillLevel,
  ] = useState(
    initialValues.skillLevel,
  );

  const [genre, setGenre] =
    useState(
      initialValues.genre,
    );

  const [region, setRegion] =
    useState(
      initialValues.region,
    );

  const [
    activities,
    setActivities,
  ] = useState<string[]>(
    initialValues.activities,
  );

  const [
    careers,
    setCareers,
  ] = useState<CareerDraft[]>(
    initialValues.careers,
  );

  const [
    portfolioLinks,
    setPortfolioLinks,
  ] = useState<string[]>(
    initialValues.portfolioLinks,
  );

  const [
    isCancelModalOpen,
    setIsCancelModalOpen,
  ] = useState(false);

  const [
    isSaveModalOpen,
    setIsSaveModalOpen,
  ] = useState(false);

  const isDefaultPurpose =
    purpose.trim() === "기본";

  const isValid =
    useMemo(() => {
      const careersValid =
        careers.every(
          (career) =>
            career.name.trim()
              .length > 0 &&
            career.period.trim()
              .length > 0,
        );

      return Boolean(
        purpose.trim() &&
          title.trim() &&
          oneLineIntro.trim() &&
          intro.trim() &&
          part &&
          skillLevel &&
          genre &&
          region &&
          activities.length >
            0 &&
          careersValid,
      );
    }, [
      activities,
      careers,
      genre,
      intro,
      oneLineIntro,
      part,
      purpose,
      region,
      skillLevel,
      title,
    ]);

  const toggleActivity = (
    activity: string,
  ) => {
    setActivities(
      (previous) =>
        previous.includes(
          activity,
        )
          ? previous.filter(
              (item) =>
                item !== activity,
            )
          : [
              ...previous,
              activity,
            ],
    );
  };

  const addCareer = () => {
    setCareers(
      (previous) => [
        ...previous,
        {
          id: Date.now(),
          name: "",
          period: "",
          description: "",
        },
      ],
    );
  };

  const updateCareer = (
    id: number,
    key:
      | "name"
      | "period"
      | "description",
    value: string,
  ) => {
    setCareers(
      (previous) =>
        previous.map(
          (career) =>
            career.id === id
              ? {
                  ...career,
                  [key]:
                    value,
                }
              : career,
        ),
    );
  };

  const removeCareer = (
    id: number,
  ) => {
    setCareers(
      (previous) =>
        previous.filter(
          (career) =>
            career.id !== id,
        ),
    );
  };

  const addPortfolioLink =
    () => {
      setPortfolioLinks(
        (previous) => [
          ...previous,
          "",
        ],
      );
    };

  const updatePortfolioLink =
    (
      index: number,
      value: string,
    ) => {
      setPortfolioLinks(
        (previous) =>
          previous.map(
            (
              link,
              linkIndex,
            ) =>
              linkIndex === index
                ? value
                : link,
          ),
      );
    };

  const removePortfolioLink =
    (index: number) => {
      setPortfolioLinks(
        (previous) => {
          if (
            previous.length === 1
          ) {
            return [""];
          }

          return previous.filter(
            (
              _link,
              linkIndex,
            ) =>
              linkIndex !== index,
          );
        },
      );
    };

  const createRequest =
    (): CreateSessionApplicationRequest => {
      const validCareers =
        careers
          .filter(
            (career) =>
              career.name.trim() &&
              career.period.trim(),
          )
          .map(
            (career) => ({
              name:
                career.name.trim(),

              period:
                career.period.trim(),

              description:
                career.description.trim() ||
                undefined,
            }),
          );

      const validLinks =
        portfolioLinks
          .map((link) =>
            link.trim(),
          )
          .filter(Boolean)
          .map((url) => ({
            url,
          }));

      return {
        purpose:
          purpose.trim(),

        title:
          title.trim(),

        oneLineIntro:
          oneLineIntro.trim(),

        intro:
          intro.trim(),

        part:
          normalizeEnumValue(
            part,
          ),

        skillLevel:
          normalizeEnumValue(
            skillLevel,
          ),

        genre:
          normalizeEnumValue(
            genre,
          ),

        region:
          normalizeEnumValue(
            region,
          ),

        availableActivities:
          activities.map(
            normalizeEnumValue,
          ),

        careers:
          validCareers.length >
          0
            ? validCareers
            : undefined,

        portfolioLinks:
          validLinks.length >
          0
            ? validLinks
            : undefined,
      };
    };

  const submit =
    async () => {
      if (!isValid) {
        Alert.alert(
          "지원서",
          "필수 항목을 모두 입력해 주세요.",
        );

        return;
      }

      try {
        const body =
          createRequest();

        if (isEdit) {
          await updateMutation.mutateAsync(
            {
              sessionApplicationId:
                applicationId,

              body,
            },
          );

          Alert.alert(
            "지원서 수정 완료",
            "지원서가 수정되었어요.",
            [
              {
                text: "확인",
                onPress: () =>
                  router.back(),
              },
            ],
          );

          return;
        }

        await createMutation.mutateAsync(
          body,
        );

        Alert.alert(
          "지원서 등록 완료",
          "새 지원서가 등록되었어요.",
          [
            {
              text: "확인",
              onPress: () =>
                router.back(),
            },
          ],
        );
      } catch {
        Alert.alert(
          isEdit
            ? "지원서 수정"
            : "지원서 등록",

          isEdit
            ? "지원서를 수정하지 못했어요."
            : "지원서를 등록하지 못했어요.",
        );
      }
    };

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending;

  const headerTitle = isEdit ? "지원서 수정" : "지원서 작성";
  const canSubmit = isValid && !isSubmitting;

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <SessionFormTopBar
        title={headerTitle}
        onBack={() => setIsCancelModalOpen(true)}
        onClose={() => setIsCancelModalOpen(true)}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.form}
      >
        <View style={styles.fields}>
          <Field label="지원서 유형" required>
            <SessionTextInput
              value={purpose}
              editable={!isDefaultPurpose}
              maxLength={20}
              placeholder="지원서 유형을 입력해 주세요"
              style={isDefaultPurpose && styles.inputLocked}
              onChangeText={setPurpose}
            />
          </Field>

          <Field label="지원서 제목" required>
            <SessionTextInput
              value={title}
              maxLength={50}
              placeholder="지원서 제목을 입력해 주세요"
              onChangeText={setTitle}
            />
          </Field>

          <Field label="지원서 한줄 소개" required>
            <SessionTextInput
              value={oneLineIntro}
              maxLength={50}
              placeholder="지원서 목록에 표시될 짧은 소개를 입력해 주세요 (최대 50자)"
              onChangeText={setOneLineIntro}
            />
          </Field>

          <Field label="소개글" required>
            <SessionCountedTextArea
              value={intro}
              height={72}
              maxLength={500}
              placeholder="활동 경력과 스타일을 소개해 주세요"
              onChangeText={setIntro}
            />
          </Field>

          <Field label="파트" required>
            <SessionChips
              options={PART_OPTIONS}
              isSelected={(option) =>
                part === option || (option === "etc." && part === "etc")
              }
              onPress={setPart}
            />
          </Field>

          <Field label="실력대" required>
            <SessionChips
              options={SKILL_OPTIONS}
              isSelected={(option) => skillLevel === option}
              onPress={setSkillLevel}
            />
          </Field>

          <Field label="선호 장르" required zIndex={3}>
            <SessionSelect
              value={genre === "etc" ? "etc." : genre}
              options={GENRE_OPTIONS}
              placeholder="장르 선택"
              onChange={setGenre}
            />
          </Field>

          <Field label="활동 지역" required zIndex={2}>
            <SessionSelect
              value={region}
              options={REGION_OPTIONS}
              placeholder="지역 선택"
              onChange={setRegion}
            />
          </Field>

          <Field label="가능한 활동 (복수 선택 가능)" required>
            <SessionChips
              options={ACTIVITY_OPTIONS}
              isSelected={(option) => activities.includes(option)}
              onPress={toggleActivity}
            />
          </Field>

          <Field label="경력">
            <View style={styles.repeatList}>
              {careers.map((career) => (
                <View key={career.id} style={styles.careerCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="경력 삭제"
                    hitSlop={6}
                    style={styles.careerDelete}
                    onPress={() => removeCareer(career.id)}
                  >
                    <AppIcon name="sessionDelete" size={20} />
                  </Pressable>

                  <Field label="경력명" required>
                    <SessionTextInput
                      value={career.name}
                      placeholder="밴드 드러머 활동"
                      style={styles.inputWithAction}
                      onChangeText={(value) =>
                        updateCareer(career.id, "name", value)
                      }
                    />
                  </Field>

                  <Field label="기간" required>
                    <SessionTextInput
                      value={career.period}
                      placeholder="2026.01 - 현재"
                      onChangeText={(value) =>
                        updateCareer(career.id, "period", value)
                      }
                    />
                  </Field>

                  <Field label="상세 내용">
                    <SessionTextInput
                      multiline
                      value={career.description}
                      placeholder="활동 내용을 입력해 주세요"
                      style={styles.careerTextArea}
                      onChangeText={(value) =>
                        updateCareer(career.id, "description", value)
                      }
                    />
                  </Field>
                </View>
              ))}

              <AddButton label="+ 경력 추가" onPress={addCareer} />
            </View>
          </Field>

          <Field label="포트폴리오">
            <View style={styles.portfolioList}>
              {portfolioLinks.map((link, index) => (
                <View key={`portfolio-${index}`}>
                  <SessionTextInput
                    value={link}
                    autoCapitalize="none"
                    keyboardType="url"
                    placeholder="YouTube 또는 영상 링크를 첨부해 주세요"
                    style={styles.inputWithAction}
                    onChangeText={(value) => updatePortfolioLink(index, value)}
                  />

                  {portfolioLinks.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${index + 1}번째 포트폴리오 삭제`}
                      hitSlop={6}
                      style={styles.portfolioDelete}
                      onPress={() => removePortfolioLink(index)}
                    >
                      <AppIcon name="sessionDelete" size={16} />
                    </Pressable>
                  ) : null}
                </View>
              ))}

              <AddButton label="+ 포트폴리오 추가" onPress={addPortfolioLink} />
            </View>
          </Field>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={() => {
            if (isEdit) {
              setIsSaveModalOpen(true);
              return;
            }

            void submit();
          }}
        >
          <Text
            style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}
          >
            {isSubmitting
              ? "저장 중..."
              : isEdit
                ? "지원서 저장"
                : "지원서 등록"}
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        open={isCancelModalOpen}
        tone="orange"
        title={
          isEdit ? "지원서 수정을 취소할까요?" : "지원서 작성을 취소할까요?"
        }
        description={"입력한 내용은 저장되지 않고\n사라집니다."}
        onCancel={() => setIsCancelModalOpen(false)}
        onConfirm={() => {
          setIsCancelModalOpen(false);
          router.back();
        }}
      />

      <ConfirmModal
        open={isSaveModalOpen}
        tone="orange"
        title="지원서를 저장할까요?"
        description={"수정한 내용으로\n지원서를 저장해요."}
        onCancel={() => setIsSaveModalOpen(false)}
        onConfirm={() => {
          setIsSaveModalOpen(false);
          void submit();
        }}
      />
    </Screen>
  );
}

function Field({
  label,
  required = false,
  zIndex,
  children,
}: {
  label: string;
  required?: boolean;
  zIndex?: number;
  children: ReactNode;
}) {
  return (
    <View style={zIndex ? { zIndex } : undefined}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.requiredMark}>*</Text> : null}
      </View>
      {children}
    </View>
  );
}

function AddButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.addButton}
      onPress={onPress}
    >
      <Text style={styles.addButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: colors.white,
  },
  form: {
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 32,
  },
  fields: {
    gap: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    ...textStyles.body1,
    color: colors.neutral900,
  },
  requiredMark: {
    ...textStyles.body1,
    marginLeft: 4,
    color: colors.error,
  },
  inputLocked: {
    backgroundColor: colors.neutral200,
    color: colors.neutral600,
  },
  inputWithAction: {
    paddingRight: 40,
  },
  repeatList: {
    gap: 12,
  },
  careerCard: {
    ...shadows.card,
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 16,
  },
  careerDelete: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  careerTextArea: {
    height: 80,
    paddingVertical: 6,
  },
  portfolioList: {
    gap: 8,
  },
  portfolioDelete: {
    position: "absolute",
    top: 5,
    right: 12,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.secondary500,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  addButtonText: {
    ...textStyles.caption2,
    color: colors.secondary500,
  },
  submitButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.secondary500,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral300,
  },
  submitText: {
    ...textStyles.body1,
    color: colors.white,
  },
  submitTextDisabled: {
    color: colors.neutral600,
  },
});
