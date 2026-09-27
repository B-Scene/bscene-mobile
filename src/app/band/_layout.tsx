import { ModeTabLayout } from "@/features/navigation/ModeTabLayout";
import { ProtectedModeRoute } from "@/features/navigation/ProtectedModeRoute";

export default function BandLayout() {
  return (
    <ProtectedModeRoute mode="band">
      <ModeTabLayout mode="band" />
    </ProtectedModeRoute>
  );
}
