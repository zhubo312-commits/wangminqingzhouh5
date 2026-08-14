const COMPOUND_SURNAMES = [
  "万俟", "萬俟", "司马", "司馬", "上官", "欧阳", "歐陽", "夏侯", "诸葛", "諸葛",
  "闻人", "聞人", "东方", "東方", "赫连", "赫連", "皇甫", "尉迟", "尉遲", "公羊",
  "澹台", "澹臺", "公冶", "宗政", "濮阳", "濮陽", "淳于", "淳於", "单于", "單于",
  "太叔", "申屠", "公孙", "公孫", "仲孙", "仲孫", "轩辕", "軒轅", "令狐", "钟离",
  "鍾離", "鐘離", "宇文", "长孙", "長孫", "慕容", "鲜于", "鮮于", "闾丘", "閭丘",
  "司徒", "司空", "丌官", "司寇", "仉督", "子车", "子車", "颛孙", "顓孫", "端木",
  "巫马", "巫馬", "公西", "漆雕", "乐正", "樂正", "壤驷", "壤駟", "公良", "拓跋",
  "夹谷", "夾谷", "宰父", "谷梁", "穀梁", "段干", "段幹", "百里", "东郭", "東郭",
  "南门", "南門", "呼延", "归海", "歸海", "羊舌", "微生", "梁丘", "左丘", "东门",
  "東門", "西门", "西門", "南宫", "南宮", "第五",
] as const;

const compoundSurnameSet = new Set<string>(COMPOUND_SURNAMES);

export function normalizeChineseFullName(value: string) {
  return [...value.replace(/\s+/gu, "")].slice(0, 5).join("");
}

export function splitChineseFullName(value: string) {
  const fullName = normalizeChineseFullName(value);
  const characters = [...fullName];
  if (characters.length === 0) return { surname: "", givenName: "" };

  const possibleCompoundSurname = characters.slice(0, 2).join("");
  if (characters.length >= 3 && compoundSurnameSet.has(possibleCompoundSurname)) {
    return { surname: possibleCompoundSurname, givenName: characters.slice(2).join("") };
  }

  return { surname: characters[0] ?? "", givenName: characters.slice(1).join("") };
}
