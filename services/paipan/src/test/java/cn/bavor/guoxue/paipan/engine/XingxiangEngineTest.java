package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.XingxiangModels.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class XingxiangEngineTest {
    private final XingxiangEngine engine = new XingxiangEngine();

    @Test
    void matchesTheFrozenReferenceGoldenCase() {
        ChartResponse chart = engine.chart(new ChartRequest(
                "测试", "male", "1990-01-01 12:00", "flying"));

        assertThat(chart.profile().lunarDate()).isEqualTo("一九八九年腊月初五日午时");
        assertThat(chart.profile().fiveElementsBureau()).isEqualTo("土五局");
        assertThat(chart.profile().yinYangGender()).isEqualTo("阴男");
        assertThat(chart.profile().pillars()).isEqualTo(new Pillars("己巳", "丙子", "丙寅", "甲午"));
        assertThat(chart.palaces()).hasSize(12);
        assertThat(chart.palaces()).extracting(Palace::branch)
                .containsExactly("寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑");
        assertThat(chart.palaces()).extracting(Palace::name)
                .containsExactly("疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄", "交友", "迁移");
        assertThat(palace(chart, "子").stars()).extracting(Star::name)
                .containsExactlyInAnyOrder("破军", "台辅", "天姚", "天魁");
        assertThat(palace(chart, "寅").stars()).extracting(Star::name)
                .containsExactlyInAnyOrder("紫微", "天府", "天月", "天福");
        assertThat(palace(chart, "辰").stars()).extracting(Star::name)
                .containsExactlyInAnyOrder("贪狼", "文昌", "铃星", "阴煞", "天喜");
        assertThat(palace(chart, "巳").originPalace()).isTrue();
        assertThat(palace(chart, "未").bodyPalace()).isTrue();
        assertThat(chart.palaces()).noneMatch(Palace::zodiacPalace);
        assertThat(palace(chart, "子").selfTransformations())
                .containsExactly(new SelfTransformation("忌", "廉贞", false));
        assertThat(palace(chart, "丑").selfTransformations())
                .containsExactly(new SelfTransformation("科", "天机", true));
        assertThat(palace(chart, "卯").selfTransformations())
                .containsExactly(
                        new SelfTransformation("禄", "太阴", true),
                        new SelfTransformation("权", "天同", false));

        assertThat(chart.periods()).hasSize(12);
        Period first = chart.periods().get(0);
        assertThat(first.ganZhi()).isEqualTo("辛未");
        assertThat(List.of(first.startAge(), first.endAge(), first.startYear(), first.endYear()))
                .containsExactly(5, 14, 1993, 2002);
        assertThat(first.palaceNames().get(0)).isEqualTo(new PalaceName("子", "交友"));
        assertThat(first.transformations()).containsExactly(
                new Transformation("禄", "巨门"),
                new Transformation("权", "太阳"),
                new Transformation("科", "文曲"),
                new Transformation("忌", "文昌"));
        assertThat(first.annuals()).hasSize(10);
        Annual annual = first.annuals().get(0);
        assertThat(annual).extracting(Annual::age, Annual::year, Annual::ganZhi)
                .containsExactly(5, 1993, "癸酉");
        assertThat(annual.transformations()).containsExactly(
                new Transformation("禄", "破军"),
                new Transformation("权", "巨门"),
                new Transformation("科", "太阴"),
                new Transformation("忌", "贪狼"));
    }

    @Test
    void rejectsImpossibleOrOutOfRangeDates() {
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "测试", "female", "2024-02-30 12:00", "flying")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无效");
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "测试", "female", "1899-12-01 12:00", "flying")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1900");
    }

    private Palace palace(ChartResponse chart, String branch) {
        return chart.palaces().stream()
                .filter(item -> item.branch().equals(branch))
                .findFirst()
                .orElseThrow();
    }
}
