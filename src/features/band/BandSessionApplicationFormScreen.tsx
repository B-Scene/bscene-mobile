import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  Plus,
  Trash2,
} from "lucide-react-native";
import {
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCreateSessionApplicationMutation,
  useMySessionApplicationDetailQuery,
  useMySessionApplicationSummaryQuery,
  useUpdateSessionApplicationMutation,
} from "@/hooks/api/session/useSessionApplication";
import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";
import { colors } from "@/shared/constants/theme";
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

  return (
    <Screen
      contentStyle={
        styles.container
      }
    >
      <AppHeader
        title={
          isEdit
            ? "지원서 수정"
            : "지원서 작성"
        }
      />

      <FormField
        label="지원서 유형"
        required
        value={purpose}
        placeholder="지원서 유형을 입력해 주세요"
        maxLength={20}
        editable={
          !isDefaultPurpose
        }
        onChangeText={
          setPurpose
        }
      />

      {isDefaultPurpose ? (
        <Text
          style={styles.helper}
        >
          기본 지원서의 유형은 변경할 수
          없어요.
        </Text>
      ) : null}

      <FormField
        label="지원서 제목"
        required
        value={title}
        placeholder="지원서 제목을 입력해 주세요"
        maxLength={50}
        onChangeText={
          setTitle
        }
      />

      <FormField
        label="지원서 한줄 소개"
        required
        value={oneLineIntro}
        placeholder="지원서 목록에 표시될 짧은 소개를 입력해 주세요 (최대 50자)"
        maxLength={50}
        onChangeText={
          setOneLineIntro
        }
      />

      <View style={styles.fieldBlock}>
        <FieldLabel label="소개글" required />

        <TextInput
          value={intro}
          onChangeText={
            setIntro
          }
          multiline
          maxLength={500}
          textAlignVertical="top"
          placeholder="활동 경력과 스타일을 소개해 주세요"
          placeholderTextColor={
            colors.neutral500
          }
          style={
            styles.textArea
          }
        />

        <Text
          style={
            styles.countText
          }
        >
          {intro.length}/500
        </Text>
      </View>

      <ChoiceSection
        title="파트"
        options={
          PART_OPTIONS
        }
        value={part}
        onSelect={
          setPart
        }
      />

      <ChoiceSection
        title="실력대"
        options={
          SKILL_OPTIONS
        }
        value={skillLevel}
        onSelect={
          setSkillLevel
        }
      />

      <ChoiceSection
        title="선호 장르"
        options={
          GENRE_OPTIONS
        }
        value={genre}
        onSelect={
          setGenre
        }
      />

      <ChoiceSection
        title="활동 지역"
        options={
          REGION_OPTIONS
        }
        value={region}
        onSelect={
          setRegion
        }
      />

      <View style={styles.fieldBlock}>
        <FieldLabel
          label="가능한 활동 (복수 선택 가능)"
          required
        />

        <View
          style={styles.chips}
        >
          {ACTIVITY_OPTIONS.map(
            (activity) => (
              <OptionPill
                key={activity}
                label={activity}
                selected={
                  activities.includes(
                    activity,
                  )
                }
                onPress={() =>
                  toggleActivity(
                    activity,
                  )
                }
              />
            ),
          )}
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            경력
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={
              addCareer
            }
            style={
              styles.addButton
            }
          >
            <Plus
              size={18}
              color={
                colors.primary600
              }
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              추가
            </Text>
          </Pressable>
        </View>

        {careers.length ===
        0 ? (
          <Text
            style={styles.helper}
          >
            경력이 있다면 추가해 주세요.
          </Text>
        ) : (
          careers.map(
            (
              career,
              index,
            ) => (
              <View
                key={career.id}
                style={
                  styles.repeatCard
                }
              >
                <View
                  style={
                    styles.repeatHeader
                  }
                >
                  <Text
                    style={
                      styles.repeatTitle
                    }
                  >
                    경력 {index + 1}
                  </Text>

                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      removeCareer(
                        career.id,
                      )
                    }
                  >
                    <Trash2
                      size={18}
                      color={
                        colors.error
                      }
                    />
                  </Pressable>
                </View>

                <FormField
                  label="활동명"
                  value={
                    career.name
                  }
                  placeholder="밴드 또는 활동명"
                  onChangeText={(
                    value,
                  ) =>
                    updateCareer(
                      career.id,
                      "name",
                      value,
                    )
                  }
                />

                <FormField
                  label="활동 기간"
                  value={
                    career.period
                  }
                  placeholder="예: 2024.03 ~ 2025.02"
                  onChangeText={(
                    value,
                  ) =>
                    updateCareer(
                      career.id,
                      "period",
                      value,
                    )
                  }
                />

                <FormField
                  label="설명"
                  value={
                    career.description
                  }
                  placeholder="담당 역할이나 활동 내용을 입력해 주세요"
                  onChangeText={(
                    value,
                  ) =>
                    updateCareer(
                      career.id,
                      "description",
                      value,
                    )
                  }
                />
              </View>
            ),
          )
        )}
      </View>

      <View style={styles.fieldBlock}>
        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            포트폴리오
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={
              addPortfolioLink
            }
            style={
              styles.addButton
            }
          >
            <Plus
              size={18}
              color={
                colors.primary600
              }
            />

            <Text
              style={
                styles.addButtonText
              }
            >
              추가
            </Text>
          </Pressable>
        </View>

        {portfolioLinks.map(
          (
            link,
            index,
          ) => (
            <View
              key={`portfolio-${index}`}
              style={
                styles.portfolioRow
              }
            >
              <View
                style={
                  styles.portfolioInput
                }
              >
                <FormField
                  label={`링크 ${index + 1}`}
                  value={link}
                  placeholder="https://"
                  autoCapitalize="none"
                  keyboardType="url"
                  onChangeText={(
                    value,
                  ) =>
                    updatePortfolioLink(
                      index,
                      value,
                    )
                  }
                />
              </View>

              <Pressable
                hitSlop={10}
                style={
                  styles.portfolioDelete
                }
                onPress={() =>
                  removePortfolioLink(
                    index,
                  )
                }
              >
                <Trash2
                  size={19}
                  color={
                    colors.error
                  }
                />
              </Pressable>
            </View>
          ),
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={
          !isValid ||
          isSubmitting
        }
        style={[
          styles.submitButton,
          (!isValid || isSubmitting) &&
            styles.submitButtonDisabled,
        ]}
        onPress={() =>
          void submit()
        }
      >
        <Text
          style={[
            styles.submitButtonText,
            (!isValid || isSubmitting) &&
              styles.submitButtonTextDisabled,
          ]}
        >
          {isSubmitting
            ? "저장 중..."
            : isEdit
              ? "지원서 저장"
              : "지원서 등록"}
        </Text>
      </Pressable>
    </Screen>
  );
}

function FormField({
  label,
  required = false,
  value,
  placeholder,
  maxLength,
  editable = true,
  autoCapitalize,
  keyboardType,
  onChangeText,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  maxLength?: number;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <FieldLabel label={label} required={required} />
      <TextInput
        value={value}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral500}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[
          styles.input,
          !editable && styles.inputLocked,
        ]}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required ? (
        <Text style={styles.requiredMark}>*</Text>
      ) : null}
    </View>
  );
}

function ChoiceSection({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: string[];
  value: string;
  onSelect: (
    value: string,
  ) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <FieldLabel label={title} required />

      <View
        style={styles.chips}
      >
        {options.map(
          (option) => (
            <OptionPill
              key={option}
              label={option}
              selected={
                value === option ||
                (
                  option ===
                    "etc." &&
                  value === "etc"
                )
              }
              onPress={() =>
                onSelect(
                  option,
                )
              }
            />
          ),
        )}
      </View>
    </View>
  );
}

function OptionPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.optionPill,
        selected
          ? styles.optionPillSelected
          : styles.optionPillIdle,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionPillText,
          selected
            ? styles.optionPillTextSelected
            : styles.optionPillTextIdle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: 12,
      paddingHorizontal: 32,
      paddingTop: 12,
      paddingBottom: 32,
      backgroundColor: colors.white,
    },

    fieldBlock: {
      gap: 6,
    },

    labelRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    label: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },

    requiredMark: {
      color: colors.error,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
      marginLeft: 4,
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.neutral400,
      borderRadius: 5,
      backgroundColor: colors.white,
      color: colors.neutral900,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 18,
      paddingHorizontal: 16,
    },

    inputLocked: {
      backgroundColor: colors.neutral200,
      color: colors.neutral600,
    },

    textArea: {
      height: 72,
      borderWidth: 1,
      borderColor:
        colors.neutral400,
      borderRadius: 5,
      backgroundColor:
        colors.white,
      color:
        colors.neutral900,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 20,
    },

    countText: {
      color:
        colors.neutral500,
      fontSize: 11,
      textAlign: "right",
      marginTop: -24,
      marginRight: 12,
    },

    helper: {
      color:
        colors.neutral500,
      fontSize: 12,
      lineHeight: 18,
    },

    sectionTitle: {
      color:
        colors.neutral900,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      minHeight: 26,
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    optionPill: {
      minHeight: 26,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 15,
    },

    optionPillSelected: {
      backgroundColor: colors.secondary500,
    },

    optionPillIdle: {
      backgroundColor: colors.neutral300,
    },

    optionPillText: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },

    optionPillTextSelected: {
      color: colors.white,
    },

    optionPillTextIdle: {
      color: colors.neutral600,
    },

    addButton: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal:
        8,
    },

    addButtonText: {
      color:
        colors.secondary500,
      fontSize: 13,
      fontWeight: "800",
    },

    repeatCard: {
      gap: 12,
      borderTopWidth: 1,
      borderTopColor:
        colors.neutral300,
      paddingTop:
        12,
    },

    repeatHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    repeatTitle: {
      color:
        colors.neutral800,
      fontSize: 13,
      fontWeight: "800",
    },

    portfolioRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },

    portfolioInput: {
      flex: 1,
    },

    portfolioDelete: {
      width: 44,
      height: 52,
      alignItems: "center",
      justifyContent:
        "center",
    },

    submitButton: {
      height: 52,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary500,
      marginTop: 8,
    },

    submitButtonDisabled: {
      backgroundColor: colors.neutral300,
    },

    submitButtonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 20,
    },

    submitButtonTextDisabled: {
      color: colors.neutral600,
    },
  });
