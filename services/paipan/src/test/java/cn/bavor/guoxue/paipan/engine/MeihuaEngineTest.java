package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.MeihuaModels.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class MeihuaEngineTest {
    private final MeihuaEngine engine = new MeihuaEngine();

    @Test
    void matchesTheReferenceTimeGoldenCase() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "time", null, null, null, null,
                null, null, null, null, null));

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
    void matchesTheLengshanTwoAndThreeNumberMatrix() {
        ChartResponse digitDouble = numberChart(2, 123L, 456L, null, false, "digit_sum");
        ChartResponse digitDoubleWithHour = numberChart(2, 123L, 456L, null, true, "digit_sum");
        ChartResponse digitTriple = numberChart(3, 123L, 456L, 788L, false, "digit_sum");
        ChartResponse digitTripleWithHour = numberChart(3, 123L, 456L, 788L, true, "digit_sum");
        ChartResponse rawDouble = numberChart(2, 123L, 456L, null, false, "raw_number");
        ChartResponse rawDoubleWithHour = numberChart(2, 123L, 456L, null, true, "raw_number");
        ChartResponse rawTriple = numberChart(3, 123L, 456L, 788L, false, "raw_number");
        ChartResponse rawTripleWithHour = numberChart(3, 123L, 456L, 788L, true, "raw_number");

        assertThat(List.of(digitDouble.upperTrigram(), digitDouble.lowerTrigram(), digitDouble.movingLine()))
                .containsExactly(6, 7, 3);
        assertThat(digitDoubleWithHour.movingLine()).isEqualTo(2);
        assertThat(digitTriple.movingLine()).isEqualTo(5);
        assertThat(digitTripleWithHour.movingLine()).isEqualTo(1);
        assertThat(List.of(rawDouble.upperTrigram(), rawDouble.lowerTrigram(), rawDouble.movingLine()))
                .containsExactly(3, 8, 3);
        assertThat(rawDoubleWithHour.movingLine()).isEqualTo(2);
        assertThat(rawTriple.movingLine()).isEqualTo(2);
        assertThat(rawTripleWithHour.movingLine()).isEqualTo(1);
        assertThat(digitTriple.overview().numberCount()).isEqualTo(3);
        assertThat(digitTriple.overview().numberThree()).isEqualTo(788L);
        assertThat(digitTripleWithHour.overview().includeHour()).isTrue();
    }

    @Test
    void mapsZeroRemaindersToEightAndSix() {
        ChartResponse chart = numberChart(3, 8L, 8L, 6L, false, "raw_number");

        assertThat(List.of(chart.upperTrigram(), chart.lowerTrigram(), chart.movingLine()))
                .containsExactly(8, 8, 6);
    }

    @Test
    void usesSpecifiedTrigramsAndMovingLine() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "specified", null, null, null, null,
                null, null, 1, 8, 2));

        assertThat(chart.original().name()).isEqualTo("天地否");
        assertThat(chart.movingLine()).isEqualTo(2);
        assertThat(chart.overview().school()).isNull();
    }

    @Test
    void rejectsIncompleteModeConfiguration() {
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "2026-08-11 21:31", "number", 3, 123L, 456L, null,
                false, "digit_sum", null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("起盘参数");
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "2026-08-11 21:31", "number", 2, 123L, 456L, 789L,
                false, "digit_sum", null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("起盘参数");
        assertThatThrownBy(() -> numberChart(2, 0L, 456L, null, false, "digit_sum"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1–999999999");
        assertThatThrownBy(() -> numberChart(3, 123L, 456L, 1_000_000_000L, false, "raw_number"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1–999999999");
    }

    private ChartResponse numberChart(
            int numberCount,
            long numberOne,
            long numberTwo,
            Long numberThree,
            boolean includeHour,
            String school) {
        return engine.chart(new ChartRequest(
                "2026-08-11 20:00", "number", numberCount,
                numberOne, numberTwo, numberThree, includeHour, school,
                null, null, null));
    }
}
