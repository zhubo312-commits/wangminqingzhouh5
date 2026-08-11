package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.MeihuaModels.*;

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
public class MeihuaEngine {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter
            .ofPattern("uuuu-MM-dd HH:mm")
            .withResolverStyle(ResolverStyle.STRICT);
    private static final String STEMS = "甲乙丙丁戊己庚辛壬癸";
    private static final String BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
    private static final List<TrigramDefinition> TRIGRAMS = List.of(
            new TrigramDefinition(1, "qian", "乾", "☰", "金", List.of(1, 1, 1)),
            new TrigramDefinition(2, "dui", "兑", "☱", "金", List.of(0, 1, 1)),
            new TrigramDefinition(3, "li", "离", "☲", "火", List.of(1, 0, 1)),
            new TrigramDefinition(4, "zhen", "震", "☳", "木", List.of(0, 0, 1)),
            new TrigramDefinition(5, "xun", "巽", "☴", "木", List.of(1, 1, 0)),
            new TrigramDefinition(6, "kan", "坎", "☵", "水", List.of(0, 1, 0)),
            new TrigramDefinition(7, "gen", "艮", "☶", "土", List.of(1, 0, 0)),
            new TrigramDefinition(8, "kun", "坤", "☷", "土", List.of(0, 0, 0)));
    private static final Map<String, String> HEXAGRAM_NAMES = hexagramNames();

    public ChartResponse chart(ChartRequest request) {
        validate(request);
        LocalDateTime dateTime = parseDateTime(request.chartDateTime());
        Solar solar = Solar.fromYmdHms(
                dateTime.getYear(),
                dateTime.getMonthValue(),
                dateTime.getDayOfMonth(),
                dateTime.getHour(),
                dateTime.getMinute(),
                0);
        Lunar lunar = solar.getLunar();
        int hourIndex = Math.floorDiv((dateTime.getHour() + 1) % 24, 2) + 1;
        Indices indices = indices(request, lunar, hourIndex);
        Hexagram original = hexagram(indices.upper(), indices.lower());
        Hexagram mutual = mutual(original);
        Hexagram changed = changed(indices.upper(), indices.lower(), indices.moving());
        Overview overview = new Overview(
                methodLabel(request.mode()),
                request.chartDateTime(),
                lunar.getYearInGanZhi() + "年" + lunar.getMonthInChinese() + "月"
                        + lunar.getDayInChinese() + "日" + BRANCHES.charAt(hourIndex - 1) + "时",
                new Pillars(
                        lunar.getYearInGanZhi(),
                        lunar.getMonthInGanZhiExact(),
                        lunar.getDayInGanZhi(),
                        hourGanZhi(lunar.getDayGan(), hourIndex)),
                lunar.getDayXunKong(),
                "number".equals(request.mode()) ? request.school() : null,
                "number".equals(request.mode()) ? request.numberOne() : null,
                "number".equals(request.mode()) ? request.numberTwo() : null,
                "number".equals(request.mode()) && Boolean.TRUE.equals(request.includeHour()));
        return new ChartResponse(
                overview,
                indices.upper(),
                indices.lower(),
                indices.moving(),
                original,
                mutual,
                changed);
    }

    private Indices indices(ChartRequest request, Lunar lunar, int hourIndex) {
        return switch (request.mode()) {
            case "time" -> {
                int yearBranch = BRANCHES.indexOf(lunar.getYearZhi()) + 1;
                int upperSource = yearBranch + Math.abs(lunar.getMonth()) + lunar.getDay();
                int lowerSource = upperSource + hourIndex;
                yield new Indices(mod(upperSource, 8), mod(lowerSource, 8), mod(lowerSource, 6));
            }
            case "random", "specified" -> new Indices(
                    request.upperTrigram(),
                    request.lowerTrigram(),
                    request.movingLine());
            case "number" -> {
                int upperSource = "digit_sum".equals(request.school())
                        ? digitSum(request.numberOne())
                        : Math.toIntExact(request.numberOne());
                int lowerSource = "digit_sum".equals(request.school())
                        ? digitSum(request.numberTwo())
                        : Math.toIntExact(request.numberTwo());
                long movingSource = Boolean.TRUE.equals(request.includeHour())
                        ? request.numberOne() + request.numberTwo() + hourIndex
                        : (long) upperSource + lowerSource;
                yield new Indices(
                        mod(upperSource, 8),
                        mod(lowerSource, 8),
                        mod(movingSource, 6));
            }
            default -> throw new IllegalArgumentException("不支持的梅花起盘方式");
        };
    }

    private Hexagram mutual(Hexagram original) {
        List<Integer> upper = definition(original.upper().index()).bits();
        List<Integer> lower = definition(original.lower().index()).bits();
        int mutualUpper = trigramIndex(List.of(upper.get(1), upper.get(2), lower.get(0)));
        int mutualLower = trigramIndex(List.of(upper.get(2), lower.get(0), lower.get(1)));
        return hexagram(mutualUpper, mutualLower);
    }

    private Hexagram changed(int upperIndex, int lowerIndex, int movingLine) {
        List<Integer> upper = new ArrayList<>(definition(upperIndex).bits());
        List<Integer> lower = new ArrayList<>(definition(lowerIndex).bits());
        if (movingLine <= 3) {
            int bitIndex = 3 - movingLine;
            lower.set(bitIndex, lower.get(bitIndex) == 1 ? 0 : 1);
        } else {
            int bitIndex = 6 - movingLine;
            upper.set(bitIndex, upper.get(bitIndex) == 1 ? 0 : 1);
        }
        return hexagram(trigramIndex(upper), trigramIndex(lower));
    }

    private Hexagram hexagram(int upperIndex, int lowerIndex) {
        TrigramDefinition upper = definition(upperIndex);
        TrigramDefinition lower = definition(lowerIndex);
        String key = upper.key() + lower.key();
        String name = HEXAGRAM_NAMES.get(key);
        if (name == null) throw new IllegalStateException("缺少六十四卦名称映射: " + key);
        List<String> lines = new ArrayList<>(6);
        for (int index = 2; index >= 0; index--) lines.add(line(lower.bits().get(index)));
        for (int index = 2; index >= 0; index--) lines.add(line(upper.bits().get(index)));
        return new Hexagram(key, name, trigram(upper), trigram(lower), lines);
    }

    private Trigram trigram(TrigramDefinition value) {
        return new Trigram(
                value.index(),
                value.key(),
                value.name(),
                value.symbol(),
                value.element(),
                value.bits().stream().map(this::line).toList());
    }

    private int trigramIndex(List<Integer> bits) {
        return TRIGRAMS.stream()
                .filter(value -> value.bits().equals(bits))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("无效的八卦爻线"))
                .index();
    }

    private TrigramDefinition definition(int index) {
        if (index < 1 || index > TRIGRAMS.size()) throw new IllegalArgumentException("八卦序号必须为 1–8");
        return TRIGRAMS.get(index - 1);
    }

    private String hourGanZhi(String dayGan, int hourIndex) {
        int dayStem = STEMS.indexOf(dayGan);
        if (dayStem < 0) throw new IllegalStateException("无法识别日干");
        int stemIndex = ((dayStem % 5) * 2 + hourIndex - 1) % STEMS.length();
        return "" + STEMS.charAt(stemIndex) + BRANCHES.charAt(hourIndex - 1);
    }

    private int digitSum(long value) {
        int sum = 0;
        for (char digit : String.valueOf(value).toCharArray()) sum += digit - '0';
        return sum;
    }

    private int mod(long value, int base) {
        int result = (int) (value % base);
        return result == 0 ? base : result;
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
        if (!request.isModeConfigurationValid()) {
            throw new IllegalArgumentException("起盘参数与起盘方式不匹配");
        }
        if ("number".equals(request.mode())) {
            if (request.numberOne() < 1 || request.numberTwo() < 1
                    || request.numberOne() > 999_999_999 || request.numberTwo() > 999_999_999) {
                throw new IllegalArgumentException("报数必须为 1–999999999 的整数");
            }
            if (!List.of("digit_sum", "raw_number").contains(request.school())) {
                throw new IllegalArgumentException("不支持的报数流派");
            }
        }
        if ("random".equals(request.mode()) || "specified".equals(request.mode())) {
            definition(request.upperTrigram());
            definition(request.lowerTrigram());
            if (request.movingLine() < 1 || request.movingLine() > 6) {
                throw new IllegalArgumentException("动爻必须为 1–6");
            }
        }
    }

    private String methodLabel(String mode) {
        return switch (mode) {
            case "time" -> "时间起盘";
            case "random" -> "随机起盘";
            case "number" -> "报数起盘";
            case "specified" -> "指定起盘";
            default -> throw new IllegalArgumentException("不支持的梅花起盘方式");
        };
    }

    private String line(int bit) {
        return bit == 1 ? "yang" : "yin";
    }

    private static Map<String, String> hexagramNames() {
        String[][] entries = {
            {"qianqian", "乾为天"}, {"kunkun", "坤为地"}, {"kanzhen", "水雷屯"}, {"genkan", "山水蒙"},
            {"kanqian", "水天需"}, {"qiankan", "天水讼"}, {"kunkan", "地水师"}, {"kankun", "水地比"},
            {"xunqian", "风天小畜"}, {"qiandui", "天泽履"}, {"kunqian", "地天泰"}, {"qiankun", "天地否"},
            {"qianli", "天火同人"}, {"liqian", "火天大有"}, {"kungen", "地山谦"}, {"zhenkun", "雷地豫"},
            {"duizhen", "泽雷随"}, {"genxun", "山风蛊"}, {"kundui", "地泽临"}, {"xunkun", "风地观"},
            {"lizhen", "火雷噬嗑"}, {"genli", "山火贲"}, {"genkun", "山地剥"}, {"kunzhen", "地雷复"},
            {"qianzhen", "天雷无妄"}, {"genqian", "山天大畜"}, {"genzhen", "山雷颐"}, {"duixun", "泽风大过"},
            {"kankan", "坎为水"}, {"lili", "离为火"}, {"duigen", "泽山咸"}, {"zhenxun", "雷风恒"},
            {"qiangen", "天山遁"}, {"zhenqian", "雷天大壮"}, {"likun", "火地晋"}, {"kunli", "地火明夷"},
            {"xunli", "风火家人"}, {"lidui", "火泽睽"}, {"kangen", "水山蹇"}, {"zhenkan", "雷水解"},
            {"gendui", "山泽损"}, {"xunzhen", "风雷益"}, {"duiqian", "泽天夬"}, {"qianxun", "天风姤"},
            {"duikun", "泽地萃"}, {"kunxun", "地风升"}, {"duikan", "泽水困"}, {"kanxun", "水风井"},
            {"duili", "泽火革"}, {"lixun", "火风鼎"}, {"zhenzhen", "震为雷"}, {"gengen", "艮为山"},
            {"xungen", "风山渐"}, {"zhendui", "雷泽归妹"}, {"zhenli", "雷火丰"}, {"ligen", "火山旅"},
            {"xunxun", "巽为风"}, {"duidui", "兑为泽"}, {"xunkan", "风水涣"}, {"kandui", "水泽节"},
            {"xundui", "风泽中孚"}, {"zhengen", "雷山小过"}, {"kanli", "水火既济"}, {"likan", "火水未济"}
        };
        Map<String, String> result = new LinkedHashMap<>();
        for (String[] entry : entries) result.put(entry[0], entry[1]);
        return Map.copyOf(result);
    }

    private record TrigramDefinition(int index, String key, String name, String symbol, String element, List<Integer> bits) {}
    private record Indices(int upper, int lower, int moving) {}
}
