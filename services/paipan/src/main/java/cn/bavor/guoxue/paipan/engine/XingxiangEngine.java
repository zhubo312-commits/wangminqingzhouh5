package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.XingxiangModels.*;

import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
/**
 * 飞星紫微排盘核心。
 *
 * <p>安宫、五行局、安星、四化和运限规则按 MIT 授权的 iztro 2.5.8 可审计实现移植；
 * 对应源码快照固化在 docs/xingxiang-golden/upstream/iztro-2.5.8。参考站仅用于字段筛选、
 * 晚子时口径和三例全字段黄金回归，运行时不依赖参考站。</p>
 */
public class XingxiangEngine {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter
            .ofPattern("uuuu-MM-dd HH:mm")
            .withResolverStyle(ResolverStyle.STRICT);
    private static final String STEMS = "甲乙丙丁戊己庚辛壬癸";
    private static final String BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
    private static final List<String> PALACE_NAMES = List.of(
            "命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄",
            "迁移", "交友", "官禄", "田宅", "福德", "父母");
    private static final List<String> TRANSFORMATIONS = List.of("禄", "权", "科", "忌");
    private static final List<String> MONTH_NAMES = List.of(
            "正月", "二月", "三月", "四月", "五月", "六月",
            "七月", "八月", "九月", "十月", "冬月", "腊月");
    private static final Map<Character, List<String>> MUTAGENS = Map.ofEntries(
            Map.entry('甲', List.of("廉贞", "破军", "武曲", "太阳")),
            Map.entry('乙', List.of("天机", "天梁", "紫微", "太阴")),
            Map.entry('丙', List.of("天同", "天机", "文昌", "廉贞")),
            Map.entry('丁', List.of("太阴", "天同", "天机", "巨门")),
            Map.entry('戊', List.of("贪狼", "太阴", "右弼", "天机")),
            Map.entry('己', List.of("武曲", "贪狼", "天梁", "文曲")),
            Map.entry('庚', List.of("太阳", "武曲", "太阴", "天同")),
            Map.entry('辛', List.of("巨门", "太阳", "文曲", "文昌")),
            Map.entry('壬', List.of("天梁", "紫微", "左辅", "武曲")),
            Map.entry('癸', List.of("破军", "巨门", "太阴", "贪狼")));
    private static final Map<String, List<String>> BRIGHTNESS = brightness();

    public ChartResponse chart(ChartRequest request) {
        if (request == null) throw new IllegalArgumentException("请填写完整出生信息");
        LocalDateTime dateTime = parseDateTime(request.birthDateTime());
        if (dateTime.getYear() < 1900 || dateTime.getYear() > 2100) {
            throw new IllegalArgumentException("出生年份仅支持 1900 至 2100 年");
        }
        // 飞星盘采用晚子时换日：23:00 起按次日历日安星与取日柱，展示的公历输入保持不变。
        LocalDateTime calculationTime = dateTime.getHour() == 23
                ? dateTime.plusDays(1).withHour(0)
                : dateTime;
        Solar solar = Solar.fromYmdHms(
                calculationTime.getYear(), calculationTime.getMonthValue(), calculationTime.getDayOfMonth(),
                calculationTime.getHour(), calculationTime.getMinute(), 0);
        Lunar lunar = solar.getLunar();
        int timeIndex = timeIndex(dateTime.getHour());
        int lunarMonthIndex = Math.abs(lunar.getMonth()) - 1;
        int flowMonthBirthMonth = Math.abs(lunar.getMonth())
                + (lunar.getMonth() < 0 && lunar.getDay() > 15 ? 1 : 0);
        int birthHourBranchIndex = BRANCHES.indexOf(lunar.getTimeZhi());
        int yearStemIndex = STEMS.indexOf(lunar.getYearGan());
        int yearBranchIndex = BRANCHES.indexOf(lunar.getYearZhi());
        if (yearStemIndex < 0 || yearBranchIndex < 0) throw new IllegalStateException("无法识别出生年干支");

        int soulIndex = fix(lunarMonthIndex - timeIndex);
        int bodyIndex = fix(lunarMonthIndex + timeIndex);
        int tigerStem = switch (yearStemIndex % 5) {
            case 0 -> 2;
            case 1 -> 4;
            case 2 -> 6;
            case 3 -> 8;
            default -> 0;
        };
        int[] palaceStemIndices = new int[12];
        for (int index = 0; index < 12; index++) palaceStemIndices[index] = (tigerStem + index) % 10;
        String bureau = fiveElementsBureau(palaceStemIndices[soulIndex], branchAtPalace(soulIndex));

        List<List<Star>> stars = emptyStars();
        placeMajorStars(stars, lunar.getDay(), bureau, lunar.getYearGan());
        placeMinorStars(stars, lunarMonthIndex, timeIndex, lunar.getYearGan(), lunar.getYearZhi());
        placeSelectedAdjectiveStars(stars, lunarMonthIndex, timeIndex, lunar.getYearGan(), lunar.getYearZhi());

        List<Palace> palaces = new ArrayList<>(12);
        for (int index = 0; index < 12; index++) {
            String branch = String.valueOf(branchAtPalace(index));
            String stem = String.valueOf(STEMS.charAt(palaceStemIndices[index]));
            List<Star> palaceStars = List.copyOf(stars.get(index));
            palaces.add(new Palace(
                    branch,
                    PALACE_NAMES.get(fix(soulIndex - index)),
                    stem,
                    index == bodyIndex,
                    false,
                    !"子丑".contains(branch) && stem.charAt(0) == lunar.getYearGan().charAt(0),
                    palaceStars,
                    transformations(stem.charAt(0), stars),
                    selfTransformations(index, palaceStemIndices[index], stars)));
        }

        String genderLabel = "male".equals(request.gender()) ? "男" : "女";
        String yinYangGender = (yearStemIndex % 2 == 0 ? "阳" : "阴") + genderLabel;
        Profile profile = new Profile(
                request.name().trim(), request.gender(), genderLabel, yinYangGender,
                request.birthDateTime(),
                lunar.getYearInChinese() + "年" + lunar.getMonthInChinese() + "月"
                        + lunar.getDayInChinese() + "日" + lunar.getTimeZhi() + "时",
                bureau,
                new Pillars(
                        lunar.getYearInGanZhi(), lunar.getMonthInGanZhi(),
                        lunar.getDayInGanZhi(), lunar.getTimeInGanZhi()));
        return new ChartResponse(profile, List.copyOf(palaces), periods(
                soulIndex, palaceStemIndices, bureau, lunar.getYear(),
                request.gender(), yearBranchIndex, stars,
                flowMonthBirthMonth, birthHourBranchIndex));
    }

    private void placeMajorStars(
            List<List<Star>> stars,
            int lunarDay,
            String bureau,
            String yearStem) {
        int bureauNumber = bureauNumber(bureau);
        int offset = 0;
        while ((lunarDay + offset) % bureauNumber != 0) offset++;
        int quotient = ((lunarDay + offset) / bureauNumber) % 12;
        int ziweiIndex = fix(quotient - 1 + (offset % 2 == 0 ? offset : -offset));
        int tianfuIndex = fix(12 - ziweiIndex);
        String[] ziweiGroup = {"紫微", "天机", null, "太阳", "武曲", "天同", null, null, "廉贞"};
        String[] tianfuGroup = {"天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", null, null, null, "破军"};
        for (int index = 0; index < ziweiGroup.length; index++) {
            if (ziweiGroup[index] != null) addStar(stars, fix(ziweiIndex - index), ziweiGroup[index], "major", yearStem);
        }
        for (int index = 0; index < tianfuGroup.length; index++) {
            if (tianfuGroup[index] != null) addStar(stars, fix(tianfuIndex + index), tianfuGroup[index], "major", yearStem);
        }
    }

    private void placeMinorStars(
            List<List<Star>> stars,
            int lunarMonthIndex,
            int timeIndex,
            String yearStem,
            String yearBranch) {
        int zuo = fix(branchToPalace('辰') + lunarMonthIndex);
        int you = fix(branchToPalace('戌') - lunarMonthIndex);
        int chang = fix(branchToPalace('戌') - fix(timeIndex));
        int qu = fix(branchToPalace('辰') + fix(timeIndex));
        int[] kuiYue = kuiYue(yearStem.charAt(0));
        int[] huoLing = huoLing(yearBranch.charAt(0), timeIndex);
        int kong = fix(branchToPalace('亥') - fix(timeIndex));
        int jie = fix(branchToPalace('亥') + fix(timeIndex));
        int[] luYangTuoMa = luYangTuoMa(yearStem.charAt(0), yearBranch.charAt(0));
        addStar(stars, zuo, "左辅", "soft", yearStem);
        addStar(stars, you, "右弼", "soft", yearStem);
        addStar(stars, chang, "文昌", "soft", yearStem);
        addStar(stars, qu, "文曲", "soft", yearStem);
        addStar(stars, kuiYue[0], "天魁", "soft", yearStem);
        addStar(stars, kuiYue[1], "天钺", "soft", yearStem);
        addStar(stars, luYangTuoMa[0], "禄存", "flower", yearStem);
        addStar(stars, luYangTuoMa[3], "天马", "flower", yearStem);
        addStar(stars, kong, "地空", "tough", yearStem);
        addStar(stars, jie, "地劫", "tough", yearStem);
        addStar(stars, huoLing[0], "火星", "tough", yearStem);
        addStar(stars, huoLing[1], "铃星", "tough", yearStem);
        addStar(stars, luYangTuoMa[1], "擎羊", "tough", yearStem);
        addStar(stars, luYangTuoMa[2], "陀罗", "tough", yearStem);
    }

    private void placeSelectedAdjectiveStars(
            List<List<Star>> stars,
            int month,
            int time,
            String yearStem,
            String yearBranch) {
        int yearBranchIndex = BRANCHES.indexOf(yearBranch.charAt(0));
        addStar(stars, fix(branchToPalace('卯') - yearBranchIndex), "红鸾", "flower", yearStem);
        addStar(stars, fix(branchToPalace('卯') - yearBranchIndex + 6), "天喜", "flower", yearStem);
        addStar(stars, fix(branchToPalace('丑') + month), "天姚", "flower", yearStem);
        addStar(stars, fix(branchToPalace('酉') + month), "天刑", "support", yearStem);
        char[] monthSolution = "申申戌戌子子寅寅辰辰午午".toCharArray();
        addStar(stars, branchToPalace(monthSolution[month]), "解神", "support", yearStem);
        char[] yinSha = "寅子戌申午辰寅子戌申午辰".toCharArray();
        char[] tianYue = "戌巳辰寅未卯亥未寅午戌寅".toCharArray();
        char[] tianWu = "巳申寅亥巳申寅亥巳申寅亥".toCharArray();
        addStar(stars, branchToPalace(yinSha[month]), "阴煞", "support", yearStem);
        addStar(stars, branchToPalace(tianYue[month]), "天月", "support", yearStem);
        addStar(stars, branchToPalace(tianWu[month]), "天巫", "support", yearStem);
        addStar(stars, fix(branchToPalace('午') + fix(time)), "台辅", "support", yearStem);
        addStar(stars, fix(branchToPalace('寅') + fix(time)), "封诰", "support", yearStem);
        int stemIndex = STEMS.indexOf(yearStem.charAt(0));
        char[] tianGuan = "未辰巳寅卯酉亥酉戌午".toCharArray();
        char[] tianFu = "酉申子亥卯寅午巳午巳".toCharArray();
        addStar(stars, branchToPalace(tianGuan[stemIndex]), "天官", "support", yearStem);
        addStar(stars, branchToPalace(tianFu[stemIndex]), "天福", "support", yearStem);
    }

    private List<SelfTransformation> selfTransformations(
            int palaceIndex,
            int palaceStemIndex,
            List<List<Star>> stars) {
        List<String> mutagens = MUTAGENS.get(STEMS.charAt(palaceStemIndex));
        List<SelfTransformation> result = new ArrayList<>();
        for (int index = 0; index < mutagens.size(); index++) {
            String star = mutagens.get(index);
            if (containsStar(stars.get(palaceIndex), star)) {
                result.add(new SelfTransformation(
                        TRANSFORMATIONS.get(index), star, true, "outward",
                        String.valueOf(branchAtPalace(palaceIndex))));
            } else if (containsStar(stars.get(fix(palaceIndex + 6)), star)) {
                result.add(new SelfTransformation(
                        TRANSFORMATIONS.get(index), star, false, "inward",
                        String.valueOf(branchAtPalace(fix(palaceIndex + 6)))));
            }
        }
        return List.copyOf(result);
    }

    private List<Period> periods(
            int soulIndex,
            int[] palaceStemIndices,
            String bureau,
            int lunarYear,
            String gender,
            int yearBranchIndex,
            List<List<Star>> stars,
            int flowMonthBirthMonth,
            int birthHourBranchIndex) {
        int bureauNumber = bureauNumber(bureau);
        boolean forward = ("male".equals(gender) && yearBranchIndex % 2 == 0)
                || ("female".equals(gender) && yearBranchIndex % 2 == 1);
        List<Period> result = new ArrayList<>(12);
        for (int sequence = 0; sequence < 12; sequence++) {
            int palaceIndex = fix(soulIndex + (forward ? sequence : -sequence));
            int branchIndex = (palaceIndex + 2) % 12;
            int startAge = bureauNumber + sequence * 10;
            int startYear = lunarYear + startAge - 1;
            String ganZhi = "" + STEMS.charAt(palaceStemIndices[palaceIndex]) + BRANCHES.charAt(branchIndex);
            List<Annual> annuals = new ArrayList<>(10);
            for (int offset = 0; offset < 10; offset++) {
                int year = startYear + offset;
                String yearGanZhi = Solar.fromYmd(year, 6, 1).getLunar().getYearInGanZhi();
                int annualBranch = BRANCHES.indexOf(yearGanZhi.charAt(1));
                annuals.add(new Annual(
                        startAge + offset,
                        year,
                        yearGanZhi,
                        palaceNamesAt(annualBranch),
                        transformations(yearGanZhi.charAt(0), stars),
                        flowMonths(yearGanZhi, flowMonthBirthMonth, birthHourBranchIndex)));
            }
            result.add(new Period(
                    ganZhi,
                    startAge,
                    startAge + 9,
                    startYear,
                    startYear + 9,
                    palaceNamesAt(branchIndex),
                    transformations(ganZhi.charAt(0), stars),
                    List.copyOf(annuals)));
        }
        return List.copyOf(result);
    }

    private List<PalaceName> palaceNamesAt(int soulBranchIndex) {
        List<PalaceName> result = new ArrayList<>(12);
        for (int branch = 0; branch < 12; branch++) {
            result.add(new PalaceName(
                    String.valueOf(BRANCHES.charAt(branch)),
                    PALACE_NAMES.get(fix(soulBranchIndex - branch))));
        }
        return List.copyOf(result);
    }

    private List<Transformation> transformations(char stem, List<List<Star>> stars) {
        List<String> names = MUTAGENS.get(stem);
        List<Transformation> result = new ArrayList<>(4);
        for (int index = 0; index < 4; index++) {
            String star = names.get(index);
            result.add(new Transformation(
                    TRANSFORMATIONS.get(index), star, branchOfStar(stars, star)));
        }
        return List.copyOf(result);
    }

    private List<FlowMonth> flowMonths(
            String yearGanZhi,
            int birthLunarMonth,
            int birthHourBranchIndex) {
        int yearStemIndex = STEMS.indexOf(yearGanZhi.charAt(0));
        int yearBranchIndex = BRANCHES.indexOf(yearGanZhi.charAt(1));
        int tigerStem = switch (yearStemIndex % 5) {
            case 0 -> 2;
            case 1 -> 4;
            case 2 -> 6;
            case 3 -> 8;
            default -> 0;
        };
        int firstMonthPalaceBranch = fix(
                yearBranchIndex - birthLunarMonth + birthHourBranchIndex + 1);
        List<FlowMonth> result = new ArrayList<>(12);
        for (int index = 0; index < 12; index++) {
            String ganZhi = "" + STEMS.charAt((tigerStem + index) % 10)
                    + BRANCHES.charAt(fix(index + 2));
            result.add(new FlowMonth(
                    index + 1,
                    MONTH_NAMES.get(index),
                    ganZhi,
                    String.valueOf(BRANCHES.charAt(fix(firstMonthPalaceBranch + index)))));
        }
        return List.copyOf(result);
    }

    private String branchOfStar(List<List<Star>> stars, String target) {
        for (int palaceIndex = 0; palaceIndex < stars.size(); palaceIndex++) {
            if (containsStar(stars.get(palaceIndex), target)) {
                return String.valueOf(branchAtPalace(palaceIndex));
            }
        }
        throw new IllegalStateException("四化目标星未入盘：" + target);
    }

    private void addStar(
            List<List<Star>> stars,
            int palaceIndex,
            String name,
            String category,
            String yearStem) {
        List<String> natal = MUTAGENS.get(yearStem.charAt(0));
        int mutagenIndex = natal.indexOf(name);
        String transformation = mutagenIndex < 0 ? null : TRANSFORMATIONS.get(mutagenIndex);
        stars.get(fix(palaceIndex)).add(new Star(
                name,
                category,
                brightness(name, fix(palaceIndex)),
                transformation));
    }

    private String brightness(String star, int palaceIndex) {
        List<String> values = BRIGHTNESS.get(star);
        return values == null ? "" : values.get(fix(palaceIndex));
    }

    private int[] kuiYue(char stem) {
        return switch (stem) {
            case '甲', '戊', '庚' -> new int[]{branchToPalace('丑'), branchToPalace('未')};
            case '乙', '己' -> new int[]{branchToPalace('子'), branchToPalace('申')};
            case '辛' -> new int[]{branchToPalace('午'), branchToPalace('寅')};
            case '丙', '丁' -> new int[]{branchToPalace('亥'), branchToPalace('酉')};
            case '壬', '癸' -> new int[]{branchToPalace('卯'), branchToPalace('巳')};
            default -> throw new IllegalArgumentException("无法识别出生年天干");
        };
    }

    private int[] huoLing(char branch, int time) {
        int huo;
        int ling;
        if ("寅午戌".indexOf(branch) >= 0) {
            huo = branchToPalace('丑');
            ling = branchToPalace('卯');
        } else if ("申子辰".indexOf(branch) >= 0) {
            huo = branchToPalace('寅');
            ling = branchToPalace('戌');
        } else if ("巳酉丑".indexOf(branch) >= 0) {
            huo = branchToPalace('卯');
            ling = branchToPalace('戌');
        } else {
            huo = branchToPalace('酉');
            ling = branchToPalace('戌');
        }
        return new int[]{fix(huo + time), fix(ling + time)};
    }

    private int[] luYangTuoMa(char stem, char branch) {
        int lu = switch (stem) {
            case '甲' -> branchToPalace('寅');
            case '乙' -> branchToPalace('卯');
            case '丙', '戊' -> branchToPalace('巳');
            case '丁', '己' -> branchToPalace('午');
            case '庚' -> branchToPalace('申');
            case '辛' -> branchToPalace('酉');
            case '壬' -> branchToPalace('亥');
            case '癸' -> branchToPalace('子');
            default -> throw new IllegalArgumentException("无法识别出生年天干");
        };
        int horse;
        if ("寅午戌".indexOf(branch) >= 0) horse = branchToPalace('申');
        else if ("申子辰".indexOf(branch) >= 0) horse = branchToPalace('寅');
        else if ("巳酉丑".indexOf(branch) >= 0) horse = branchToPalace('亥');
        else horse = branchToPalace('巳');
        return new int[]{lu, fix(lu + 1), fix(lu - 1), horse};
    }

    private String fiveElementsBureau(int stemIndex, char branch) {
        int stemNumber = stemIndex / 2 + 1;
        int branchNumber = (BRANCHES.indexOf(branch) % 6) / 2 + 1;
        int value = stemNumber + branchNumber;
        while (value > 5) value -= 5;
        return switch (value) {
            case 1 -> "木三局";
            case 2 -> "金四局";
            case 3 -> "水二局";
            case 4 -> "火六局";
            default -> "土五局";
        };
    }

    private int bureauNumber(String bureau) {
        return switch (bureau.charAt(1)) {
            case '二' -> 2;
            case '三' -> 3;
            case '四' -> 4;
            case '五' -> 5;
            case '六' -> 6;
            default -> throw new IllegalArgumentException("无法识别五行局");
        };
    }

    private LocalDateTime parseDateTime(String value) {
        try {
            return LocalDateTime.parse(value, DATE_TIME);
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("出生日期时间无效", exception);
        }
    }

    private int timeIndex(int hour) {
        if (hour == 0) return 0;
        if (hour == 23) return 12;
        return (hour + 1) / 2;
    }

    private char branchAtPalace(int palaceIndex) {
        return BRANCHES.charAt(fix(palaceIndex + 2));
    }

    private int branchToPalace(char branch) {
        return fix(BRANCHES.indexOf(branch) - 2);
    }

    private int fix(int value) {
        int result = value % 12;
        return result < 0 ? result + 12 : result;
    }

    private boolean containsStar(List<Star> stars, String target) {
        return stars.stream().anyMatch(star -> star.name().equals(target));
    }

    private List<List<Star>> emptyStars() {
        List<List<Star>> stars = new ArrayList<>(12);
        for (int index = 0; index < 12; index++) stars.add(new ArrayList<>());
        return stars;
    }

    private static Map<String, List<String>> brightness() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        result.put("紫微", List.of("旺", "旺", "得", "旺", "庙", "庙", "旺", "旺", "得", "旺", "平", "庙"));
        result.put("天机", List.of("得", "旺", "利", "平", "庙", "陷", "得", "旺", "利", "平", "庙", "陷"));
        result.put("太阳", List.of("旺", "庙", "旺", "旺", "旺", "得", "得", "陷", "不", "陷", "陷", "不"));
        result.put("武曲", List.of("得", "利", "庙", "平", "旺", "庙", "得", "利", "庙", "平", "旺", "庙"));
        result.put("天同", List.of("利", "平", "平", "庙", "陷", "不", "旺", "平", "平", "庙", "旺", "不"));
        result.put("廉贞", List.of("庙", "平", "利", "陷", "平", "利", "庙", "平", "利", "陷", "平", "利"));
        result.put("天府", List.of("庙", "得", "庙", "得", "旺", "庙", "得", "旺", "庙", "得", "庙", "庙"));
        result.put("太阴", List.of("旺", "陷", "陷", "陷", "不", "不", "利", "不", "旺", "庙", "庙", "庙"));
        result.put("贪狼", List.of("平", "利", "庙", "陷", "旺", "庙", "平", "利", "庙", "陷", "旺", "庙"));
        result.put("巨门", List.of("庙", "庙", "陷", "旺", "旺", "不", "庙", "庙", "陷", "旺", "旺", "不"));
        result.put("天相", List.of("庙", "陷", "得", "得", "庙", "得", "庙", "陷", "得", "得", "庙", "庙"));
        result.put("天梁", List.of("庙", "庙", "庙", "陷", "庙", "旺", "陷", "得", "庙", "陷", "庙", "旺"));
        result.put("七杀", List.of("庙", "旺", "庙", "平", "旺", "庙", "庙", "庙", "庙", "平", "旺", "庙"));
        result.put("破军", List.of("得", "陷", "旺", "平", "庙", "旺", "得", "陷", "旺", "平", "庙", "旺"));
        result.put("文昌", List.of("陷", "利", "得", "庙", "陷", "利", "得", "庙", "陷", "利", "得", "庙"));
        result.put("文曲", List.of("平", "旺", "得", "庙", "陷", "旺", "得", "庙", "陷", "旺", "得", "庙"));
        result.put("火星", List.of("庙", "利", "陷", "得", "庙", "利", "陷", "陷", "庙", "利", "陷", "得"));
        result.put("铃星", List.of("庙", "利", "陷", "得", "庙", "利", "陷", "得", "庙", "利", "陷", "得"));
        result.put("擎羊", List.of("", "陷", "庙", "", "陷", "庙", "", "陷", "庙", "", "陷", "庙"));
        result.put("陀罗", List.of("陷", "", "庙", "陷", "", "庙", "陷", "", "庙", "陷", "", "庙"));
        result.put("左辅", List.of("庙", "陷", "庙", "平", "旺", "庙", "庙", "平", "庙", "平", "旺", "庙"));
        result.put("右弼", List.of("庙", "陷", "庙", "平", "旺", "庙", "庙", "平", "庙", "平", "旺", "庙"));
        // 参考飞星盘会显示空劫亮度；以下表序从寅宫起，已纳入三例逐宫黄金回归。
        result.put("地空", List.of("庙", "陷", "庙", "庙", "庙", "庙", "旺", "庙", "庙", "陷", "平", "旺"));
        result.put("地劫", List.of("庙", "陷", "庙", "平", "庙", "庙", "旺", "陷", "庙", "旺", "平", "陷"));
        result.put("禄存", List.of("庙", "庙", "庙", "庙", "庙", "庙", "庙", "庙", "庙", "庙", "庙", "庙"));
        return Map.copyOf(result);
    }
}
