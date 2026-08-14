const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export const JIA_ZI = Array.from({ length: 60 }, (_, index) =>
  `${STEMS[index % STEMS.length]}${BRANCHES[index % BRANCHES.length]}`,
);
