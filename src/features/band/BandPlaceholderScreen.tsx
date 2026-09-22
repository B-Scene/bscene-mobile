import { AppHeader } from "@/shared/components/AppHeader";
import { AppState } from "@/shared/components/AppState";
import { Screen } from "@/shared/components/Screen";

type BandPlaceholderScreenProps = {
  title: string;
  description: string;
};

export function BandPlaceholderScreen({
  title,
  description,
}: BandPlaceholderScreenProps) {
  return (
    <Screen>
      <AppHeader title={title} showBack={false} />
      <AppState title={title} description={description} />
    </Screen>
  );
}
