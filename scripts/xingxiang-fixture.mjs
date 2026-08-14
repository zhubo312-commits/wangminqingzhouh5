const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const names = ["交友", "迁移", "疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄"];
const palaceNames = branches.map((branch, index) => ({ branch, name: names[index] }));
const transformations = [{ transformation: "禄", star: "巨门", targetBranch: "巳" }, { transformation: "权", star: "太阳", targetBranch: "亥" }, { transformation: "科", star: "文曲", targetBranch: "戌" }, { transformation: "忌", star: "文昌", targetBranch: "辰" }];
const monthNames = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
const monthGanZhi = ["甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥", "甲子", "乙丑"];
const months = branches.map((palaceBranch, index) => ({ monthNumber: index + 1, monthName: monthNames[index], ganZhi: monthGanZhi[index], palaceBranch }));
const annuals = Array.from({ length: 10 }, (_, index) => ({ age: 5 + index, year: 1993 + index, ganZhi: ["癸酉", "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午"][index], palaceNames, transformations, months }));

export const xingxiangChart = {
  profile: { name: "测试", gender: "male", genderLabel: "男", yinYangGender: "阴男", solarDateTime: "1990-01-01 12:00", lunarDate: "一九八九年腊月初五日午时", fiveElementsBureau: "土五局", pillars: { year: "己巳", month: "丙子", day: "丙寅", hour: "甲午" } },
  palaces: branches.map((branch, index) => ({
    branch,
    name: names[index],
    heavenlyStem: ["丙", "丁", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"][index],
    bodyPalace: branch === "未",
    zodiacPalace: false,
    originPalace: branch === "巳",
    stars: [
      { name: ["破军", "天机", "紫微", "太阴", "贪狼", "巨门", "廉贞", "天梁", "七杀", "天同", "武曲", "太阳"][index], category: "major", brightness: index % 2 ? "旺" : "庙", natalTransformation: index === 4 ? "权" : null },
      { name: ["台辅", "天魁", "天府", "左辅", "文昌", "地劫", "天相", "擎羊", "天钺", "火星", "文曲", "右弼"][index], category: "support", brightness: "", natalTransformation: null },
      { name: ["天姚", "解神", "天月", "天喜", "铃星", "地空", "禄存", "阴煞", "天刑", "天官", "红鸾", "天巫"][index], category: "flower", brightness: "", natalTransformation: null },
    ],
    flyingTransformations: transformations,
    selfTransformations: index === 0 ? [{ transformation: "忌", star: "廉贞", targetBranch: "午", inward: false, direction: "inward" }] : index === 1 ? [{ transformation: "科", star: "天机", targetBranch: "丑", inward: true, direction: "outward" }] : [],
  })),
  periods: Array.from({ length: 12 }, (_, index) => ({ ganZhi: ["辛未", "庚午", "己巳", "戊辰", "丁卯", "丙寅", "乙丑", "甲子", "癸亥", "壬戌", "辛酉", "庚申"][index], startAge: 5 + index * 10, endAge: 14 + index * 10, startYear: 1993 + index * 10, endYear: 2002 + index * 10, palaceNames, transformations, annuals: annuals.map((annual) => ({ ...annual, age: annual.age + index * 10, year: annual.year + index * 10 })) })),
};

export const xingxiangRequest = { name: "测试", gender: "male", birthDateTime: "1990-01-01 12:00", school: "flying" };
