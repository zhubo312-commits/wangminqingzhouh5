package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.LuojiModels.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class LuojiEngineTest {
    private final LuojiEngine engine = new LuojiEngine();

    @Test
    void matchesTheReferenceCoinBacksGoldenCase() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "", "backs", "312101", null, null));

        assertThat(chart.overview().method()).isEqualTo("硬币背数法");
        assertThat(chart.overview().lunarDate()).isEqualTo("丙午年丙申月丁巳日辛亥时");
        assertThat(chart.overview().pillars()).isEqualTo(new Pillars("丙午", "丙申", "丁巳", "辛亥"));
        assertThat(chart.overview().voidBranches()).isEqualTo("子丑");
        assertThat(chart.original().name()).isEqualTo("火泽睽");
        assertThat(chart.original().palace()).isEqualTo(new Palace("艮宫", 5, null, "土"));
        assertThat(chart.original().shiLine()).isEqualTo(4);
        assertThat(chart.original().yingLine()).isEqualTo(1);
        assertThat(chart.changed().name()).isEqualTo("天水讼");
        assertThat(chart.changed().palace()).isEqualTo(new Palace("离宫", 7, "游魂", "火"));
        assertThat(chart.original().lines()).containsExactly("yang", "yin", "yang", "yin", "yang", "yang");
        assertThat(chart.changed().lines()).containsExactly("yang", "yang", "yang", "yin", "yang", "yin");
        assertThat(chart.lines()).extracting(Line::deity)
                .containsExactly("青龙", "玄武", "白虎", "螣蛇", "勾陈", "朱雀");
        assertThat(chart.lines()).extracting(Line::originalStemBranch)
                .containsExactly("己巳", "己未", "己酉", "丁丑", "丁卯", "丁巳");
        assertThat(chart.lines()).extracting(Line::originalKin)
                .containsExactly("父母", "兄弟", "子孙", "兄弟", "官鬼", "父母");
        assertThat(chart.lines()).extracting(Line::changedStemBranch)
                .containsExactly("壬戌", "壬申", "壬午", "戊午", "戊辰", "戊寅");
        assertThat(chart.lines()).extracting(Line::changedKin)
                .containsExactly("兄弟", "子孙", "父母", "父母", "兄弟", "官鬼");
        assertThat(chart.lines()).filteredOn(Line::isMoving).extracting(Line::position).containsExactly(5, 1);
        assertThat(chart.lines()).filteredOn(line -> line.hiddenKin() != null)
                .extracting(Line::position, Line::hiddenKin, Line::hiddenStemBranch)
                .containsExactly(org.assertj.core.groups.Tuple.tuple(5, "妻财", "丙子"));
        assertThat(chart.lines()).filteredOn(line -> line.marker() != null)
                .extracting(Line::position, Line::marker)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(4, "世"),
                        org.assertj.core.groups.Tuple.tuple(1, "应"));
    }

    @Test
    void supportsTheSameChartByNames() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "2026-08-11 21:31", "项目安排", "names", null, "火泽睽", "天水讼"));

        assertThat(chart.overview().method()).isEqualTo("盘名起盘法");
        assertThat(chart.overview().question()).isEqualTo("项目安排");
        assertThat(chart.overview().coinBacks()).isNull();
        assertThat(chart.original().name()).isEqualTo("火泽睽");
        assertThat(chart.changed().name()).isEqualTo("天水讼");
    }

    @Test
    void rejectsUnknownHexagramNames() {
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "2026-08-11 21:31", "", "names", null, "未知卦", "天水讼")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("本卦");
    }
}
