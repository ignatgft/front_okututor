import { ViewStyle, TextStyle } from "react-native";
import { spacing } from "./spacing";

export const shadows = {
  xs: {
    shadowColor: "#101727",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sm: {
    shadowColor: "#101727",
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: "#101727",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const satisfies Record<string, ViewStyle>;

export const sizes = {
  touchTarget: 44,
  headerHeight: 64,
  tabBarHeight: 60,
  cardGap: spacing[4],
  pagePadding: spacing[4],
  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 72,
} as const;

export type ComponentStyle = ViewStyle | TextStyle;