import { Image } from "expo-image";
import type { StyleProp, ImageStyle } from "react-native";

const icons = {
  swap: [require("../../../assets/images/fan/home-swap.svg"), 24, 24],
  calendar: [require("../../../assets/images/fan/calendar.svg"), 24, 24],
  notification: [require("../../../assets/images/fan/notification.svg"), 24, 24],
  notificationUnread: [require("../../../assets/images/fan/notification-unread.svg"), 25, 25],
  newsGuitar: [require("../../../assets/images/fan/news-guitar.svg"), 13.09, 13],
  poster: [require("../../../assets/images/fan/poster-placeholder.svg"), 12, 12],
  location: [require("../../../assets/images/fan/concert-location.svg"), 14, 14],
  concertArrow: [require("../../../assets/images/fan/concert-arrow.svg"), 24, 24],
  moreArrow: [require("../../../assets/images/fan/more-arrow.svg"), 24, 24],
  searchField: [require("../../../assets/images/fan/search-field.svg"), 16, 16],
  searchFieldActive: [require("../../../assets/images/fan/search-field-active.svg"), 16, 16],
  searchClear: [require("../../../assets/images/fan/search-clear.svg"), 16, 16],
  searchRecentRemove: [require("../../../assets/images/fan/search-recent-remove.svg"), 8, 8],
  search: [require("../../../assets/images/fan/search.svg"), 24, 24],
  filter: [require("../../../assets/images/fan/filter.svg"), 22, 22],
  sortArrow: [require("../../../assets/images/fan/sort-arrow.svg"), 10.5416, 6.24659],
  tabHome: [require("../../../assets/images/fan/nav-home.svg"), 24, 24],
  tabHomeActive: [require("../../../assets/images/fan/nav-home-active.svg"), 24, 24],
  tabExplore: [require("../../../assets/images/fan/nav-explore.svg"), 24, 24],
  tabExploreActive: [require("../../../assets/images/fan/nav-explore-active.svg"), 24, 24],
  tabMusic: [require("../../../assets/images/fan/nav-music.svg"), 7.99992, 11],
  tabMusicActive: [require("../../../assets/images/fan/nav-music-active.svg"), 7.99992, 11],
  tabLive: [require("../../../assets/images/fan/nav-live.svg"), 24, 24],
  tabMy: [require("../../../assets/images/fan/nav-my.svg"), 24, 24],
  guideCircleGlow: [require("../../../assets/images/fan/guide-explore-search-glow.svg"), 62, 62],
  exploreGuideSearchArrow: [require("../../../assets/images/fan/guide-explore-search-arrow.svg"), 18, 14.7279],
  homeGuideDot: [require("../../../assets/images/fan/home-guide-dot.svg"), 12, 12],
  homeGuideDotActive: [require("../../../assets/images/fan/home-guide-dot-active.svg"), 12, 12],
  guideClose: [require("../../../assets/images/fan/guide-close.svg"), 20.0116, 20.0099],
  guideUp: [require("../../../assets/images/fan/guide-up.svg"), 17, 14.7279],
  guideArrow: [require("../../../assets/images/fan/guide-right.svg"), 20, 14.7279],
  homeGuideConcertArrow: [require("../../../assets/images/fan/home-guide-concert-arrow.svg"), 20, 14.7279],
  guideDown: [require("../../../assets/images/fan/guide-down.svg"), 20, 14.7279],
  guideNext: [require("../../../assets/images/fan/guide-next.svg"), 26.6667, 26.6667],
  guidePrevious: [require("../../../assets/images/fan/guide-previous.svg"), 26.6667, 26.6667],
} as const;

export function FanDesignIcon({
  name,
  style,
  tintColor,
}: {
  name: keyof typeof icons;
  style?: StyleProp<ImageStyle>;
  tintColor?: string;
}) {
  const [source, width, height] = icons[name];

  return (
    <Image
      accessible={false}
      source={source}
      contentFit="contain"
      tintColor={tintColor}
      style={[style, { width, height }]}
    />
  );
}
