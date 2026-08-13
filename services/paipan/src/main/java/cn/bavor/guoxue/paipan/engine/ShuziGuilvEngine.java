package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.ShuziGuilvModels.*;

import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.domain.shenshu.ShuDes;
import com.sunland.app.domain.shenshu.ShuResult;
import com.sunland.app.domain.shenshu.XuanQingNumberShenshu;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ShuziGuilvEngine {
    public ChartResponse chart(ChartRequest request) {
        String genderLabel = "male".equals(request.gender()) ? "男" : "女";
        BaZiBody body = new BaZiBody();
        body.setUserName(request.name());
        body.setSex(genderLabel);
        body.setBirthDay(request.birthDateTime());

        XuanQingNumberShenshu source = XuanQingNumberShenshu.getXuanQingNumberShenshu(body);
        return new ChartResponse(
                new Overview(
                        request.name(), request.gender(), genderLabel, source.getYearGongLi(),
                        source.getYearNongLi(), source.getChineseZodiac()),
                numberSet(source.getPrev()),
                numberSet(source.getNext()),
                interpretations(source.getShuDesList()));
    }

    private NumberSet numberSet(ShuResult result) {
        return new NumberSet(
                new NumberCell(List.of(result.getYear()), List.of(result.getYearYinYang()), List.of(result.getYearWuXing())),
                new NumberCell(List.of(result.getMonth()), List.of(result.getMonthYinYang()), List.of(result.getMonthWuXing())),
                new NumberCell(List.copyOf(result.getDay()), List.copyOf(result.getDayYinYang()), List.copyOf(result.getDayWuXing())),
                new NumberCell(List.of(result.getHour()), List.of(result.getHourYinYang()), List.of(result.getHourWuXing())));
    }

    private List<Interpretation> interpretations(List<ShuDes> source) {
        Map<String, Interpretation> grouped = new LinkedHashMap<>();
        for (ShuDes item : source) {
            String key = String.join("|", item.getNumericalArray(), item.getSpecialArray(),
                    item.getOccurrencePositions(), item.getResultDescription());
            Interpretation existing = grouped.get(key);
            grouped.put(key, existing == null
                    ? new Interpretation(item.getNumericalArray(), item.getSpecialArray(),
                            item.getOccurrencePositions(), item.getResultDescription(), 1)
                    : new Interpretation(existing.combination(), existing.position(), existing.category(),
                            existing.description(), existing.occurrences() + 1));
        }
        return new ArrayList<>(grouped.values());
    }
}
