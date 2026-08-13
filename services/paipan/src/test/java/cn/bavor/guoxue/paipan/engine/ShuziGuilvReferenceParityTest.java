package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.ShuziGuilvModels.ChartRequest;
import static org.assertj.core.api.Assertions.assertThat;

import cn.bavor.guoxue.paipan.api.ShuziGuilvModels.ChartResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

class ShuziGuilvReferenceParityTest {
    private final ShuziGuilvEngine engine = new ShuziGuilvEngine();

    @Test
    void matchesTheFrozenOriginalSample() {
        ChartResponse actual = engine.chart(new ChartRequest("测试者", "male", "1990-01-01 12:00"));

        assertThat(actual.overview().solarDateTime()).isEqualTo("1990-01-01 12:00");
        assertThat(actual.overview().lunarDate()).isEqualTo("一九八九年腊月初五日午时");
        assertThat(actual.overview().chineseZodiac()).isEqualTo("蛇");
        assertThat(numbers(actual.innate())).containsExactly(List.of(6), List.of(12), List.of(5), List.of(7));
        assertThat(yinYang(actual.innate())).containsExactly(List.of("阴"), List.of("阳"), List.of("阴"), List.of("阴"));
        assertThat(elements(actual.innate())).containsExactly(List.of("火"), List.of("水"), List.of("木"), List.of("火"));
        assertThat(numbers(actual.acquired())).containsExactly(List.of(12), List.of(6), List.of(11), List.of(1));
        assertThat(actual.interpretations()).hasSize(1);
        assertThat(actual.interpretations().get(0).combination()).isEqualTo("6-12/12-6");
        assertThat(actual.interpretations().get(0).position()).isEqualTo("年月");
        assertThat(actual.interpretations().get(0).category()).isEqualTo("绝冲数组");
        assertThat(actual.interpretations().get(0).occurrences()).isEqualTo(2);
    }

    @Test
    void supportsMultiDigitLunarDaysAndTheElevenPmRollover() {
        ChartResponse before = engine.chart(new ChartRequest("边界", "female", "2024-02-10 22:59"));
        ChartResponse after = engine.chart(new ChartRequest("边界", "female", "2024-02-10 23:00"));

        assertThat(before.innate().day().numbers()).isNotEmpty();
        assertThat(after.innate().day().numbers()).isNotEmpty();
        assertThat(after.overview().lunarDate()).isNotEqualTo(before.overview().lunarDate());
    }

    private List<List<Integer>> numbers(cn.bavor.guoxue.paipan.api.ShuziGuilvModels.NumberSet set) {
        return List.of(set.year().numbers(), set.month().numbers(), set.day().numbers(), set.hour().numbers());
    }

    private List<List<String>> yinYang(cn.bavor.guoxue.paipan.api.ShuziGuilvModels.NumberSet set) {
        return List.of(set.year().yinYang(), set.month().yinYang(), set.day().yinYang(), set.hour().yinYang());
    }

    private List<List<String>> elements(cn.bavor.guoxue.paipan.api.ShuziGuilvModels.NumberSet set) {
        return List.of(set.year().elements(), set.month().elements(), set.day().elements(), set.hour().elements());
    }
}
