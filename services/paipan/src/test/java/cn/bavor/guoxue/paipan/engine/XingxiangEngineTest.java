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
                "测试", "male", "1990-01-01 12:00", "110101", false, "flying"));

        assertThat(chart.profile().lunarDate()).isEqualTo("一九八九年腊月初五日午时");
        assertThat(chart.profile().fiveElementsBureau()).isEqualTo("土五局");
        assertThat(chart.profile().yinYangGender()).isEqualTo("阴男");
        assertThat(chart.profile().area()).isEqualTo("北京市东城");
        assertThat(chart.profile().trueSolarTime()).isNull();
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
                .containsExactly(new SelfTransformation("忌", "廉贞", false, "inward", "午"));
        assertThat(palace(chart, "丑").selfTransformations())
                .containsExactly(new SelfTransformation("科", "天机", true, "outward", "丑"));
        assertThat(palace(chart, "卯").selfTransformations())
                .containsExactly(
                        new SelfTransformation("禄", "太阴", true, "outward", "卯"),
                        new SelfTransformation("权", "天同", false, "inward", "酉"));

        assertThat(chart.periods()).hasSize(12);
        Period first = chart.periods().get(0);
        assertThat(first.ganZhi()).isEqualTo("辛未");
        assertThat(List.of(first.startAge(), first.endAge(), first.startYear(), first.endYear()))
                .containsExactly(5, 14, 1993, 2002);
        assertThat(first.palaceNames().get(0)).isEqualTo(new PalaceName("子", "交友"));
        assertThat(first.transformations()).containsExactly(
                new Transformation("禄", "巨门", "巳"),
                new Transformation("权", "太阳", "亥"),
                new Transformation("科", "文曲", "戌"),
                new Transformation("忌", "文昌", "辰"));
        assertThat(first.annuals()).hasSize(10);
        Annual annual = first.annuals().get(0);
        assertThat(annual).extracting(Annual::age, Annual::year, Annual::ganZhi)
                .containsExactly(5, 1993, "癸酉");
        assertThat(annual.transformations()).containsExactly(
                new Transformation("禄", "破军", "子"),
                new Transformation("权", "巨门", "巳"),
                new Transformation("科", "太阴", "卯"),
                new Transformation("忌", "贪狼", "辰"));
        assertThat(annual.months()).containsExactly(
                new FlowMonth(1, "正月", "甲寅", "辰"),
                new FlowMonth(2, "二月", "乙卯", "巳"),
                new FlowMonth(3, "三月", "丙辰", "午"),
                new FlowMonth(4, "四月", "丁巳", "未"),
                new FlowMonth(5, "五月", "戊午", "申"),
                new FlowMonth(6, "六月", "己未", "酉"),
                new FlowMonth(7, "七月", "庚申", "戌"),
                new FlowMonth(8, "八月", "辛酉", "亥"),
                new FlowMonth(9, "九月", "壬戌", "子"),
                new FlowMonth(10, "十月", "癸亥", "丑"),
                new FlowMonth(11, "冬月", "甲子", "寅"),
                new FlowMonth(12, "腊月", "乙丑", "卯"));
    }

    @Test
    void appliesTrueSolarTimeBeforeTheLateRatHourRule() {
        ChartResponse corrected = engine.chart(new ChartRequest(
                "测试", "male", "1990-01-01 01:30", "650100", true, "flying"));
        ChartResponse effectiveStandard = engine.chart(new ChartRequest(
                "测试", "male", "1989-12-31 23:17", "650100", false, "flying"));

        assertThat(corrected.profile().solarDateTime()).isEqualTo("1990-01-01 01:30");
        assertThat(corrected.profile().trueSolarTime()).isEqualTo("1989-12-31 23:17");
        assertThat(corrected.profile().area()).isEqualTo("新疆维吾尔自治区乌鲁木齐市");
        assertThat(corrected.profile().lunarDate()).isEqualTo(effectiveStandard.profile().lunarDate());
        assertThat(corrected.profile().pillars()).isEqualTo(effectiveStandard.profile().pillars());
        assertThat(corrected.palaces()).isEqualTo(effectiveStandard.palaces());
        assertThat(corrected.periods()).isEqualTo(effectiveStandard.periods());
    }

    @Test
    void rejectsImpossibleOrOutOfRangeDates() {
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "测试", "female", "2024-02-30 12:00", "110101", false, "flying")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("无效");
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "测试", "female", "1899-12-01 12:00", "110101", false, "flying")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1900");
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "测试", "female", "1990-01-01 12:00", "000000", true, "flying")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("地区无效");
        assertThatThrownBy(() -> engine.chart(new ChartRequest(
                "测试", "female", "1990-01-01 12:00", "999999", true, "flying")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("具体的国内");
    }

    private Palace palace(ChartResponse chart, String branch) {
        return chart.palaces().stream()
                .filter(item -> item.branch().equals(branch))
                .findFirst()
                .orElseThrow();
    }
}
