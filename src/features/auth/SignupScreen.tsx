import type { AxiosError } from "axios";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  useOAuthSignup,
  useSendPhoneVerification,
  useSignup,
  useVerifyPhone,
} from "@/hooks/api/auth/useAuth";
import { AppButton } from "@/shared/components/AppButton";
import { AppTextInput } from "@/shared/components/AppTextInput";
import { Screen } from "@/shared/components/Screen";
import { colors, spacing } from "@/shared/constants/theme";
import { formatTime } from "@/shared/utils/formatTime";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOAuthSignupStore } from "@/stores/useOAuthSignupStore";

type SignupForm = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
  code: string;
  birth: string;
  gender: string;
};

type ApiErrorResponse = {
  message?: string;
};

const initialForm: SignupForm = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  phone: "",
  code: "",
  birth: "",
  gender: "",
};

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  return axiosError.response?.data?.message ?? fallbackMessage;
};

const onlyNumbers = (value: string, maxLength?: number) => {
  const nextValue = value.replace(/\D/g, "");

  return typeof maxLength === "number"
    ? nextValue.slice(0, maxLength)
    : nextValue;
};

export function SignupScreen() {
  const [form, setForm] = useState<SignupForm>(initialForm);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);

  const sendCodeMutation = useSendPhoneVerification();
  const verifyPhoneMutation = useVerifyPhone();
  const signupMutation = useSignup();
  const oauthSignupMutation = useOAuthSignup();
  const setSession = useAuthStore((state) => state.setSession);
  const { signupToken, socialEmail, clearOAuthSignup } = useOAuthSignupStore();
  const isSocialSignup = Boolean(signupToken);
  const displayEmail = isSocialSignup ? (socialEmail ?? "") : form.email;

  useEffect(() => {
    if (!isCodeSent || isPhoneVerified) return;

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCodeSent, isPhoneVerified, timeLeft]);

  const isPasswordValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/.test(
    form.password,
  );

  const isPasswordSame =
    form.password.length > 0 &&
    form.passwordConfirm.length > 0 &&
    form.password === form.passwordConfirm;

  const isFormValid = useMemo(() => {
    return Boolean(
        displayEmail.trim() &&
        (isSocialSignup || (isPasswordValid && isPasswordSame)) &&
        form.name.trim() &&
        form.phone &&
        isPhoneVerified &&
        form.birth.length === 6 &&
        form.gender.length === 1,
    );
  }, [
    form.birth,
    displayEmail,
    form.gender,
    form.name,
    form.phone,
    isSocialSignup,
    isPasswordSame,
    isPasswordValid,
    isPhoneVerified,
  ]);

  const handleChange = (key: keyof SignupForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      phone: onlyNumbers(value, 11),
      code: "",
    }));
    setIsCodeSent(false);
    setIsPhoneVerified(false);
    setTimeLeft(180);
  };

  const handleSendCode = () => {
    if (!form.phone || sendCodeMutation.isPending) return;

    sendCodeMutation.mutate(
      {
        phone: form.phone,
        purpose: "SIGNUP",
      },
      {
        onSuccess: () => {
          setIsCodeSent(true);
          setIsPhoneVerified(false);
          setTimeLeft(180);
          handleChange("code", "");
          Alert.alert("인증번호 발송", "인증번호가 발송되었습니다.");
        },
        onError: (error) => {
          Alert.alert(
            "인증번호 발송 실패",
            getApiErrorMessage(error, "인증번호 발송에 실패했습니다."),
          );
        },
      },
    );
  };

  const handleCodeChange = (value: string) => {
    const code = onlyNumbers(value, 6);

    handleChange("code", code);
    setIsPhoneVerified(false);

    if (
      code.length !== 6 ||
      verifyPhoneMutation.isPending ||
      timeLeft <= 0 ||
      !form.phone
    ) {
      return;
    }

    verifyPhoneMutation.mutate(
      {
        phone: form.phone,
        code,
        purpose: "SIGNUP",
      },
      {
        onSuccess: () => {
          setIsPhoneVerified(true);
        },
        onError: (error) => {
          setIsPhoneVerified(false);
          Alert.alert(
            "인증 실패",
            getApiErrorMessage(error, "인증번호가 올바르지 않습니다."),
          );
        },
      },
    );
  };

  const handleSignup = () => {
    if (
      !isFormValid ||
      signupMutation.isPending ||
      oauthSignupMutation.isPending
    ) {
      return;
    }

    if (isSocialSignup) {
      if (!signupToken) return;

      oauthSignupMutation.mutate(
        {
          signupToken,
          name: form.name.trim(),
          birthDatePrefix: form.birth,
          genderCode: form.gender,
          phone: form.phone,
          terms: [
            { termId: 1, agreed: true },
            { termId: 2, agreed: true },
          ],
        },
        {
          onSuccess: async (session) => {
            await setSession(session);
            clearOAuthSignup();
            router.replace("/onboarding/agreement");
          },
          onError: (error) => {
            Alert.alert(
              "소셜 회원가입 실패",
              getApiErrorMessage(error, "소셜 회원가입에 실패했습니다."),
            );
          },
        },
      );

      return;
    }

    signupMutation.mutate(
      {
        loginId: form.email.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        name: form.name.trim(),
        birthDatePrefix: form.birth,
        genderCode: form.gender,
        phone: form.phone,
        termAgreements: [
          { termId: 1, agreed: true },
          { termId: 2, agreed: true },
        ],
      },
      {
        onSuccess: () => {
          Alert.alert("회원가입 완료", "로그인 후 B:Scene을 시작해 주세요.", [
            {
              text: "확인",
              onPress: () => router.replace("/login"),
            },
          ]);
        },
        onError: (error) => {
          Alert.alert(
            "회원가입 실패",
            getApiErrorMessage(error, "회원가입에 실패했습니다."),
          );
        },
      },
    );
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isSocialSignup ? "소셜 회원가입" : "회원가입"}
        </Text>
        <Text style={styles.description}>
          B:Scene 계정으로 팬과 밴드 활동을 모두 시작할 수 있습니다.
        </Text>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label="아이디(이메일)"
          placeholder="로그인에 사용할 이메일을 입력해주세요"
          value={displayEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!isSocialSignup}
          onChangeText={(value) => handleChange("email", value)}
        />

        {!isSocialSignup ? (
          <>
            <View style={styles.fieldGroup}>
              <AppTextInput
                label="비밀번호"
                placeholder="비밀번호를 입력해주세요"
                value={form.password}
                secureTextEntry
                textContentType="newPassword"
                onChangeText={(value) => handleChange("password", value)}
              />
              <ValidationText
                active={isPasswordValid}
                text="영문/숫자/특수문자 포함 8~20자"
              />
            </View>

            <View style={styles.fieldGroup}>
              <AppTextInput
                label="비밀번호 확인"
                placeholder="비밀번호를 한번 더 입력해주세요"
                value={form.passwordConfirm}
                secureTextEntry
                textContentType="newPassword"
                onChangeText={(value) => handleChange("passwordConfirm", value)}
              />
              <ValidationText active={isPasswordSame} text="비밀번호가 일치합니다." />
            </View>
          </>
        ) : null}

        <AppTextInput
          label="이름"
          placeholder="이름을 입력해주세요"
          value={form.name}
          textContentType="name"
          onChangeText={(value) => handleChange("name", value)}
        />
        <Text style={styles.helperText}>밴드모드에서는 실명이 사용됩니다.</Text>

        <PhoneVerificationFields
          phone={form.phone}
          code={form.code}
          isCodeSent={isCodeSent}
          isPhoneVerified={isPhoneVerified}
          isSendingCode={sendCodeMutation.isPending}
          isVerifyingPhone={verifyPhoneMutation.isPending}
          timeLeft={timeLeft}
          onPhoneChange={handlePhoneChange}
          onSendCode={handleSendCode}
          onCodeChange={handleCodeChange}
        />

        <View style={styles.birthRow}>
          <View style={styles.birthField}>
            <AppTextInput
              label="생년월일"
              placeholder="YYMMDD"
              value={form.birth}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(value) =>
                handleChange("birth", onlyNumbers(value, 6))
              }
            />
          </View>
          <Text style={styles.dash}>-</Text>
          <View style={styles.genderField}>
            <AppTextInput
              label="성별"
              placeholder="1"
              value={form.gender}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(value) =>
                handleChange("gender", onlyNumbers(value, 1))
              }
            />
          </View>
        </View>

        <AppButton
          label="가입완료"
          disabled={!isFormValid}
          loading={signupMutation.isPending || oauthSignupMutation.isPending}
          onPress={handleSignup}
        />
        <AppButton
          label="이미 계정이 있어요"
          variant="ghost"
          onPress={() => router.replace("/login")}
        />
      </View>
    </Screen>
  );
}

function ValidationText({ active, text }: { active: boolean; text: string }) {
  return (
    <Text style={[styles.validationText, active && styles.validationActive]}>
      {active ? "✓ " : ""}{text}
    </Text>
  );
}

function PhoneVerificationFields({
  phone,
  code,
  isCodeSent,
  isPhoneVerified,
  isSendingCode,
  isVerifyingPhone,
  timeLeft,
  onPhoneChange,
  onSendCode,
  onCodeChange,
}: {
  phone: string;
  code: string;
  isCodeSent: boolean;
  isPhoneVerified: boolean;
  isSendingCode: boolean;
  isVerifyingPhone: boolean;
  timeLeft: number;
  onPhoneChange: (value: string) => void;
  onSendCode: () => void;
  onCodeChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.phoneRow}>
        <View style={styles.phoneInput}>
          <AppTextInput
            label="휴대폰"
            placeholder="숫자만 입력해주세요"
            value={phone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            onChangeText={onPhoneChange}
          />
        </View>
        <View style={styles.phoneButton}>
          <AppButton
            label={isCodeSent ? "재전송" : "인증"}
            disabled={!phone || isSendingCode}
            loading={isSendingCode}
            onPress={onSendCode}
          />
        </View>
      </View>

      {isCodeSent ? (
        <View style={styles.fieldGroup}>
          <AppTextInput
            label="인증번호"
            placeholder="인증번호 6자리"
            value={code}
            keyboardType="number-pad"
            maxLength={6}
            editable={timeLeft > 0 && !isPhoneVerified}
            onChangeText={onCodeChange}
          />
          <Text style={styles.helperText}>
            {isVerifyingPhone
              ? "인증번호 확인 중..."
              : isPhoneVerified
                ? "인증이 완료되었습니다."
                : timeLeft <= 0
                  ? "인증 시간이 만료되었습니다. 다시 받아주세요."
                  : `남은 시간 ${formatTime(timeLeft)}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    color: colors.neutral900,
    fontSize: 28,
    fontWeight: "900",
  },
  description: {
    color: colors.neutral600,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  helperText: {
    color: colors.neutral500,
    fontSize: 13,
    lineHeight: 18,
  },
  validationText: {
    color: colors.neutral400,
    fontSize: 13,
    fontWeight: "600",
  },
  validationActive: {
    color: colors.primary400,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
  },
  phoneButton: {
    width: 96,
  },
  birthRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  birthField: {
    flex: 1,
  },
  genderField: {
    width: 82,
  },
  dash: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "700",
    paddingBottom: 16,
  },
});
