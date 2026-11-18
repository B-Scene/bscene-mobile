import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgLive = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 27 12"
    {...props}
  >
    <Rect width={27} height={12} fill="#FBB10E" rx={6} />
    <Path
      fill="#fff"
      d="M6.695 8V3.05h.888v4.198h2.188V8zm4.676-4.95V8h-.89V3.05zm1.579 0 1.285 3.904h.055l1.292-3.903h.977L14.81 8h-1.094l-1.743-4.95zM17.147 8V3.05h3.22v.746h-2.331v1.353h2.16v.746h-2.16v1.353h2.344V8z"
    />
  </Svg>
);
export default SvgLive;

