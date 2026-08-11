package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.JueceModels.*;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.nlf.calendar.EightChar;
import com.nlf.calendar.JieQi;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.app.utils.bazi.SolarTimeUtil;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Normalized time-school decision engine aligned with the current ft.bavor.cn behavior.
 * Rotating charts reuse the frozen local Xinghe source; flying charts use the stateless
 * historical formulas and the reference site's frozen solar-term table.
 */
@Service
public class ShijiaJueceEngine {
    private final DunjiaEngine dunjiaEngine;

    public ShijiaJueceEngine(DunjiaEngine dunjiaEngine) {
        this.dunjiaEngine = dunjiaEngine;
    }

    private static final DateTimeFormatter MINUTE = DateTimeFormatter
            .ofPattern("uuuu-MM-dd HH:mm")
            .withResolverStyle(ResolverStyle.STRICT);
    private static final DateTimeFormatter SECOND = DateTimeFormatter
            .ofPattern("uuuu-MM-dd HH:mm:ss")
            .withResolverStyle(ResolverStyle.STRICT);
    private static final List<String> GAN = List.of("甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸");
    private static final List<String> ZHI = List.of("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥");
    private static final List<String> SOLAR_TERMS = List.of(
            "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明",
            "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋",
            "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪");
    private static final List<String> JU_ARR = List.of(
            "123891345456987219765654",
            "789567912123321543198987",
            "456234678789654876432321");
    private static final List<String> TROOPS = List.of("戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙");
    private static final List<String> SIX_JIA = List.of("子", "戌", "申", "午", "辰", "寅");
    private static final List<Integer> TURN_TABLE = List.of(1, 8, 3, 4, 9, 2, 7, 6);
    private static final List<String> ROTATING_STARS = List.of("天蓬", "天任", "天冲", "天辅", "天英", "天芮", "天柱", "天心");
    private static final List<String> ROTATING_DOORS = List.of("休门", "生门", "伤门", "杜门", "景门", "死门", "惊门", "开门");
    private static final List<String> ROTATING_DEITIES = List.of("值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天");
    private static final List<String> FLYING_STARS = List.of("天蓬", "天芮", "天冲", "天辅", "天禽", "天心", "天柱", "天任", "天英");
    private static final List<String> FLYING_DOORS = List.of("休门", "死门", "伤门", "杜门", "中五", "开门", "惊门", "生门", "景门");
    private static final List<String> FLYING_YANG_DEITIES = List.of("值符", "螣蛇", "太阴", "六合", "勾陈", "太常", "朱雀", "九地", "九天");
    private static final List<String> FLYING_YIN_DEITIES = List.of("值符", "螣蛇", "太阴", "六合", "白虎", "太常", "玄武", "九地", "九天");
    private static final Set<String> VOID_BASES = Set.of("hour", "day", "month", "year");
    private static final Set<String> CENTER_METHODS = Set.of("kun", "yang_gen_yin_kun", "four_corners", "seasonal");
    private static final Set<String> DIRECTION_RULES = Set.of("yang_forward_yin_reverse", "all_forward");
    private static final Set<String> BUREAU_METHODS = Set.of("chai_bu", "zhi_run", "mao_shan", "manual");
    private static final Map<String, String> REFERENCE_SOLAR_TERMS = loadReferenceSolarTerms();

    private static final Map<Integer, PalaceMeta> PALACE_META = Map.of(
            1, new PalaceMeta("坎", "北", "水"),
            2, new PalaceMeta("坤", "西南", "土"),
            3, new PalaceMeta("震", "东", "木"),
            4, new PalaceMeta("巽", "东南", "木"),
            5, new PalaceMeta("中", "中", "土"),
            6, new PalaceMeta("乾", "西北", "金"),
            7, new PalaceMeta("兑", "西", "金"),
            8, new PalaceMeta("艮", "东北", "土"),
            9, new PalaceMeta("离", "南", "火"));

    public ChartResponse chart(ChartRequest request) {
        validateOptions(request);
        LocalDateTime clock = parseMinute(request.chartDateTime());
        if (clock.getYear() < 1900 || clock.getYear() > 2100) {
            throw new IllegalArgumentException("起局时间须在 1900–2100 年之间");
        }

        String effectiveText = request.chartDateTime();
        String areaCode = null;
        String areaName = null;
        String trueSolarTime = null;
        if ("true_solar".equals(request.time().mode())) {
            areaCode = request.time().areaCode();
            if (!SolarTimeUtil.isContain(areaCode)) {
                throw new IllegalArgumentException("地区码不存在，请重新选择地区");
            }
            effectiveText = SolarTimeUtil.getSolarTime(request.chartDateTime(), areaCode);
            trueSolarTime = effectiveText;
            areaName = SolarTimeUtil.getArea(areaCode);
        }

        LocalDateTime effective = parseMinute(effectiveText);
        Solar solar = Solar.fromYmdHms(
                effective.getYear(), effective.getMonthValue(), effective.getDayOfMonth(),
                effective.getHour(), effective.getMinute(), 0);
        Lunar lunar = solar.getLunar();
        EightChar eightChar = lunar.getEightChar();
        eightChar.setSect(1);

        // The reference site switched its rotating result page to Xinghe Qimen in 2025.
        // Its rotating form still carries the historical options, but the result is always
        // calculated as chai-bu + hour void + center attached to Kun. Reuse the same frozen
        // local source used by DunjiaEngine so our observable result follows that behavior.
        if ("rotating".equals(request.pan().style())) {
            return rotatingReferenceChart(
                    request, areaCode, areaName, trueSolarTime);
        }

        CalendarData calendar = calendarData(clock, lunar, eightChar);
        BureauData bureau = bureau(request.bureau(), calendar);

        HeadData head = head(bureau.signedNumber(), calendar);
        List<PalaceData> rawPalaces = flyingPalaces(request, bureau, calendar, head);

        String selectedVoid = selectedVoid(request.voidBasis(), calendar.voids());
        Set<Integer> voidPalaces = voidPalaces(selectedVoid);
        int horsePalace = horsePalace(head.horseBranch());
        rawPalaces.forEach(palace -> {
            palace.isVoid = voidPalaces.contains(palace.index);
            palace.isHorse = palace.index == horsePalace;
        });

        int chiefStarPalace = rawPalaces.stream()
                .filter(palace -> head.chiefStar().equals(palace.heavenStar)
                        || head.chiefStar().equals(palace.attachedHeavenStar))
                .mapToInt(palace -> palace.index)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("值符未落宫"));
        int chiefDoorPalace = rawPalaces.stream()
                .filter(palace -> head.chiefDoor().equals(palace.heavenDoor))
                .mapToInt(palace -> palace.index)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("值使未落宫"));

        List<Palace> palaces = rawPalaces.stream()
                .sorted((left, right) -> Integer.compare(left.index, right.index))
                .map(palace -> normalizedPalace(palace, chiefStarPalace, chiefDoorPalace))
                .toList();
        String dunType = bureau.signedNumber() > 0 ? "阳" : "阴";
        String panLabel = "rotating".equals(request.pan().style()) ? "转盘" : "飞盘";
        String bureauLabel = bureauLabel(request.bureau());
        String method = methodLabel(request, panLabel, bureauLabel);

        Overview overview = new Overview(
                method,
                request.chartDateTime(),
                effectiveText,
                request.time().mode(),
                areaCode,
                areaName,
                trueSolarTime,
                lunar.getYearInChinese() + "年" + lunar.getMonthInChinese() + "月" + lunar.getDayInChinese() + "日",
                new Pillars(calendar.yearPillar(), calendar.monthPillar(), calendar.dayPillar(), calendar.hourPillar()),
                calendar.voids(),
                selectedVoid,
                calendar.previousTerm(),
                calendar.nextTerm(),
                request.pan().style(),
                panLabel,
                request.bureau().method(),
                bureauLabel,
                request.pan().directionRule(),
                request.pan().centerPalaceMethod(),
                dunType,
                Math.abs(bureau.signedNumber()),
                head.xunShou(),
                new Chief(head.chiefStar(), chiefStarPalace),
                new Chief(head.chiefDoor(), chiefDoorPalace),
                new Horse(head.horseBranch(), horsePalace));
        return new ChartResponse(overview, palaces, List.of());
    }

    private ChartResponse rotatingReferenceChart(
            ChartRequest request,
            String areaCode,
            String areaName,
            String trueSolarTime) {
        // The production rotating page forwards the original clock time to Xinghe and
        // ignores its isRealTime/geo query fields. Keep the separately reported solar
        // correction, but do not use it to alter the rotating chart.
        JSONObject legacy = dunjiaEngine.chart(request.chartDateTime());
        JSONObject rawOverview = (JSONObject) JSONObject.toJSON(legacy.get("qiMenZao"));
        JSONArray rawPalaces = (JSONArray) JSONObject.toJSON(legacy.get("qimenGong"));
        JSONArray rawGates = (JSONArray) JSONObject.toJSON(legacy.get("tianMenDiHuList"));

        int chiefStarPalace = rawOverview.getIntValue("zhiFuIndex");
        int chiefDoorPalace = rawOverview.getIntValue("zhiShiIndex");
        List<Palace> palaces = rawPalaces.stream()
                .map(JSONObject.class::cast)
                .map(raw -> referencePalace(raw, chiefStarPalace, chiefDoorPalace))
                .sorted((left, right) -> Integer.compare(left.index(), right.index()))
                .toList();
        int horsePalace = palaces.stream()
                .filter(Palace::isHorse)
                .mapToInt(Palace::index)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("马星未落宫"));
        List<HeavenEarthGate> heavenEarthGates = rawGates.stream()
                .map(JSONObject.class::cast)
                .map(raw -> new HeavenEarthGate(
                        raw.getString("diZhi"),
                        raw.getString("tianMen"),
                        raw.getString("diHu")))
                .toList();

        Overview overview = new Overview(
                "转盘 · 寄坤宫 · 拆补 · 时空",
                request.chartDateTime(),
                request.chartDateTime(),
                request.time().mode(),
                areaCode,
                areaName,
                trueSolarTime,
                rawOverview.getString("yearNongLi"),
                new Pillars(
                        rawOverview.getString("yearGanZhi"),
                        rawOverview.getString("monthGanZhi"),
                        rawOverview.getString("dayGanZhi"),
                        rawOverview.getString("hourGanZhi")),
                new VoidBranches(
                        rawOverview.getString("yearXunKong"),
                        rawOverview.getString("monthXunKong"),
                        rawOverview.getString("dayXunKong"),
                        rawOverview.getString("timeXunKong")),
                rawOverview.getString("timeXunKong"),
                new SolarTerm(
                        rawOverview.getString("prevJieQiName"),
                        rawOverview.getString("prevJieQiTime")),
                new SolarTerm(
                        rawOverview.getString("nextJieQiName"),
                        rawOverview.getString("nextJieQiTime")),
                "rotating",
                "转盘",
                "chai_bu",
                "拆补",
                null,
                "kun",
                rawOverview.getString("yinOrYangDun"),
                rawOverview.getIntValue("juShu"),
                rawOverview.getString("xunShou"),
                new Chief(stripSuffix(rawOverview.getString("zhiFu"), "星"), chiefStarPalace),
                new Chief(doorName(rawOverview.getString("zhiShi")), chiefDoorPalace),
                new Horse(rawOverview.getString("maXingContent"), horsePalace));
        return new ChartResponse(overview, palaces, heavenEarthGates);
    }

    private Palace referencePalace(JSONObject raw, int chiefStarPalace, int chiefDoorPalace) {
        int index = raw.getIntValue("index");
        String earthStem = nullableLegacy(raw.getString("diPan"));
        Attached attached = null;
        if (index == 2 && earthStem != null && earthStem.length() > 1) {
            attached = new Attached(earthStem.substring(1), "天禽", null, null);
            earthStem = earthStem.substring(0, 1);
        }
        String hidden = raw.getString("YinGan");
        if (hidden == null) hidden = raw.getString("yinGan");
        return new Palace(
                index,
                raw.getString("baGua"),
                directionName(raw.getString("fangWei")),
                raw.getString("wuXing"),
                new PlateLayer(
                        nullableLegacy(raw.getString("tianPan")),
                        raw.getString("baXing"),
                        doorName(raw.getString("newBaMen")),
                        raw.getString("baShen")),
                new PlateLayer(
                        earthStem,
                        stripSuffix(raw.getString("jiuXing"), "星"),
                        index == 5 ? null : doorName(raw.getString("baMen")),
                        null),
                attached,
                hidden,
                harms(raw),
                growthStages(raw, "tianGanChangSheng"),
                growthStages(raw, "diZhiChangSheng"),
                raw.getBooleanValue("isXunKong"),
                raw.getBooleanValue("isMaXing"),
                index == chiefStarPalace,
                index == chiefDoorPalace);
    }

    private List<Harm> harms(JSONObject raw) {
        JSONArray values = raw.getJSONArray("siHai");
        if (values == null) return List.of();
        return values.stream()
                .map(JSONObject.class::cast)
                .map(item -> new Harm(item.getString("word"), item.getString("siHai")))
                .toList();
    }

    private List<GrowthStage> growthStages(JSONObject raw, String field) {
        JSONArray values = raw.getJSONArray(field);
        if (values == null) return List.of();
        return values.stream()
                .map(JSONObject.class::cast)
                .map(item -> new GrowthStage(item.getString("title"), item.getString("content")))
                .toList();
    }

    private String nullableLegacy(String value) {
        return value == null || "UNKNOWN".equals(value) ? null : value;
    }

    private String stripSuffix(String value, String suffix) {
        if (value == null || !value.endsWith(suffix)) return value;
        return value.substring(0, value.length() - suffix.length());
    }

    private String doorName(String value) {
        if (value == null || value.isBlank() || value.endsWith("门")) return value;
        return value + "门";
    }

    private String directionName(String value) {
        if ("中央".equals(value)) return "中";
        return stripSuffix(value, "方");
    }

    private CalendarData calendarData(LocalDateTime clock, Lunar lunar, EightChar eightChar) {
        JieQi previous = lunar.getPrevJieQi();
        JieQi next = lunar.getNextJieQi();
        String year = eightChar.getYear();
        String month = eightChar.getMonth();
        String day = eightChar.getDay();
        String hour = eightChar.getTime();
        VoidBranches voids = new VoidBranches(
                emptyBranches(year), emptyBranches(month), emptyBranches(day), emptyBranches(hour));
        return new CalendarData(
                clock,
                lunar,
                year,
                month,
                day,
                hour,
                voids,
                new SolarTerm(previous.getName(), referenceSolarTerm(previous.getSolar(), previous.getName())),
                new SolarTerm(next.getName(), referenceSolarTerm(next.getSolar(), next.getName())),
                SOLAR_TERMS.indexOf(previous.getName()),
                SOLAR_TERMS.indexOf(next.getName()));
    }

    private BureauData bureau(BureauOption option, CalendarData calendar) {
        if ("manual".equals(option.method())) {
            int signed = "yang".equals(option.dunType()) ? option.number() : -option.number();
            return new BureauData(signed, calendar.previousTermIndex(), yuan(calendar.dayPillar()));
        }
        if ("mao_shan".equals(option.method())) return maoShanBureau(calendar);
        if ("zhi_run".equals(option.method())) return zhiRunBureau(calendar);
        Yuan yuan = yuan(calendar.dayPillar());
        int signed = digit(JU_ARR.get(yuan.index()), calendar.previousTermIndex());
        if (calendar.previousTermIndex() >= 12) signed *= -1;
        return new BureauData(signed, calendar.previousTermIndex(), yuan);
    }

    private BureauData maoShanBureau(CalendarData calendar) {
        LocalDateTime previousTerm = parseSecond(calendar.previousTerm().dateTime());
        int yuanIndex = calendar.clock().isBefore(previousTerm.plusHours(120)) ? 0
                : calendar.clock().isBefore(previousTerm.plusHours(240)) ? 1 : 2;
        int signed = digit(JU_ARR.get(yuanIndex), calendar.previousTermIndex());
        if (calendar.previousTermIndex() >= 12) signed *= -1;
        return new BureauData(signed, calendar.previousTermIndex(), new Yuan(yuanIndex, 0));
    }

    private BureauData zhiRunBureau(CalendarData calendar) {
        int previousIndex = calendar.previousTermIndex();
        int nextIndex = calendar.nextTermIndex();
        int year = calendar.lunar().getSolar().getYear();
        int halfStart = previousIndex < 12 ? 0 : 12;
        if (calendar.lunar().getSolar().getMonth() != 12 && halfStart == 0) year -= 1;

        TermHead halfHead = termHead(year, halfStart);
        int opposite = previousIndex < 12 ? 12 : 0;
        TermHead oppositeHead = termHead(year, opposite);
        int correction = halfHead.diffDay() > 9 ? 15 - halfHead.diffDay() : -halfHead.diffDay();
        LocalDateTime previousHead = halfHead.date()
                .plusDays(correction + previousIndex % 12 * 15L)
                .withHour(23).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime nextHead = halfHead.date()
                .plusDays(correction + (previousIndex % 12 + 1) * 15L)
                .withHour(23).withMinute(0).withSecond(0).withNano(0);

        int selectedIndex = previousIndex;
        boolean leapTerm = false;
        if (previousHead.isAfter(calendar.clock())) {
            selectedIndex = (selectedIndex == 0 ? 24 : selectedIndex) - 1;
        } else if (nextHead.isBefore(calendar.clock())) {
            selectedIndex = nextIndex;
        }
        if (nextIndex % 12 == 0) {
            TermHead nextTermHead = termHead(year, nextIndex);
            if (calendar.clock().isAfter(nextHead)
                    && nextTermHead.diffDay() >= 9
                    && halfHead.diffDay() < 9) {
                leapTerm = true;
                selectedIndex = selectedIndex == 0 ? 23 : selectedIndex - 1;
            }
        }
        if (previousIndex % 12 == 0
                && calendar.clock().isBefore(previousHead)
                && halfHead.diffDay() >= 9
                && oppositeHead.diffDay() < 9) {
            leapTerm = true;
        }

        Yuan yuan = yuan(calendar.dayPillar());
        int signed = digit(JU_ARR.get(yuan.index()), selectedIndex);
        if (selectedIndex >= 12) signed *= -1;
        return new BureauData(signed, selectedIndex, yuan, leapTerm);
    }

    private TermHead termHead(int year, int termIndex) {
        String name = SOLAR_TERMS.get(termIndex);
        Solar termSolar = solarTerm(year, name);
        Lunar lunar = termSolar.getLunar();
        EightChar eightChar = lunar.getEightChar();
        eightChar.setSect(1);
        Yuan yuan = yuan(eightChar.getDay());
        return new TermHead(local(termSolar), 5 * yuan.index() + yuan.day());
    }

    private Solar solarTerm(int year, String name) {
        List<Solar> candidates = new ArrayList<>();
        for (int month : List.of(1, 6, 12)) {
            Map<String, Solar> table = Solar.fromYmd(year, month, 15).getLunar().getJieQiTable();
            for (Solar candidate : table.values()) {
                JieQi current = candidate.getLunar().getCurrentJieQi();
                if (candidate.getYear() == year && current != null && name.equals(current.getName())) {
                    candidates.add(candidate);
                }
            }
        }
        Solar candidate = candidates.stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("无法取得节气时间：" + year + name));
        LocalDateTime reference = parseSecond(referenceSolarTerm(candidate, name));
        return Solar.fromYmdHms(
                reference.getYear(), reference.getMonthValue(), reference.getDayOfMonth(),
                reference.getHour(), reference.getMinute(), reference.getSecond());
    }

    private String referenceSolarTerm(Solar solar, String name) {
        String value = REFERENCE_SOLAR_TERMS.get(solar.getYear() + "|" + name);
        if (value == null) throw new IllegalStateException("参考站节气表缺失：" + solar.getYear() + name);
        return value;
    }

    private static Map<String, String> loadReferenceSolarTerms() {
        InputStream stream = ShijiaJueceEngine.class.getResourceAsStream("/juece-reference-solar-terms.csv");
        if (stream == null) throw new IllegalStateException("参考站节气表不存在");
        Map<String, String> result = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            reader.lines().skip(1).forEach(line -> {
                String[] fields = line.split(",", 3);
                if (fields.length != 3) throw new IllegalStateException("参考站节气表格式无效");
                result.put(fields[0] + "|" + fields[1], fields[2]);
            });
        } catch (IOException exception) {
            throw new IllegalStateException("参考站节气表读取失败", exception);
        }
        return Map.copyOf(result);
    }

    private HeadData head(int signedJu, CalendarData calendar) {
        int headIndex = headIndex(calendar.hourPillar());
        String xunShou = "甲" + SIX_JIA.get(headIndex) + TROOPS.get(headIndex);
        int headPalace = signedJu > 0
                ? floorMod(headIndex + signedJu, 9)
                : floorMod(9 + Math.abs(signedJu) - headIndex, 9);
        if (headPalace == 0) headPalace = 9;
        String horse = horseBranch(calendar.hourPillar());
        return new HeadData(headIndex, headPalace, xunShou, horse, null, null);
    }

    private List<PalaceData> rotatingPalaces(
            ChartRequest request,
            BureauData bureau,
            CalendarData calendar,
            HeadData baseHead) {
        int attachPalace = attachPalace(request.pan().centerPalaceMethod(), bureau.termIndex());
        StaticPalace chiefStatic = staticPalace(baseHead.headPalace());
        int earthChiefIndex = chiefStatic.orderIndex();
        String chiefDoor = chiefStatic.door();
        if (earthChiefIndex < 0) {
            StaticPalace attached = staticPalace(attachPalace);
            earthChiefIndex = attached.orderIndex();
            chiefDoor = attached.door();
        }
        HeadData head = baseHead.withChief(chiefStatic.star(), chiefDoor);

        List<PalaceData> turn = new ArrayList<>();
        for (int orderIndex = 0; orderIndex < TURN_TABLE.size(); orderIndex++) {
            int palace = TURN_TABLE.get(orderIndex);
            PalaceData data = new PalaceData(palace);
            data.earthStem = earthStem(bureau.signedNumber(), palace);
            data.earthStar = ROTATING_STARS.get(orderIndex);
            data.earthDoor = ROTATING_DOORS.get(orderIndex);
            if (palace == attachPalace) {
                data.attachedEarthStem = earthStem(bureau.signedNumber(), 5);
                data.attachedEarthStar = "天禽";
            }
            turn.add(data);
        }

        int heavenChiefIndex = rotatingChiefIndex(turn, calendar.hourPillar(), baseHead.headIndex());
        int chiefDoorIndex = rotatingDoorIndex(calendar.hourPillar(), bureau.signedNumber(), baseHead.headPalace(), attachPalace);
        for (int orderIndex = 0; orderIndex < turn.size(); orderIndex++) {
            PalaceData target = turn.get(orderIndex);
            PalaceData source = turn.get(floorMod(8 + orderIndex + earthChiefIndex - heavenChiefIndex, 8));
            target.heavenStar = source.earthStar;
            target.heavenStem = source.earthStem;
            target.attachedHeavenStar = source.attachedEarthStar;
            target.attachedHeavenStem = source.attachedEarthStem;
            int deityIndex = bureau.signedNumber() < 0
                    ? floorMod(8 - orderIndex + heavenChiefIndex, 8)
                    : floorMod(8 + orderIndex - heavenChiefIndex, 8);
            target.heavenDeity = ROTATING_DEITIES.get(deityIndex);
            PalaceData doorSource = turn.get(floorMod(8 + orderIndex + earthChiefIndex - chiefDoorIndex, 8));
            target.heavenDoor = doorSource.earthDoor;
        }

        PalaceData center = new PalaceData(5);
        center.earthStem = earthStem(bureau.signedNumber(), 5);
        center.earthStar = "天禽";
        center.earthDoor = null;
        turn.add(center);

        baseHead.chiefStar = head.chiefStar();
        baseHead.chiefDoor = head.chiefDoor();
        return turn;
    }

    private List<PalaceData> flyingPalaces(
            ChartRequest request,
            BureauData bureau,
            CalendarData calendar,
            HeadData head) {
        head.chiefStar = FLYING_STARS.get(head.headPalace() - 1);
        head.chiefDoor = FLYING_DOORS.get(head.headPalace() - 1);
        int doorIndex = flyingDoorIndex(calendar.hourPillar(), bureau.signedNumber(), head.headPalace());
        int chiefIndex = flyingChiefIndex(calendar.hourPillar(), bureau.signedNumber(), head.headPalace(), head.headIndex());
        int headBranchIndex = ZHI.indexOf(SIX_JIA.get(head.headIndex()));
        List<PalaceData> result = new ArrayList<>();

        for (int zero = 0; zero < 9; zero++) {
            int palace = zero + 1;
            PalaceData data = new PalaceData(palace);
            data.earthStem = earthStem(bureau.signedNumber(), palace);
            if (bureau.signedNumber() > 0) {
                int path = floorMod(9 - head.headPalace() + zero, 9) + 1;
                data.hiddenGanZhi = GAN.get(path) + ZHI.get(floorMod(headBranchIndex + path, 12));
                data.earthDeity = FLYING_YANG_DEITIES.get(floorMod(19 - head.headPalace() + zero, 9));
                data.heavenDeity = FLYING_YANG_DEITIES.get(floorMod(9 - chiefIndex + zero, 9));
            } else {
                int path = floorMod(18 + head.headPalace() - zero - 2, 9) + 1;
                data.hiddenGanZhi = GAN.get(path) + ZHI.get(floorMod(headBranchIndex + path, 12));
                data.earthDeity = FLYING_YIN_DEITIES.get(floorMod(9 + head.headPalace() - zero - 1, 9));
                data.heavenDeity = FLYING_YIN_DEITIES.get(floorMod(9 + chiefIndex - zero, 9));
            }
            data.heavenStem = earthStem(
                    bureau.signedNumber(),
                    floorMod(9 - chiefIndex + zero + head.headPalace() - 1, 9) + 1);
            boolean forward = "all_forward".equals(request.pan().directionRule()) || bureau.signedNumber() > 0;
            int doorSource = forward
                    ? floorMod(9 - doorIndex + zero + head.headPalace() - 1, 9)
                    : floorMod(9 + doorIndex - zero + head.headPalace() - 1, 9);
            int starSource = forward
                    ? floorMod(9 - chiefIndex + zero + head.headPalace() - 1, 9)
                    : floorMod(9 + chiefIndex - zero + head.headPalace() - 1, 9);
            data.heavenDoor = FLYING_DOORS.get(doorSource);
            data.heavenStar = FLYING_STARS.get(starSource);
            result.add(data);
        }
        return result;
    }

    private Palace normalizedPalace(PalaceData data, int chiefStarPalace, int chiefDoorPalace) {
        PalaceMeta meta = PALACE_META.get(data.index);
        Attached attached = data.attachedEarthStem == null ? null : new Attached(
                data.attachedEarthStem,
                data.attachedEarthStar,
                data.attachedHeavenStem,
                data.attachedHeavenStar);
        return new Palace(
                data.index,
                meta.trigram(),
                meta.direction(),
                meta.element(),
                new PlateLayer(data.heavenStem, data.heavenStar, data.heavenDoor, data.heavenDeity),
                new PlateLayer(data.earthStem, data.earthStar, data.earthDoor, data.earthDeity),
                attached,
                data.hiddenGanZhi,
                List.of(),
                List.of(),
                List.of(),
                data.isVoid,
                data.isHorse,
                data.index == chiefStarPalace,
                data.index == chiefDoorPalace);
    }

    private int rotatingChiefIndex(List<PalaceData> turn, String hourPillar, int headIndex) {
        String hourStem = hourPillar.substring(0, 1);
        if ("甲".equals(hourStem)) hourStem = TROOPS.get(headIndex);
        for (int index = 0; index < turn.size(); index++) {
            PalaceData palace = turn.get(index);
            if (hourStem.equals(palace.earthStem) || hourStem.equals(palace.attachedEarthStem)) return index;
        }
        throw new IllegalStateException("值符天干未落宫");
    }

    private int rotatingDoorIndex(String hourPillar, int signedJu, int headPalace, int attachPalace) {
        int branchIndex = ZHI.indexOf(hourPillar.substring(1));
        int headIndex = headIndex(hourPillar);
        int offset = floorMod(branchIndex - ZHI.indexOf(SIX_JIA.get(headIndex)), 12);
        int palace = signedJu < 0
                ? floorMod(headPalace - offset + 9, 9)
                : floorMod(headPalace + offset, 9);
        if (palace == 0) palace = 9;
        int index = TURN_TABLE.indexOf(palace);
        return index >= 0 ? index : staticPalace(attachPalace).orderIndex();
    }

    private int flyingDoorIndex(String hourPillar, int signedJu, int headPalace) {
        int branchIndex = ZHI.indexOf(hourPillar.substring(1));
        int headIndex = headIndex(hourPillar);
        int offset = floorMod(branchIndex - ZHI.indexOf(SIX_JIA.get(headIndex)), 12);
        return signedJu < 0
                ? floorMod(headPalace - 1 - offset + 9, 9)
                : floorMod(headPalace - 1 + offset, 9);
    }

    private int flyingChiefIndex(String hourPillar, int signedJu, int headPalace, int headIndex) {
        int stemIndex = TROOPS.indexOf(hourPillar.substring(0, 1));
        if (stemIndex < 0) stemIndex = headIndex;
        int offset = floorMod(9 + stemIndex - headIndex, 9);
        return signedJu > 0
                ? floorMod(headPalace - 1 + offset, 9)
                : floorMod(9 + headPalace - 1 - offset, 9);
    }

    private String earthStem(int signedJu, int palace) {
        int index = signedJu > 0
                ? floorMod(9 - signedJu + palace, 9)
                : Math.abs((-9 + signedJu + palace) % 9);
        return TROOPS.get(index);
    }

    private Yuan yuan(String dayPillar) {
        int ganIndex = GAN.indexOf(dayPillar.substring(0, 1));
        int zhiIndex = ZHI.indexOf(dayPillar.substring(1));
        int head = floorMod(12 + zhiIndex - ganIndex % 5, 12);
        int yuan = head % 3 == 0 ? 0 : head % 3 == 1 ? 2 : 1;
        int day = floorMod(12 + zhiIndex - head, 12) + 1;
        return new Yuan(yuan, day);
    }

    private int headIndex(String pillar) {
        int ganIndex = GAN.indexOf(pillar.substring(0, 1));
        int zhiIndex = ZHI.indexOf(pillar.substring(1));
        String headBranch = ZHI.get(floorMod(12 + zhiIndex - ganIndex, 12));
        int index = SIX_JIA.indexOf(headBranch);
        if (index < 0) throw new IllegalArgumentException("干支不在六十甲子中");
        return index;
    }

    private String emptyBranches(String pillar) {
        int headIndex = headIndex(pillar);
        int branchIndex = ZHI.indexOf(SIX_JIA.get(headIndex));
        return ZHI.get(floorMod(branchIndex - 2, 12)) + ZHI.get(floorMod(branchIndex - 1, 12));
    }

    private Set<Integer> voidPalaces(String branches) {
        Set<Integer> palaces = new HashSet<>();
        palaces.add(branchPalace(branches.substring(0, 1)));
        palaces.add(branchPalace(branches.substring(1)));
        return palaces;
    }

    private int branchPalace(String branch) {
        int branchIndex = ZHI.indexOf(branch);
        int orderIndex = 2 * Math.floorDiv(branchIndex, 3) + (branchIndex % 3 == 0 ? 0 : 1);
        return TURN_TABLE.get(orderIndex);
    }

    private String horseBranch(String hourPillar) {
        int branchIndex = ZHI.indexOf(hourPillar.substring(1));
        return ZHI.get(floorMod(branchIndex % 4 * -3 + 12 + 2, 12));
    }

    private int horsePalace(String branch) {
        return branchPalace(branch);
    }

    private int attachPalace(String method, int termIndex) {
        return switch (method) {
            case "kun" -> 2;
            case "yang_gen_yin_kun" -> termIndex >= 12 ? 2 : 8;
            case "four_corners" -> termIndex >= 1 && termIndex <= 6 ? 8
                    : termIndex <= 12 ? 4 : termIndex <= 18 ? 2 : 6;
            case "seasonal" -> termIndex <= 2 ? 1 : termIndex <= 5 ? 8
                    : termIndex <= 8 ? 3 : termIndex <= 11 ? 4
                    : termIndex <= 14 ? 9 : termIndex <= 17 ? 2
                    : termIndex <= 20 ? 7 : 6;
            default -> throw new IllegalArgumentException("不支持的寄宫方式");
        };
    }

    private StaticPalace staticPalace(int palace) {
        if (palace == 5) return new StaticPalace(-1, "天禽", null);
        int order = TURN_TABLE.indexOf(palace);
        if (order < 0) throw new IllegalArgumentException("宫位无效");
        return new StaticPalace(order, ROTATING_STARS.get(order), ROTATING_DOORS.get(order));
    }

    private String selectedVoid(String basis, VoidBranches voids) {
        return switch (basis) {
            case "year" -> voids.year();
            case "month" -> voids.month();
            case "day" -> voids.day();
            case "hour" -> voids.hour();
            default -> throw new IllegalArgumentException("不支持的旬空标记");
        };
    }

    private String bureauLabel(BureauOption bureau) {
        return switch (bureau.method()) {
            case "chai_bu" -> "拆补";
            case "zhi_run" -> "置闰";
            case "mao_shan" -> "茅山";
            case "manual" -> ("yang".equals(bureau.dunType()) ? "手工阳遁" : "手工阴遁") + bureau.number() + "局";
            default -> throw new IllegalArgumentException("不支持的定局方式");
        };
    }

    private String methodLabel(ChartRequest request, String panLabel, String bureauLabel) {
        String panRule = "rotating".equals(request.pan().style())
                ? centerLabel(request.pan().centerPalaceMethod())
                : directionLabel(request.pan().directionRule());
        return panLabel + " · " + panRule + " · " + bureauLabel + " · " + voidLabel(request.voidBasis());
    }

    private String centerLabel(String method) {
        return switch (method) {
            case "kun" -> "寄坤宫";
            case "yang_gen_yin_kun" -> "阳艮阴坤";
            case "four_corners" -> "寄四维";
            case "seasonal" -> "随节令";
            default -> throw new IllegalArgumentException("不支持的寄宫方式");
        };
    }

    private String directionLabel(String rule) {
        return "all_forward".equals(rule) ? "阴阳皆顺" : "阳顺阴逆";
    }

    private String voidLabel(String basis) {
        return switch (basis) {
            case "year" -> "年空";
            case "month" -> "月空";
            case "day" -> "日空";
            case "hour" -> "时空";
            default -> throw new IllegalArgumentException("不支持的旬空标记");
        };
    }

    private void validateOptions(ChartRequest request) {
        if (!VOID_BASES.contains(request.voidBasis())) throw new IllegalArgumentException("不支持的旬空标记");
        if (!Set.of("standard", "true_solar").contains(request.time().mode())) {
            throw new IllegalArgumentException("不支持的时间方式");
        }
        if ("true_solar".equals(request.time().mode())) {
            if (request.time().areaCode() == null || !request.time().areaCode().matches("\\d{6}")) {
                throw new IllegalArgumentException("真太阳时必须提供六位地区码");
            }
        } else if (request.time().areaCode() != null) {
            throw new IllegalArgumentException("标准时间不接受地区码");
        }

        if ("rotating".equals(request.pan().style())) {
            if (!CENTER_METHODS.contains(request.pan().centerPalaceMethod())) {
                throw new IllegalArgumentException("转盘必须指定寄宫方式");
            }
            if (request.pan().directionRule() != null) {
                throw new IllegalArgumentException("转盘不接受飞盘顺逆规则");
            }
        } else if ("flying".equals(request.pan().style())) {
            if (!DIRECTION_RULES.contains(request.pan().directionRule())) {
                throw new IllegalArgumentException("飞盘必须指定顺逆规则");
            }
            if (request.pan().centerPalaceMethod() != null) {
                throw new IllegalArgumentException("飞盘不接受寄宫参数");
            }
        } else {
            throw new IllegalArgumentException("不支持的盘式");
        }

        if (!BUREAU_METHODS.contains(request.bureau().method())) {
            throw new IllegalArgumentException("不支持的定局方式");
        }
        if ("manual".equals(request.bureau().method())) {
            if (!Set.of("yin", "yang").contains(request.bureau().dunType())
                    || request.bureau().number() == null
                    || request.bureau().number() < 1
                    || request.bureau().number() > 9) {
                throw new IllegalArgumentException("手工定局须指定阴阳遁与 1–9 局");
            }
        } else if (request.bureau().dunType() != null || request.bureau().number() != null) {
            throw new IllegalArgumentException("自动定局不接受手工局参数");
        }
    }

    private LocalDateTime parseMinute(String text) {
        try {
            return LocalDateTime.parse(text, MINUTE);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("起局日期或时间无效", exception);
        }
    }

    private LocalDateTime parseSecond(String text) {
        try {
            return LocalDateTime.parse(text, SECOND);
        } catch (DateTimeParseException exception) {
            throw new IllegalStateException("节气时间格式无效", exception);
        }
    }

    private LocalDateTime local(Solar solar) {
        try {
            return LocalDateTime.of(
                    solar.getYear(), solar.getMonth(), solar.getDay(),
                    solar.getHour(), solar.getMinute(), solar.getSecond());
        } catch (DateTimeException exception) {
            throw new IllegalStateException("历法时间无效", exception);
        }
    }

    private int digit(String value, int index) {
        return Character.digit(value.charAt(index), 10);
    }

    private int floorMod(int value, int modulus) {
        return Math.floorMod(value, modulus);
    }

    private record PalaceMeta(String trigram, String direction, String element) {}
    private record Yuan(int index, int day) {}
    private record TermHead(LocalDateTime date, int diffDay) {}
    private record StaticPalace(int orderIndex, String star, String door) {}
    private record BureauData(int signedNumber, int termIndex, Yuan yuan, boolean leapTerm) {
        BureauData(int signedNumber, int termIndex, Yuan yuan) {
            this(signedNumber, termIndex, yuan, false);
        }
    }
    private record CalendarData(
            LocalDateTime clock,
            Lunar lunar,
            String yearPillar,
            String monthPillar,
            String dayPillar,
            String hourPillar,
            VoidBranches voids,
            SolarTerm previousTerm,
            SolarTerm nextTerm,
            int previousTermIndex,
            int nextTermIndex) {}

    private static final class HeadData {
        private final int headIndex;
        private final int headPalace;
        private final String xunShou;
        private final String horseBranch;
        private String chiefStar;
        private String chiefDoor;

        HeadData(int headIndex, int headPalace, String xunShou, String horseBranch, String chiefStar, String chiefDoor) {
            this.headIndex = headIndex;
            this.headPalace = headPalace;
            this.xunShou = xunShou;
            this.horseBranch = horseBranch;
            this.chiefStar = chiefStar;
            this.chiefDoor = chiefDoor;
        }

        int headIndex() { return headIndex; }
        int headPalace() { return headPalace; }
        String xunShou() { return xunShou; }
        String horseBranch() { return horseBranch; }
        String chiefStar() { return chiefStar; }
        String chiefDoor() { return chiefDoor; }
        HeadData withChief(String star, String door) {
            return new HeadData(headIndex, headPalace, xunShou, horseBranch, star, door);
        }
    }

    private static final class PalaceData {
        private final int index;
        private String earthStem;
        private String earthStar;
        private String earthDoor;
        private String earthDeity;
        private String heavenStem;
        private String heavenStar;
        private String heavenDoor;
        private String heavenDeity;
        private String attachedEarthStem;
        private String attachedEarthStar;
        private String attachedHeavenStem;
        private String attachedHeavenStar;
        private String hiddenGanZhi;
        private boolean isVoid;
        private boolean isHorse;

        PalaceData(int index) {
            this.index = index;
        }
    }
}
