package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.YinpanModels.*;

import cn.bavor.guoxue.paipan.api.BaziModels;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.domain.qimen.QiMenZao;
import com.sunland.app.utils.qimen.QimenPan;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class YinpanEngine {
    private final BaziEngine baziEngine;

    public YinpanEngine(BaziEngine baziEngine) {
        this.baziEngine = baziEngine;
    }

    /** The imported legacy implementation uses static intermediate palace state. */
    public synchronized ChartResponse chart(ChartRequest request) {
        BaZiBody input = new BaZiBody();
        input.setBirthDay(request.chartDateTime());
        input.setQuestion(blank(request.question()));
        input.setSex("male".equals(request.gender()) ? "男" : "女");
        input.setIsKe("ke".equals(request.mode()) ? "1" : "0");

        JSONObject raw = QimenPan.getQimenPan(QiMenZao.getYinPanQiMen(input));
        JSONObject source = raw.getJSONObject("qiMenZao");
        int chiefStarPalace = source.getIntValue("zhiFuIndex");
        int chiefDoorPalace = source.getIntValue("zhiShiIndex");
        List<Palace> palaces = mapPalaces(
                raw.getJSONArray("qimenGong"),
                chiefStarPalace,
                chiefDoorPalace);

        Palace horsePalace = palaces.stream().filter(Palace::isHorse).findFirst()
                .orElseThrow(() -> new IllegalStateException("阴盘结果缺少马星宫位"));
        Overview overview = new Overview(
                "ke".equals(request.mode()) ? "刻盘" : "时盘",
                blank(request.question()),
                request.gender(),
                source.getString("yearGongLi"),
                source.getString("yearNongLi"),
                new Pillars(
                        source.getString("yearGanZhi"),
                        source.getString("monthGanZhi"),
                        source.getString("dayGanZhi"),
                        source.getString("hourGanZhi")),
                source.getString("xunKong"),
                source.getString("yinOrYangDun"),
                source.getIntValue("juShu"),
                source.getString("xunShou"),
                new Chief(source.getString("zhiFu"), chiefStarPalace),
                new Chief(source.getString("zhiShi"), chiefDoorPalace),
                source.getString("prevJieQiName"),
                source.getString("nextJieQiName"),
                source.getString("yueJiang"),
                new Horse(source.getString("maXingContent"), horsePalace.index()));

        BaziModels.ChartResponse lifetime = Boolean.TRUE.equals(request.lifetime())
                ? baziEngine.chart(new BaziModels.ChartRequest(
                        "",
                        request.gender(),
                        request.chartDateTime(),
                        "999999",
                        false))
                : null;
        return new ChartResponse(
                overview,
                palaces,
                mapGates(raw.getJSONArray("tianMenDiHuList")),
                lifetime);
    }

    private List<Palace> mapPalaces(JSONArray source, int chiefStarPalace, int chiefDoorPalace) {
        List<Palace> result = new ArrayList<>();
        for (int index = 0; index < source.size(); index++) {
            JSONObject value = source.getJSONObject(index);
            int palaceIndex = value.getIntValue("index");
            result.add(new Palace(
                    palaceIndex,
                    value.getString("baGua"),
                    value.getString("fangWei"),
                    value.getString("wuXing"),
                    value.getString("baShen"),
                    value.getString("baXing"),
                    value.getString("newBaMen"),
                    stems(value.getString("tianPan")),
                    stems(value.getString("diPan")),
                    value.getString("yinGan"),
                    harms(value.getJSONArray("siHai")),
                    growth(value.getJSONArray("tianGanChangSheng")),
                    growth(value.getJSONArray("diZhiChangSheng")),
                    bool(value, "xunKong", "isXunKong"),
                    bool(value, "maXing", "isMaXing"),
                    palaceIndex == chiefStarPalace,
                    palaceIndex == chiefDoorPalace));
        }
        return result;
    }

    private List<HeavenEarthGate> mapGates(JSONArray source) {
        List<HeavenEarthGate> result = new ArrayList<>();
        for (int index = 0; index < source.size(); index++) {
            JSONObject value = source.getJSONObject(index);
            result.add(new HeavenEarthGate(
                    value.getString("diZhi"),
                    value.getString("tianMen"),
                    value.getString("diHu")));
        }
        return result;
    }

    private List<Harm> harms(JSONArray source) {
        if (source == null) return List.of();
        List<Harm> result = new ArrayList<>();
        for (int index = 0; index < source.size(); index++) {
            JSONObject value = source.getJSONObject(index);
            result.add(new Harm(value.getString("word"), value.getString("siHai")));
        }
        return result;
    }

    private List<GrowthStage> growth(JSONArray source) {
        if (source == null) return List.of();
        List<GrowthStage> result = new ArrayList<>();
        for (int index = 0; index < source.size(); index++) {
            JSONObject value = source.getJSONObject(index);
            result.add(new GrowthStage(value.getString("title"), value.getString("content")));
        }
        return result;
    }

    private List<String> stems(String value) {
        if (value == null || value.isBlank() || "UNKNOWN".equals(value)) return List.of();
        return value.codePoints().mapToObj(codePoint -> new String(Character.toChars(codePoint))).toList();
    }

    private boolean bool(JSONObject value, String primary, String fallback) {
        Boolean result = value.getBoolean(primary);
        if (result == null) result = value.getBoolean(fallback);
        return Boolean.TRUE.equals(result);
    }

    private String blank(String value) {
        return value == null ? "" : value.trim();
    }
}
