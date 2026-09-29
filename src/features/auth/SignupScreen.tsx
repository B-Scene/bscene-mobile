import type { AxiosError } from "axios";
import { router } from "expo-router";
import { Check, ChevronLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useOAuthSignup,
  useSendPhoneVerification,
  useSignup,
  useVerifyPhone,
} from "@/hooks/api/auth/useAuth";
import { colors } from "@/shared/constants/theme";
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

  return typeof maxLength === "number" ? nextValue.slice(0, maxLength) : nextValue;
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
    if (!isCodeSent || isPhoneVerified || timeLeft <= 0) return;

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
  const isPending = signupMutation.isPending || oauthSignupMutation.isPending;

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
    displayEmail,
    form.birth,
    form.gender,
    form.name,
    form.phone,
    isPasswordSame,
    isPasswordValid,
    isPhoneVerified,
    isSocialSignup,
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
    if (!isFormValid || isPending) return;

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={12}
          style={styles.headerSide}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.neutral900} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isSocialSignup ? "소셜 회원가입" : "회원가입"}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.form}>
          <SignupField
            label="아이디(이메일)"
            required
            value={displayEmail}
            placeholder="로그인에 사용할 이메일을 입력해주세요"
            keyboardType="email-address"
            editable={!isSocialSignup}
            onChangeText={(value) => handleChange("email", value)}
          />

          {!isSocialSignup ? (
            <>
              <View>
                <SignupField
                  label="비밀번호"
                  required
                  value={form.password}
                  placeholder="비밀번호를 입력해주세요"
                  secureTextEntry
                  onChangeText={(value) => handleChange("password", value)}
                />
                <ValidationText
                  active={isPasswordValid}
                  text="영문/숫자/특수문자 포함 8~20자"
                />
              </View>

              <View>
                <SignupField
                  label="비밀번호 확인"
                  required
                  value={form.passwordConfirm}
                  placeholder="비밀번호를 한번 더 입력해주세요"
                  secureTextEntry
                  onChangeText={(value) => handleChange("passwordConfirm", value)}
                />
                <ValidationText
                  active={isPasswordSame}
                  text="비밀번호가 일치합니다."
                />
              </View>
            </>
          ) : null}

          <SignupField
            label="이름"
            required
            value={form.name}
            placeholder="이름을 입력해주세요"
            onChangeText={(value) => handleChange("name", value)}
          />
          <Text style={styles.description}>밴드모드에서는 실명이 사용됩니다.</Text>

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

          <View>
            <FieldLabel required>생년월일/성별</FieldLabel>
            <Text style={styles.description}>
              생년월일과 성별(주민번호 뒤 첫번째 숫자)을 입력해주세요.
            </Text>
            <View style={styles.birthRow}>
              <TextInput
                value={form.birth}
                placeholder="YYMMDD"
                placeholderTextColor={colors.neutral400}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.birthInput]}
                onChangeText={(value) => handleChange("birth", onlyNumbers(value, 6))}
              />
              <Text style={styles.dash}>-</Text>
              <TextInput
                value={form.gender}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.input, styles.genderInput]}
                textAlign="center"
                onChangeText={(value) => handleChange("gender", onlyNumbers(value, 1))}
              />
              <View style={styles.maskDots}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <View key={index} style={styles.maskDot} />
                ))}
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!isFormValid || isPending}
            style={({ pressed }) => [
              styles.submitButton,
              isFormValid ? styles.submitEnabled : styles.submitDisabled,
              pressed && isFormValid && styles.pressed,
            ]}
            onPress={handleSignup}
          >
            <Text
              style={[
                styles.submitText,
                isFormValid ? styles.submitTextEnabled : styles.submitTextDisabled,
              ]}
            >
              {isPending ? "가입 중..." : "가입완료"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.required}>*</Text> : null}
    </Text>
  );
}

function SignupField({
  label,
  required,
  value,
  placeholder,
  editable = true,
  keyboardType,
  secureTextEntry,
  onChangeText,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  editable?: boolean;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <FieldLabel required={required}>{label}</FieldLabel>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral400}
        editable={editable}
        autoCapitalize="none"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, !editable && styles.disabledInput]}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function ValidationText({ active, text }: { active: boolean; text: string }) {
  return (
    <View style={styles.validationRow}>
      <Check size={14} color={active ? colors.primary400 : colors.neutral400} />
      <Text style={[styles.validationText, active && styles.validationActive]}>
        {text}
      </Text>
    </View>
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
    <View>
      <FieldLabel required>휴대폰</FieldLabel>
      <View style={styles.phoneRow}>
        <TextInput
          value={phone}
          placeholder="숫자만 입력해주세요"
          placeholderTextColor={colors.neutral400}
          keyboardType="phone-pad"
          style={[styles.input, styles.phoneInput]}
          onChangeText={onPhoneChange}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!phone || isSendingCode}
          style={[
            styles.phoneButton,
            phone ? styles.phoneButtonEnabled : styles.phoneButtonDisabled,
          ]}
          onPress={onSendCode}
        >
          <Text
            style={[
              styles.phoneButtonText,
              phone ? styles.phoneButtonTextEnabled : styles.phoneButtonTextDisabled,
            ]}
          >
            {isSendingCode
              ? "발송 중..."
              : isCodeSent
                ? "인증번호 재전송"
                : "인증번호 받기"}
          </Text>
        </Pressable>
      </View>

      {isCodeSent ? (
        <>
          <View style={styles.codeInputWrap}>
            <TextInput
              value={code}
              placeholder="인증번호를 입력해주세요"
              placeholderTextColor={colors.neutral400}
              keyboardType="number-pad"
              maxLength={6}
              editable={timeLeft > 0 && !isPhoneVerified}
              style={styles.codeInput}
              onChangeText={onCodeChange}
            />
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          </View>
          <Text
            style={[
              styles.phoneStatus,
              isPhoneVerified && styles.validationActive,
              timeLeft <= 0 && styles.errorText,
            ]}
          >
            {isVerifyingPhone
              ? "인증번호 확인 중..."
              : isPhoneVerified
                ? "✓ 인증이 완료되었습니다."
                : timeLeft <= 0
                  ? "인증 시간이 만료되었습니다. 인증번호를 다시 받아주세요."
                  : ""}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerSide: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.neutral900,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  form: {
    gap: 16,
  },
  fieldLabel: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  description: {
    color: colors.neutral500,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  disabledInput: {
    backgroundColor: colors.neutral100,
    color: colors.neutral500,
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  validationText: {
    color: colors.neutral400,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  validationActive: {
    color: colors.primary400,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  phoneButton: {
    width: 126,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneButtonEnabled: {
    backgroundColor: colors.primary400,
    borderColor: colors.primary400,
  },
  phoneButtonDisabled: {
    backgroundColor: colors.neutral300,
    borderColor: colors.neutral300,
  },
  phoneButtonText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  phoneButtonTextEnabled: {
    color: colors.white,
  },
  phoneButtonTextDisabled: {
    color: colors.neutral600,
  },
  codeInputWrap: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.neutral400,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  codeInput: {
    flex: 1,
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    padding: 0,
  },
  timer: {
    color: colors.neutral500,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  phoneStatus: {
    color: colors.neutral500,
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 12,
    marginTop: 4,
  },
  birthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  birthInput: {
    width: 177,
  },
  genderInput: {
    width: 43,
    paddingHorizontal: 0,
  },
  dash: {
    color: colors.neutral900,
    fontSize: 15,
    fontWeight: "600",
  },
  maskDots: {
    flexDirection: "row",
    gap: 8,
  },
  maskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral600,
  },
  submitButton: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitEnabled: {
    backgroundColor: colors.primary400,
  },
  submitDisabled: {
    backgroundColor: colors.neutral300,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  submitTextEnabled: {
    color: colors.white,
  },
  submitTextDisabled: {
    color: colors.neutral600,
  },
  errorText: {
    color: colors.error,
  },
  pressed: {
    opacity: 0.82,
  },
});
