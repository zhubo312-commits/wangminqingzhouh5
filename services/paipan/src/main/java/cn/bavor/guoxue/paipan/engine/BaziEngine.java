package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.BaziModels.*;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.app.domain.bazi.BzPersonInfo;
import com.sunland.app.domain.bazi.CustomLiuYue;
import com.sunland.app.domain.bazi.GuangYuanShenQiangShenRuo;
import com.sunland.app.domain.bazi.TreeNode;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.utils.bazi.ShenShaDataUtil;
import com.sunland.app.utils.bazi.SolarTimeUtil;
import com.sunland.common.constant.Constants;
import com.sunland.common.utils.DateUtils;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class BaziEngine {
    public List<AreaNode> areas() {
        return SolarTimeUtil.getProvinceCountry().stream().map(this::areaNode).toList();
    }

    public ResolveBirthResponse resolveBirth(ResolveBirthRequest request) {
        List<Solar> dates = switch (request.mode()) {
            case "solar" -> List.of(solarFromText(required(request.solarDateTime(), "请填写阳历出生时间")));
            case "lunar" -> List.of(solarFromLunar(required(request.lunar(), "请填写阴历出生时间")));
            case "fourPillars" -> solarFromPillars(required(request.pillars(), "请填写完整四柱"));
            default -> throw new IllegalArgumentException("不支持的出生时间类型");
        };

        List<BirthCandidate> candidates = dates.stream()
                .filter(date -> date.getYear() >= 1900 && date.getYear() <= 2100)
                .map(date -> {
                    String value = minuteText(date);
                    return new BirthCandidate(value, value, value + "（阳历）");
                })
                .distinct()
                .toList();
        if (candidates.isEmpty()) {
            throw new IllegalArgumentException("未找到 1900–2100 年范围内的阳历候选");
        }
        return new ResolveBirthResponse(candidates, 2);
    }

    public ChartResponse chart(ChartRequest request) {
        BzPersonInfo info = BzPersonInfo.fromBaZiBody(body(request, null));
        List<Pillar> pillars = List.of(
                pillar("year", "年柱", info.getYearGan(), info.getYearZhi(), info.getYearGanWuXing(), info.getYearZhiWuXing(), info.getYearGanShiShen(), info.getYearCangGan(), info.getYearCangGanWx(), info.getYearZhiShiShen(), info.getYearDiShi(), info.getYearZiZuo(), info.getYearNaYin(), info.getYearXunKong(), info.getYearShenSha()),
                pillar("month", "月柱", info.getMonthGan(), info.getMonthZhi(), info.getMonthGanWuXing(), info.getMonthZhiWuXing(), info.getMonthGanShiShen(), info.getMonthCangGan(), info.getMonthCangGanWx(), info.getMonthZhiShiShen(), info.getMonthDiShi(), info.getMonthZiZuo(), info.getMonthNaYin(), info.getMonthXunKong(), info.getMonthShenSha()),
                pillar("day", "日柱", info.getDayGan(), info.getDayZhi(), info.getDayGanWuXing(), info.getDayZhiWuXing(), info.getDayGanShiShen(), info.getDayCangGan(), info.getDayCangGanWx(), info.getDayZhiShiShen(), info.getDayDiShi(), info.getDayZiZuo(), info.getDayNaYin(), info.getDayXunKong(), info.getDayShenSha()),
                pillar("hour", "时柱", info.getTimeGan(), info.getTimeZhi(), info.getTimeGanWuXing(), info.getTimeZhiWuXing(), info.getTimeGanShiShen(), info.getTimeCangGan(), info.getTimeCangGanWx(), info.getTimeZhiShiShen(), info.getTimeDiShi(), info.getTimeZiZuo(), info.getTimeNaYin(), info.getTimeXunKong(), info.getTimeShenSha()));

        Profile profile = new Profile(
                blankToEmpty(info.getUserName()),
                request.gender(),
                info.getBirthDay(),
                info.getLunarDate(),
                info.getArea(),
                info.getDistrictGeocode(),
                info.getTrueSolarTime(),
                info.getChineseZodiac(),
                info.getZodiac());
        BasicFacts facts = new BasicFacts(
                info.getBenmingfo(), info.getTaiYuan(), info.getTaiYuanNaYin(), info.getMingGong(),
                info.getMingGongNaYin(), info.getDuiChong(), info.getSanSha(), info.getWenChangWei(),
                info.getPrevJieQi(), info.getNextJieQi());
        Fortune fortune = new Fortune(info.getStartSolarYun(), info.getStartYun(), info.getChangeYun(), periods(info.getDaYun()));

        return new ChartResponse(
                profile,
                facts,
                pillars,
                new Attention(list(info.getTianGanAttention()), list(info.getDiZhiAttention())),
                info.getShenShaDesc() == null ? Map.of() : info.getShenShaDesc(),
                fortune,
                strength(info));
    }

    public FlowMonthsResponse flowMonths(FlowMonthsRequest request) {
        BaZiBody body = body(request.chart(), String.valueOf(request.year()));
        List<CustomLiuYue> source = BzPersonInfo.getLiuYue(body);
        List<FlowMonth> months = source == null ? List.of() : source.stream()
                .map(month -> new FlowMonth(
                        month.getIndex() + 1,
                        month.getMonthInChinese() + "月",
                        month.getGanZhi(),
                        month.getJieName(),
                        month.getJieSolar(),
                        list(month.getShiShen()),
                        month.getCangGan(),
                        list(month.getCangGanShiShen()),
                        list(month.getTianGanAttention()),
                        list(month.getDiZhiAttention()),
                        list(month.getShenSha())))
                .toList();
        return new FlowMonthsResponse(request.year(), months);
    }

    public ShenShaResponse shenSha(ShenShaRequest request) {
        HashMap<String, List<String>> pillars = new HashMap<>(request.pillars());
        return new ShenShaResponse(
                request.target(),
                list(ShenShaDataUtil.getShenshaWithGanzhi(pillars, request.target(), Constants.BAZI)));
    }

    private BaZiBody body(ChartRequest request, String year) {
        DateUtils.strToDate(request.birthDateTime(), DateUtils.YYYY_MM_DD_HH_MM);
        BaZiBody body = new BaZiBody();
        body.setUserName(blankToEmpty(request.name()));
        body.setSex("male".equals(request.gender()) ? "男" : "女");
        body.setBirthDay(request.birthDateTime());
        body.setDistrictGeocode(request.areaCode());
        body.setSolar(request.useTrueSolarTime());
        body.setType(Constants.BAZI);
        body.setYearMonth(year);
        return body;
    }

    private AreaNode areaNode(TreeNode node) {
        List<AreaNode> children = node.getChildren() == null
                ? List.of()
                : node.getChildren().stream().map(this::areaNode).toList();
        String code = "其他地区".equals(node.getText()) ? "999999" : node.getValue();
        return new AreaNode(node.getText(), code, children);
    }

    private Solar solarFromText(String value) {
        return Solar.fromDate(DateUtils.strToDate(value, DateUtils.YYYY_MM_DD_HH_MM));
    }

    private Solar solarFromLunar(LunarBirth value) {
        int month = value.leapMonth() ? -value.month() : value.month();
        try {
            Lunar lunar = Lunar.fromYmdHms(value.year(), month, value.day(), value.hour(), value.minute(), 0);
            return lunar.getSolar();
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("阴历日期无效，请检查闰月和日期", exception);
        }
    }

    private List<Solar> solarFromPillars(FourPillars value) {
        try {
            return Solar.fromBaZi(value.year(), value.month(), value.day(), value.hour(), 2);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("四柱格式无效", exception);
        }
    }

    private String minuteText(Solar value) {
        return String.format("%04d-%02d-%02d %02d:%02d", value.getYear(), value.getMonth(), value.getDay(), value.getHour(), value.getMinute());
    }

    private Pillar pillar(
            String key, String label, String stem, String branch, String stemElement, String branchElement,
            String tenGod, String hiddenStems, String hiddenElements, List<String> hiddenTenGods,
            String growth, String selfSeat, String naYin, String voidBranch, List<String> shenSha) {
        return new Pillar(key, label, stem, branch, stemElement, branchElement, tenGod,
                hidden(hiddenStems, hiddenElements, hiddenTenGods), growth, selfSeat, naYin, voidBranch, list(shenSha));
    }

    private List<HiddenStem> hidden(String stems, String elements, List<String> tenGods) {
        List<String> stemList = split(stems);
        List<String> elementList = split(elements);
        List<HiddenStem> result = new ArrayList<>();
        for (int index = 0; index < stemList.size(); index++) {
            result.add(new HiddenStem(
                    stemList.get(index),
                    index < elementList.size() ? elementList.get(index) : "",
                    tenGods != null && index < tenGods.size() ? tenGods.get(index) : ""));
        }
        return result;
    }

    private List<FortunePeriod> periods(List<JSONObject> source) {
        if (source == null) return List.of();
        return source.stream().map(period -> new FortunePeriod(
                integer(period, "index"), integer(period, "startYear"), integer(period, "endYear"),
                integer(period, "startAge"), integer(period, "endAge"), text(period, "ganZhi"),
                stringList(period.get("shiShen")), text(period, "diShi"), text(period, "cangGan"),
                stringList(period.get("cangGanShiShen")), bool(period, "wealthStrong"),
                stringList(period.get("tianGanAttention")), stringList(period.get("diZhiAttention")),
                stringList(period.get("shenSha")), years(period.get("customLiuNian")))).toList();
    }

    private List<FlowYear> years(Object value) {
        Collection<?> collection = value instanceof Collection<?> c ? c : value instanceof JSONArray a ? a : List.of();
        List<FlowYear> result = new ArrayList<>();
        for (Object item : collection) {
            JSONObject year = item instanceof JSONObject object ? object : new JSONObject((Map<String, Object>) item);
            result.add(new FlowYear(
                    integer(year, "index"), integer(year, "year"), integer(year, "age"), text(year, "ganZhi"),
                    text(year, "xunKong"), stringList(year.get("shiShen")), text(year, "cangGan"),
                    stringList(year.get("cangGanShiShen")), bool(year, "wealthStrong"),
                    stringList(year.get("tianGanAttention")), stringList(year.get("diZhiAttention")),
                    stringList(year.get("shenSha"))));
        }
        return result;
    }

    private StrengthReference strength(BzPersonInfo info) {
        GuangYuanShenQiangShenRuo value = info.getGuangYuanShenQiangShenRuo();
        if (value == null) {
            return new StrengthReference(info.getStrongWeakScore(), 0, 0, "", "", "", "", List.of(), Map.of());
        }
        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put("食伤", value.getShangShi());
        scores.put("印枭", value.getYinXiao());
        scores.put("财才", value.getCaiCai());
        scores.put("官杀", value.getGuanSha());
        scores.put("劫比", value.getJieBi());
        return new StrengthReference(
                info.getStrongWeakScore(), value.getTongDangScore(), value.getYiDangScore(),
                value.getWangRuoCengCi(), value.getGeJu(), value.getDuanYu(), value.getDingXiShen(),
                list(value.getHuaWuXing()), scores);
    }

    private int integer(JSONObject object, String key) {
        Integer value = object.getInteger(key);
        return value == null ? 0 : value;
    }

    private boolean bool(JSONObject object, String key) {
        Boolean value = object.getBoolean(key);
        return value != null && value;
    }

    private String text(JSONObject object, String key) {
        return blankToEmpty(object.getString(key));
    }

    private List<String> stringList(Object value) {
        if (!(value instanceof Collection<?> collection)) return List.of();
        return collection.stream().filter(item -> item != null).map(String::valueOf).toList();
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) return List.of();
        return List.of(value.split(","));
    }

    private <T> T required(T value, String message) {
        if (value == null) throw new IllegalArgumentException(message);
        return value;
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value;
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private <T> List<T> list(List<T> value) {
        return value == null ? List.of() : value;
    }
}
