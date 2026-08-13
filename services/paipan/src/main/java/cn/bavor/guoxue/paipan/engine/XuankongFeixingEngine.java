package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.XuankongFeixingModels.*;

import com.alibaba.fastjson.JSONObject;
import com.sunland.app.domain.vo.FeiXingVo;
import com.sunland.app.domain.xuankongfeixing.XuanKongFeiXingGong;
import com.sunland.app.utils.xuanKongFeiXing.XuanKongFeiXing;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class XuankongFeixingEngine {
    private static final List<String> FORTUNE_LABELS = List.of("一", "二", "三", "四", "五", "六", "七", "八", "九");

    public ChartResponse chart(ChartRequest request) {
        FeiXingVo input = new FeiXingVo();
        input.setUserName("");
        input.setDaYun(request.fortunePeriod());
        input.setShanXiang(request.orientation());
        input.setPaipanTime(request.chartDateTime());
        input.setType("replacement".equals(request.method()) ? 1 : 0);
        input.setRemark(request.note() == null ? "" : request.note());

        JSONObject source = XuanKongFeiXing.getXuanKongFeiXing(input);
        @SuppressWarnings("unchecked")
        List<XuanKongFeiXingGong> sourcePalaces = (List<XuanKongFeiXingGong>) source.get("xuanKongFeiXingGong");
        @SuppressWarnings("unchecked")
        List<String> directions = (List<String>) source.get("direction");

        List<Palace> palaces = sourcePalaces.stream().map(this::palace).toList();
        String methodLabel = "replacement".equals(request.method()) ? "替盘" : "下盘";
        return new ChartResponse(
                new Overview(request.chartDateTime(), input.getYearNongLi(), request.fortunePeriod(),
                        FORTUNE_LABELS.get(request.fortunePeriod() - 1) + "运", request.orientation(),
                        request.method(), methodLabel, input.getRemark()),
                List.copyOf(directions), palaces);
    }

    private Palace palace(XuanKongFeiXingGong item) {
        return new Palace(
                item.getIndex(), item.getBaGua().name(), item.getFangWei().name(), item.getWuXing().name(),
                item.getXuanKongFeiXingStar().name(), number(item.getDaYun()), item.getShan(), item.getXiang(),
                item.getYearFlyingStar(), item.getMonthFlyingStar(), item.getDayFlyingStar(), item.getHourFlyingStar(),
                item.getShanPostion(), item.getXiangPostion(),
                new Interpretations(text(item.getShanAndXiangExplain()), text(item.getDaYunExplain()),
                        text(item.getShanExplain()), text(item.getXiangExplain()), text(item.getYearFlyingStarExplain())));
    }

    private int number(String chineseNumber) {
        return FORTUNE_LABELS.indexOf(chineseNumber) + 1;
    }

    private String text(String value) {
        return value == null ? "" : value;
    }
}
