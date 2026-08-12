import {
  BookOpenText,
  CirclesThree,
  ClockCountdown,
  CompassRose,
  FlowerLotus,
  GridNine,
  IdentificationCard,
  Planet,
  SlidersHorizontal,
  StarFour,
  YinYang,
  type Icon,
} from "@phosphor-icons/react";

export interface PaipanItem {
  name: string;
  icon: Icon;
  enabled: boolean;
  path?: string;
}

export const PAIPAN_ITEMS: readonly PaipanItem[] = [
  {
    name: "生平子时",
    icon: ClockCountdown,
    enabled: true,
    path: "/paipan/shengping-zishi",
  },
  { name: "遁甲学", icon: BookOpenText, enabled: true, path: "/paipan/dunjia" },
  { name: "决策学", icon: GridNine, enabled: true, path: "/paipan/juece" },
  { name: "阴盘决策", icon: YinYang, enabled: true, path: "/paipan/yinpan-juece" },
  { name: "梅花学", icon: FlowerLotus, enabled: true, path: "/paipan/meihua" },
  { name: "逻辑学", icon: CirclesThree, enabled: true, path: "/paipan/luoji" },
  { name: "星像学", icon: Planet, enabled: false },
  { name: "姓名学", icon: IdentificationCard, enabled: false },
  { name: "数字规律", icon: SlidersHorizontal, enabled: false },
  { name: "山向决策", icon: CompassRose, enabled: true, path: "/paipan/shanxiang-juece" },
  { name: "玄空飞星", icon: StarFour, enabled: false },
] as const;
