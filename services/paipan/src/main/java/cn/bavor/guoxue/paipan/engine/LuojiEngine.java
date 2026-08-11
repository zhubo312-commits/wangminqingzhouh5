package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.LuojiModels.*;

import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class LuojiEngine {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter
            .ofPattern("uuuu-MM-dd HH:mm")
            .withResolverStyle(ResolverStyle.STRICT);
    private static final String STEMS = "甲乙丙丁戊己庚辛壬癸";
    private static final String BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
    private static final List<String> DEITIES = List.of("青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武");
    private static final Map<String, String> ELEMENT_BY_BRANCH = Map.ofEntries(
            Map.entry("子", "水"), Map.entry("亥", "水"),
            Map.entry("寅", "木"), Map.entry("卯", "木"),
            Map.entry("巳", "火"), Map.entry("午", "火"),
            Map.entry("申", "金"), Map.entry("酉", "金"),
            Map.entry("辰", "土"), Map.entry("戌", "土"),
            Map.entry("丑", "土"), Map.entry("未", "土"));
    private static final Map<String, String> GENERATES = Map.of(
            "木", "火", "火", "土", "土", "金", "金", "水", "水", "木");
    private static final Map<String, String> CONTROLS = Map.of(
            "木", "土", "土", "水", "水", "火", "火", "金", "金", "木");
    private static final Map<String, TrigramDefinition> TRIGRAMS = trigrams();
    private static final Map<String, HexagramDefinition> HEXAGRAMS = hexagrams();
    private static final Map<String, PalaceDefinition> PALACES = palaces();

    public ChartResponse chart(ChartRequest request) {
        validate(request);
        LocalDateTime dateTime = parseDateTime(request.chartDateTime());
        Solar solar = Solar.fromYmdHms(
                dateTime.getYear(), dateTime.getMonthValue(), dateTime.getDayOfMonth(),
                dateTime.getHour(), dateTime.getMinute(), 0);
        Lunar lunar = solar.getLunar();
        int hourIndex = Math.floorDiv((dateTime.getHour() + 1) % 24, 2) + 1;

        LinesPair pair = "names".equals(request.mode())
                ? linesFromNames(request.originalHexagram(), request.changedHexagram())
                : linesFromCoins(request.coinBacks());
        HexagramDefinition originalDefinition = definition(pair.original());
        HexagramDefinition changedDefinition = definition(pair.changed());
        PalaceDefinition originalPalace = PALACES.get(originalDefinition.name());
        PalaceDefinition changedPalace = PALACES.get(changedDefinition.name());
        if (originalPalace == null || changedPalace == null) throw new IllegalStateException("缺少八宫归属映射");

        List<String> originalGanzhi = naJia(originalDefinition);
        List<String> changedGanzhi = naJia(changedDefinition);
        List<String> originalKin = kinList(originalGanzhi, originalPalace.element());
        List<String> changedKin = kinList(changedGanzhi, originalPalace.element());
        HexagramDefinition mainDefinition = pureHexagram(originalPalace.palaceTrigram());
        List<String> mainGanzhi = naJia(mainDefinition);
        List<String> mainKin = kinList(mainGanzhi, originalPalace.element());
        List<String> deities = deities(lunar.getDayGan());
        List<Line> lines = new ArrayList<>(6);
        for (int index = 0; index < 6; index++) {
            String hiddenKin = originalKin.contains(mainKin.get(index)) ? null : mainKin.get(index);
            String marker = position(index) == shiLine(originalPalace.sequence())
                    ? "世"
                    : position(index) == yingLine(originalPalace.sequence()) ? "应" : null;
            lines.add(new Line(
                    position(index),
                    deities.get(index),
                    hiddenKin,
                    hiddenKin == null ? null : mainGanzhi.get(index),
                    originalKin.get(index),
                    originalGanzhi.get(index),
                    element(originalGanzhi.get(index)),
                    pair.original().get(index),
                    !pair.original().get(index).equals(pair.changed().get(index)),
                    marker,
                    changedKin.get(index),
                    changedGanzhi.get(index),
                    element(changedGanzhi.get(index)),
                    pair.changed().get(index)));
        }

        Overview overview = new Overview(
                methodLabel(request.mode()),
                request.question() == null ? "" : request.question().trim(),
                request.chartDateTime(),
                lunar.getYearInGanZhi() + "年" + lunar.getMonthInGanZhiExact() + "月"
                        + lunar.getDayInGanZhi() + "日" + hourGanZhi(lunar.getDayGan(), hourIndex) + "时",
                new Pillars(
                        lunar.getYearInGanZhi(), lunar.getMonthInGanZhiExact(),
                        lunar.getDayInGanZhi(), hourGanZhi(lunar.getDayGan(), hourIndex)),
                lunar.getDayXunKong(),
                "names".equals(request.mode()) ? null : request.coinBacks());
        return new ChartResponse(
                overview,
                hexagram(originalDefinition, originalPalace, pair.original()),
                hexagram(changedDefinition, changedPalace, pair.changed()),
                List.copyOf(lines));
    }

    private LinesPair linesFromCoins(String coinBacks) {
        List<String> originalBottomUp = new ArrayList<>(6);
        List<String> changedBottomUp = new ArrayList<>(6);
        for (char value : coinBacks.toCharArray()) {
            String original = ((value - '0') % 2 == 1) ? "yang" : "yin";
            boolean moving = value == '0' || value == '3';
            originalBottomUp.add(original);
            changedBottomUp.add(moving ? toggle(original) : original);
        }
        return new LinesPair(reverse(originalBottomUp), reverse(changedBottomUp));
    }

    private LinesPair linesFromNames(String originalName, String changedName) {
        HexagramDefinition original = HEXAGRAMS.get(originalName);
        HexagramDefinition changed = HEXAGRAMS.get(changedName);
        if (original == null) throw new IllegalArgumentException("无法识别本卦名称");
        if (changed == null) throw new IllegalArgumentException("无法识别变卦名称");
        return new LinesPair(lines(original), lines(changed));
    }

    private Hexagram hexagram(HexagramDefinition definition, PalaceDefinition palace, List<String> lines) {
        return new Hexagram(
                definition.name(),
                definition.upper(),
                definition.lower(),
                lines,
                new Palace(
                        palace.palaceTrigram() + "宫",
                        palace.sequence(),
                        palace.sequence() == 7 ? "游魂" : palace.sequence() == 8 ? "归魂" : null,
                        palace.element()),
                shiLine(palace.sequence()),
                yingLine(palace.sequence()));
    }

    private HexagramDefinition definition(List<String> lines) {
        return HEXAGRAMS.values().stream()
                .filter(value -> lines(value).equals(lines))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("无法识别六爻卦象"));
    }

    private HexagramDefinition pureHexagram(String trigram) {
        return HEXAGRAMS.values().stream()
                .filter(value -> value.upper().equals(trigram) && value.lower().equals(trigram))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("缺少八纯卦"));
    }

    private List<String> lines(HexagramDefinition definition) {
        List<String> result = new ArrayList<>(6);
        result.addAll(TRIGRAMS.get(definition.upper()).lines());
        result.addAll(TRIGRAMS.get(definition.lower()).lines());
        return List.copyOf(result);
    }

    private List<String> naJia(HexagramDefinition definition) {
        List<String> result = new ArrayList<>(6);
        result.addAll(TRIGRAMS.get(definition.upper()).outerGanzhi());
        result.addAll(TRIGRAMS.get(definition.lower()).innerGanzhi());
        return List.copyOf(result);
    }

    private List<String> kinList(List<String> ganzhi, String palaceElement) {
        return ganzhi.stream().map(value -> kin(element(value), palaceElement)).toList();
    }

    private String kin(String lineElement, String palaceElement) {
        if (lineElement.equals(palaceElement)) return "兄弟";
        if (GENERATES.get(lineElement).equals(palaceElement)) return "父母";
        if (GENERATES.get(palaceElement).equals(lineElement)) return "子孙";
        if (CONTROLS.get(lineElement).equals(palaceElement)) return "官鬼";
        if (CONTROLS.get(palaceElement).equals(lineElement)) return "妻财";
        throw new IllegalStateException("无法确定六亲");
    }

    private List<String> deities(String dayStem) {
        int stemIndex = STEMS.indexOf(dayStem);
        if (stemIndex < 0) throw new IllegalStateException("无法识别日干");
        int start = switch (dayStem) {
            case "甲", "乙" -> 0;
            case "丙", "丁" -> 1;
            case "戊" -> 2;
            case "己" -> 3;
            case "庚", "辛" -> 4;
            case "壬", "癸" -> 5;
            default -> throw new IllegalStateException("无法识别日干");
        };
        List<String> bottomUp = new ArrayList<>(6);
        for (int index = 0; index < 6; index++) bottomUp.add(DEITIES.get((start + index) % 6));
        return reverse(bottomUp);
    }

    private int shiLine(int sequence) {
        return switch (sequence) {
            case 1 -> 6;
            case 2 -> 1;
            case 3 -> 2;
            case 4, 8 -> 3;
            case 5, 7 -> 4;
            case 6 -> 5;
            default -> throw new IllegalArgumentException("八宫序号无效");
        };
    }

    private int yingLine(int sequence) {
        int shi = shiLine(sequence);
        return shi <= 3 ? shi + 3 : shi - 3;
    }

    private int position(int topDownIndex) {
        return 6 - topDownIndex;
    }

    private String element(String stemBranch) {
        String result = ELEMENT_BY_BRANCH.get(stemBranch.substring(1));
        if (result == null) throw new IllegalStateException("无法识别地支五行");
        return result;
    }

    private String hourGanZhi(String dayGan, int hourIndex) {
        int dayStem = STEMS.indexOf(dayGan);
        int stemIndex = ((dayStem % 5) * 2 + hourIndex - 1) % STEMS.length();
        return "" + STEMS.charAt(stemIndex) + BRANCHES.charAt(hourIndex - 1);
    }

    private String methodLabel(String mode) {
        return switch (mode) {
            case "coins" -> "铜钱摇盘法";
            case "names" -> "盘名起盘法";
            case "backs" -> "硬币背数法";
            default -> throw new IllegalArgumentException("不支持的逻辑起盘方式");
        };
    }

    private String toggle(String line) {
        return "yang".equals(line) ? "yin" : "yang";
    }

    private <T> List<T> reverse(List<T> input) {
        List<T> result = new ArrayList<>(input);
        java.util.Collections.reverse(result);
        return List.copyOf(result);
    }

    private LocalDateTime parseDateTime(String value) {
        try {
            return LocalDateTime.parse(value, DATE_TIME);
        } catch (DateTimeException exception) {
            throw new IllegalArgumentException("起盘日期时间无效", exception);
        }
    }

    private void validate(ChartRequest request) {
        if (request == null || request.chartDateTime() == null || request.mode() == null) {
            throw new IllegalArgumentException("请填写完整起盘条件");
        }
        if (!request.isModeConfigurationValid()) throw new IllegalArgumentException("起盘参数与起盘方式不匹配");
        parseDateTime(request.chartDateTime());
    }

    private static Map<String, TrigramDefinition> trigrams() {
        Map<String, TrigramDefinition> result = new LinkedHashMap<>();
        result.put("乾", new TrigramDefinition(List.of("yang", "yang", "yang"), List.of("壬戌", "壬申", "壬午"), List.of("甲辰", "甲寅", "甲子")));
        result.put("兑", new TrigramDefinition(List.of("yin", "yang", "yang"), List.of("丁未", "丁酉", "丁亥"), List.of("丁丑", "丁卯", "丁巳")));
        result.put("离", new TrigramDefinition(List.of("yang", "yin", "yang"), List.of("己巳", "己未", "己酉"), List.of("己亥", "己丑", "己卯")));
        result.put("震", new TrigramDefinition(List.of("yin", "yin", "yang"), List.of("庚戌", "庚申", "庚午"), List.of("庚辰", "庚寅", "庚子")));
        result.put("巽", new TrigramDefinition(List.of("yang", "yang", "yin"), List.of("辛卯", "辛巳", "辛未"), List.of("辛酉", "辛亥", "辛丑")));
        result.put("坎", new TrigramDefinition(List.of("yin", "yang", "yin"), List.of("戊子", "戊戌", "戊申"), List.of("戊午", "戊辰", "戊寅")));
        result.put("艮", new TrigramDefinition(List.of("yang", "yin", "yin"), List.of("丙寅", "丙子", "丙戌"), List.of("丙申", "丙午", "丙辰")));
        result.put("坤", new TrigramDefinition(List.of("yin", "yin", "yin"), List.of("癸酉", "癸亥", "癸丑"), List.of("乙卯", "乙巳", "乙未")));
        return Map.copyOf(result);
    }

    private static Map<String, HexagramDefinition> hexagrams() {
        String[][] entries = {
            {"乾为天", "乾", "乾"}, {"坤为地", "坤", "坤"}, {"水雷屯", "坎", "震"}, {"山水蒙", "艮", "坎"},
            {"水天需", "坎", "乾"}, {"天水讼", "乾", "坎"}, {"地水师", "坤", "坎"}, {"水地比", "坎", "坤"},
            {"风天小畜", "巽", "乾"}, {"天泽履", "乾", "兑"}, {"地天泰", "坤", "乾"}, {"天地否", "乾", "坤"},
            {"天火同人", "乾", "离"}, {"火天大有", "离", "乾"}, {"地山谦", "坤", "艮"}, {"雷地豫", "震", "坤"},
            {"泽雷随", "兑", "震"}, {"山风蛊", "艮", "巽"}, {"地泽临", "坤", "兑"}, {"风地观", "巽", "坤"},
            {"火雷噬嗑", "离", "震"}, {"山火贲", "艮", "离"}, {"山地剥", "艮", "坤"}, {"地雷复", "坤", "震"},
            {"天雷无妄", "乾", "震"}, {"山天大畜", "艮", "乾"}, {"山雷颐", "艮", "震"}, {"泽风大过", "兑", "巽"},
            {"坎为水", "坎", "坎"}, {"离为火", "离", "离"}, {"泽山咸", "兑", "艮"}, {"雷风恒", "震", "巽"},
            {"天山遁", "乾", "艮"}, {"雷天大壮", "震", "乾"}, {"火地晋", "离", "坤"}, {"地火明夷", "坤", "离"},
            {"风火家人", "巽", "离"}, {"火泽睽", "离", "兑"}, {"水山蹇", "坎", "艮"}, {"雷水解", "震", "坎"},
            {"山泽损", "艮", "兑"}, {"风雷益", "巽", "震"}, {"泽天夬", "兑", "乾"}, {"天风姤", "乾", "巽"},
            {"泽地萃", "兑", "坤"}, {"地风升", "坤", "巽"}, {"泽水困", "兑", "坎"}, {"水风井", "坎", "巽"},
            {"泽火革", "兑", "离"}, {"火风鼎", "离", "巽"}, {"震为雷", "震", "震"}, {"艮为山", "艮", "艮"},
            {"风山渐", "巽", "艮"}, {"雷泽归妹", "震", "兑"}, {"雷火丰", "震", "离"}, {"火山旅", "离", "艮"},
            {"巽为风", "巽", "巽"}, {"兑为泽", "兑", "兑"}, {"风水涣", "巽", "坎"}, {"水泽节", "坎", "兑"},
            {"风泽中孚", "巽", "兑"}, {"雷山小过", "震", "艮"}, {"水火既济", "坎", "离"}, {"火水未济", "离", "坎"}
        };
        Map<String, HexagramDefinition> result = new LinkedHashMap<>();
        for (String[] entry : entries) result.put(entry[0], new HexagramDefinition(entry[0], entry[1], entry[2]));
        return Map.copyOf(result);
    }

    private static Map<String, PalaceDefinition> palaces() {
        Map<String, PalaceDefinition> result = new HashMap<>();
        addPalace(result, "乾", "金", "乾为天", "天风姤", "天山遁", "天地否", "风地观", "山地剥", "火地晋", "火天大有");
        addPalace(result, "兑", "金", "兑为泽", "泽水困", "泽地萃", "泽山咸", "水山蹇", "地山谦", "雷山小过", "雷泽归妹");
        addPalace(result, "离", "火", "离为火", "火山旅", "火风鼎", "火水未济", "山水蒙", "风水涣", "天水讼", "天火同人");
        addPalace(result, "震", "木", "震为雷", "雷地豫", "雷水解", "雷风恒", "地风升", "水风井", "泽风大过", "泽雷随");
        addPalace(result, "巽", "木", "巽为风", "风天小畜", "风火家人", "风雷益", "天雷无妄", "火雷噬嗑", "山雷颐", "山风蛊");
        addPalace(result, "坎", "水", "坎为水", "水泽节", "水雷屯", "水火既济", "泽火革", "雷火丰", "地火明夷", "地水师");
        addPalace(result, "艮", "土", "艮为山", "山火贲", "山天大畜", "山泽损", "火泽睽", "天泽履", "风泽中孚", "风山渐");
        addPalace(result, "坤", "土", "坤为地", "地雷复", "地泽临", "地天泰", "雷天大壮", "泽天夬", "水天需", "水地比");
        return Map.copyOf(result);
    }

    private static void addPalace(Map<String, PalaceDefinition> target, String palace, String element, String... names) {
        for (int index = 0; index < names.length; index++) {
            target.put(names[index], new PalaceDefinition(palace, index + 1, element));
        }
    }

    private record TrigramDefinition(List<String> lines, List<String> outerGanzhi, List<String> innerGanzhi) {}
    private record HexagramDefinition(String name, String upper, String lower) {}
    private record PalaceDefinition(String palaceTrigram, int sequence, String element) {}
    private record LinesPair(List<String> original, List<String> changed) {}
}
