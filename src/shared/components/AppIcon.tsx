import { SvgXml } from "react-native-svg";

import { svgIcons, type SvgIconName } from "@/shared/constants/svgIcons";

type AppIconProps = {
  name: SvgIconName;
  size?: number;
  width?: number;
  height?: number;
};

export function AppIcon({ name, size = 24, width, height }: AppIconProps) {
  return (
    <SvgXml
      xml={svgIcons[name]}
      width={width ?? size}
      height={height ?? size}
    />
  );
}
