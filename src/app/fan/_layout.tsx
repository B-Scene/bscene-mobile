import { ModeTabLayout } from "@/features/navigation/ModeTabLayout";
import { ProtectedModeRoute } from "@/features/navigation/ProtectedModeRoute";

export default function FanLayout() {
  return (
    <ProtectedModeRoute mode="fan">
      <ModeTabLayout mode="fan" />
    </ProtectedModeRoute>
  );
}
