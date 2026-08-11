package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.BaziModels.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class BaziEngineTest {
    private final BaziEngine engine = new BaziEngine();

    @Test
    void calculatesACompleteChartFromTheFrozenLegacyBaseline() {
        ChartResponse chart = engine.chart(
                new ChartRequest("", "male", "1990-01-01 12:30", "110101", false));

        assertThat(chart.profile().name()).isEmpty();
        assertThat(chart.profile().lunarDate()).isEqualTo("一九八九年腊月初五日午时");
        assertThat(chart.profile().area()).isEqualTo("北京市东城");
        assertThat(chart.pillars()).extracting(pillar -> pillar.stem() + pillar.branch())
                .containsExactly("己巳", "丙子", "丙寅", "甲午");
        assertThat(chart.pillars().get(0).hiddenStems())
                .extracting(HiddenStem::stem, HiddenStem::element, HiddenStem::tenGod)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("丙", "火", "比肩"),
                        org.assertj.core.groups.Tuple.tuple("庚", "金", "偏财"),
                        org.assertj.core.groups.Tuple.tuple("戊", "土", "食神"));
        assertThat(chart.attention().heavenlyStems()).containsExactly("甲己合土");
        assertThat(chart.fortune().startSolar()).isEqualTo("1998-05-01 12:30:00");
        assertThat(chart.fortune().periods().get(1).ganZhi()).isEqualTo("乙亥");
        assertThat(chart.fortune().periods().get(1).years().get(0).ganZhi()).isEqualTo("戊寅");
        assertThat(chart.strength().legacyScore()).isEqualTo(52);
        assertThat(chart.strength().samePartyScore()).isEqualTo(350);
        assertThat(chart.strength().otherPartyScore()).isEqualTo(260);
        assertThat(chart.strength().level()).isEqualTo("日主偏旺，身强");
        assertThat(chart.strength().favorableElements()).containsExactly("土", "金", "水");
        assertThat(chart.strength().relationScores()).containsExactlyInAnyOrderEntriesOf(
                Map.of("食伤", 90, "印枭", 110, "财才", 20, "官杀", 150, "劫比", 240));
    }

    @Test
    void keepsTheLegacyLateZiDayBoundaryAndFemaleDayLabel() {
        ChartResponse chart = engine.chart(
                new ChartRequest("", "female", "1990-01-01 23:30", "110101", false));

        assertThat(chart.profile().lunarDate()).isEqualTo("一九八九年腊月初六日子时");
        assertThat(chart.pillars()).extracting(pillar -> pillar.stem() + pillar.branch())
                .containsExactly("己巳", "丙子", "丁卯", "庚子");
        assertThat(chart.pillars().get(2).tenGod()).isEqualTo("元女");
    }

    @Test
    void appliesTrueSolarTimeAcrossThePreviousDayAndHourBoundary() {
        ChartResponse chart = engine.chart(
                new ChartRequest("", "male", "1990-01-01 01:30", "650100", true));

        assertThat(chart.profile().trueSolarTime()).isEqualTo("1989-12-31 23:17");
        assertThat(chart.profile().area()).isEqualTo("新疆维吾尔自治区乌鲁木齐市");
        assertThat(chart.pillars().get(3).stem() + chart.pillars().get(3).branch()).isEqualTo("戊子");
    }

    @Test
    void changesYearAndMonthPillarsAtTheLichunBoundary() {
        ChartResponse before = engine.chart(
                new ChartRequest("", "male", "2024-02-04 16:20", "110101", false));
        ChartResponse after = engine.chart(
                new ChartRequest("", "male", "2024-02-04 16:40", "110101", false));

        assertThat(before.pillars()).extracting(pillar -> pillar.stem() + pillar.branch())
                .containsExactly("癸卯", "乙丑", "戊戌", "庚申");
        assertThat(after.pillars()).extracting(pillar -> pillar.stem() + pillar.branch())
                .containsExactly("甲辰", "丙寅", "戊戌", "庚申");
        assertThat(before.basicFacts().nextSolarTerm()).isEqualTo("2024-02-04 16:27:05 立春");
    }

    @Test
    void resolvesSolarLunarLeapMonthAndFourPillarsWithSectTwo() {
        ResolveBirthResponse solar = engine.resolveBirth(
                new ResolveBirthRequest("solar", "1990-01-01 12:30", null, null));
        ResolveBirthResponse leapMonth = engine.resolveBirth(
                new ResolveBirthRequest("lunar", null, new LunarBirth(2020, 4, 1, 12, 30, true), null));
        ResolveBirthResponse pillars = engine.resolveBirth(
                new ResolveBirthRequest("fourPillars", null, null, new FourPillars("庚午", "戊子", "丁卯", "庚子")));
        ResolveBirthResponse multipleCandidates = engine.resolveBirth(
                new ResolveBirthRequest("fourPillars", null, null, new FourPillars("己亥", "丙子", "己卯", "甲子")));

        assertThat(solar.candidates()).extracting(BirthCandidate::solarDateTime)
                .containsExactly("1990-01-01 12:30");
        assertThat(leapMonth.candidates()).extracting(BirthCandidate::solarDateTime)
                .containsExactly("2020-05-23 12:30");
        assertThat(pillars.sect()).isEqualTo(2);
        assertThat(pillars.candidates()).extracting(BirthCandidate::solarDateTime)
                .containsExactly("1990-12-28 00:00");
        assertThat(multipleCandidates.candidates()).extracting(BirthCandidate::solarDateTime)
                .containsExactly("1959-12-23 00:00", "2019-12-08 00:00");
    }

    @Test
    void exposesMunicipalityOrdinaryCityAndOtherAreaShapes() {
        List<AreaNode> areas = engine.areas();

        assertThat(areas).hasSize(35);
        assertThat(areas.stream().filter(area -> area.label().equals("其他地区")).findFirst().orElseThrow().code())
                .isEqualTo("999999");
        assertThat(areas.stream().filter(area -> area.label().equals("北京市")).findFirst().orElseThrow().children())
                .anyMatch(area -> area.label().equals("东城") && area.code().equals("110101"));
        assertThat(areas).anyMatch(area -> area.children().stream().anyMatch(city -> !city.children().isEmpty()));
    }

    @Test
    void returnsTwelveFlowMonthsForASelectedFortuneYear() {
        ChartRequest chart = new ChartRequest("", "male", "1990-01-01 12:30", "110101", false);
        FlowMonthsResponse response = engine.flowMonths(new FlowMonthsRequest(chart, 1998));

        assertThat(response.months()).hasSize(12);
        assertThat(response.months().get(0).index()).isEqualTo(1);
        assertThat(response.months().get(0).ganZhi()).isEqualTo("甲寅");
        assertThat(response.months().get(0).solarTermName()).isEqualTo("立春");
    }
}
