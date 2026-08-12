package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.ShanxiangModels.*;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.domain.qimen.QiMenZao;
import com.sunland.app.utils.qimen.QimenPan;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ShanxiangEngine {
    /** The imported legacy implementation uses static intermediate palace state. */
    public synchronized ChartResponse chart(ChartRequest request) {
        List<Panel> panels = degreeSequence(request.degrees()).stream()
                .map(degrees -> panel(request.year(), degrees))
                .toList();
        return new ChartResponse(
                new Overview(request.year(), request.degrees(), blank(request.question())),
                panels);
    }

    private List<Double> degreeSequence(double selected) {
        double normalized = selected == 360 ? 0 : selected;
        int sector = Math.min(23, (int) Math.floor(normalized / 15));
        List<Double> values = new ArrayList<>(List.of(
                sector * 15d,
                sector * 15d + 5d,
                sector * 15d + 10d));
        int selectedIndex = 0;
        for (int index = values.size() - 1; index >= 0; index--) {
            if (normalized >= values.get(index)) {
                selectedIndex = index;
                break;
            }
        }
        Double active = values.remove(selectedIndex);
        values.add(0, active);
        return values;
    }

    private Panel panel(int year, double degrees) {
        BaZiBody input = new BaZiBody();
        input.setYear(year);
        input.setDegrees(degrees);
        input.setIsKe("2");

        JSONObject raw = QimenPan.getQimenPan(QiMenZao.getShanXiangQiMen(input));
        JSONObject source = raw.getJSONObject("qiMenZao");
        int chiefStarPalace = source.getIntValue("zhiFuIndex");
        int chiefDoorPalace = source.getIntValue("zhiShiIndex");
        List<Palace> palaces = mapPalaces(raw.getJSONArray("qimenGong"), chiefStarPalace, chiefDoorPalace);
        Palace horsePalace = palaces.stream().filter(Palace::isHorse).findFirst()
                .orElseThrow(() -> new IllegalStateException("山向结果缺少马星宫位"));
        PanelOverview overview = new PanelOverview(
                degrees,
                source.getString("xiang"),
                source.getString("shan"),
                source.getString("degreeRange"),
                source.getString("yinOrYangDun"),
                source.getIntValue("juShu"),
                source.getString("yearGanZhi"),
                source.getString("hourGanZhi"),
                source.getString("xunKong"),
                source.getString("xunShou"),
                new Chief(source.getString("zhiFu"), chiefStarPalace),
                new Chief(source.getString("zhiShi"), chiefDoorPalace),
                new Horse(source.getString("maXingContent"), horsePalace.index()),
                source.getString("huangQuan"));
        return new Panel(overview, palaces);
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
