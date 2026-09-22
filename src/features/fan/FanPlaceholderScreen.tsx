import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";

type FanPlaceholderScreenProps = {
  title: string;
  description: string;
};

export function FanPlaceholderScreen({
  title,
  description,
}: FanPlaceholderScreenProps) {
  return (
    <Screen>
      <AppHeader title={title} showBack={false} />
      <AppState title={title} description={description} />
    </Screen>
  );
}
