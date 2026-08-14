declare module "lunar-javascript" {
  interface LunarMonth {
    getMonth(): number;
    getDayCount(): number;
  }

  interface LunarYearValue {
    getMonthsInYear(): LunarMonth[];
  }

  export const LunarYear: {
    fromYear(year: number): LunarYearValue;
  };
}
