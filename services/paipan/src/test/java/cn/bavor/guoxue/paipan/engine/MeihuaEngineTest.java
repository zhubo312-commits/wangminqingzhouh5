package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.MeihuaModels.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class MeihuaEngineTest {
    private final MeihuaEngine engine = new MeihuaEngine();

    @Test
    void matchesTheReferenceTimeGoldenCase() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "time", null, null, null, null, null, null, null));

        assertThat(chart.overview().method()).isEqualTo("时间起盘");
        assertThat(chart.overview().solarDateTime()).isEqualTo("2026-08-11 21:31");
        assertThat(chart.overview().pillars()).isEqualTo(new Pillars("丙午", "丙申", "丁巳", "辛亥"));
        assertThat(chart.overview().voidBranches()).isEqualTo("子丑");
        assertThat(chart.upperTrigram()).isEqualTo(2);
        assertThat(chart.lowerTrigram()).isEqualTo(6);
        assertThat(chart.movingLine()).isEqualTo(6);
        assertThat(chart.original().key()).isEqualTo("duikan");
        assertThat(chart.original().name()).isEqualTo("泽水困");
        assertThat(chart.mutual().key()).isEqualTo("xunli");
        assertThat(chart.mutual().name()).isEqualTo("风火家人");
        assertThat(chart.changed().key()).isEqualTo("qiankan");
        assertThat(chart.changed().name()).isEqualTo("天水讼");
        assertThat(chart.original().lines()).hasSize(6);
    }

    @Test
    void supportsBothNumberSchoolsAndHourOption() {
        ChartResponse digitSum = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "number", 123L, 456L, false, "digit_sum", null, null, null));
        assertThat(digitSum.upperTrigram()).isEqualTo(6);
        assertThat(digitSum.lowerTrigram()).isEqualTo(7);
        assertThat(digitSum.movingLine()).isEqualTo(3);
        assertThat(digitSum.original().name()).isEqualTo("水山蹇");

        ChartResponse rawWithHour = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "number", 123L, 456L, true, "raw_number", null, null, null));
        assertThat(rawWithHour.upperTrigram()).isEqualTo(3);
        assertThat(rawWithHour.lowerTrigram()).isEqualTo(8);
        assertThat(rawWithHour.movingLine()).isEqualTo(3);
        assertThat(rawWithHour.overview().includeHour()).isTrue();
    }

    @Test
    void usesSpecifiedTrigramsAndMovingLine() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "specified", null, null, null, null, 1, 8, 2));

        assertThat(chart.original().name()).isEqualTo("天地否");
        assertThat(chart.movingLine()).isEqualTo(2);
        assertThat(chart.overview().school()).isNull();
    }

    @Test
    void rejectsIncompleteModeConfiguration() {
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "2026-08-11 21:31", "number", 123L, null, false, "digit_sum", null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("起盘参数");
    }
}
