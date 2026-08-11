package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.JueceModels.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class ShijiaJueceEngineTest {
    private final ShijiaJueceEngine engine = new ShijiaJueceEngine(new DunjiaEngine());

    @Test
    void reproducesTheSixMigrationCasesAsNormalizedCharts() {
        List<ChartRequest> requests = List.of(
                request("2026-08-11 16:00", standard(), rotating("kun"), automatic("chai_bu"), "hour"),
                request("2026-02-04 10:30", trueSolar("110105"), rotating("yang_gen_yin_kun"), automatic("zhi_run"), "day"),
                request("2026-06-18 09:20", standard(), rotating("four_corners"), automatic("mao_shan"), "month"),
                request("2026-12-22 23:10", standard(), rotating("seasonal"), manual("yin", 5), "year"),
                request("2026-08-11 16:00", standard(), flying("yang_forward_yin_reverse"), automatic("chai_bu"), "hour"),
                request("2026-01-15 08:40", standard(), flying("all_forward"), automatic("zhi_run"), "day"));

        List<ChartResponse> charts = requests.stream().map(engine::chart).toList();
        assertThat(charts).allSatisfy(chart -> {
            assertThat(chart.palaces()).hasSize(9);
            assertThat(chart.palaces()).extracting(Palace::index).containsExactly(1, 2, 3, 4, 5, 6, 7, 8, 9);
            assertThat(chart.palaces()).filteredOn(Palace::isChief).hasSize(1);
            assertThat(chart.palaces()).filteredOn(Palace::isChiefDoor).hasSize(1);
            assertThat(chart.palaces()).filteredOn(Palace::isHorse).hasSize(1);
        });

        assertThat(charts).extracting(chart -> chart.overview().juNumber())
                .containsExactly(5, 8, 9, 7, 5, 5);
        assertThat(charts).extracting(chart -> chart.overview().dunType())
                .containsExactly("阴", "阳", "阳", "阳", "阴", "阳");
        assertThat(charts).extracting(chart -> chart.overview().xunShou())
                .containsExactly("甲辰壬", "甲子戊", "甲寅癸", "甲申庚", "甲辰壬", "甲子戊");
        assertThat(charts).extracting(chart -> chart.overview().chiefStar().name())
                .containsExactly("天蓬", "天任", "天芮", "天英", "天蓬", "天禽");
        assertThat(charts.subList(0, 4)).allSatisfy(chart -> {
            assertThat(chart.overview().bureauMethod()).isEqualTo("chai_bu");
            assertThat(chart.overview().centerPalaceMethod()).isEqualTo("kun");
            assertThat(chart.overview().selectedVoidBranches()).isEqualTo(chart.overview().voidBranches().hour());
            assertThat(chart.overview().method()).isEqualTo("转盘 · 寄坤宫 · 拆补 · 时空");
            assertThat(chart.heavenEarthGates()).hasSize(12);
            assertThat(chart.palaces()).filteredOn(palace -> palace.index() != 5)
                    .allSatisfy(palace -> {
                        assertThat(palace.heavenGrowth()).isNotEmpty();
                        assertThat(palace.earthGrowth()).isNotEmpty();
                    });
        });
        assertThat(charts.subList(4, 6)).allSatisfy(chart -> {
            assertThat(chart.heavenEarthGates()).isEmpty();
            assertThat(chart.palaces()).allSatisfy(palace -> {
                assertThat(palace.harms()).isEmpty();
                assertThat(palace.heavenGrowth()).isEmpty();
                assertThat(palace.earthGrowth()).isEmpty();
            });
        });
        assertThat(charts.get(1).overview().trueSolarTime()).isNotNull();
        assertThat(charts.get(1).overview().areaCode()).isEqualTo("110105");
        assertThat(charts.get(1).overview().effectiveDateTime()).isEqualTo("2026-02-04 10:30");
        assertThat(charts.get(1).overview().trueSolarTime()).isEqualTo("2026-02-04 10:01");
        assertThat(charts.get(4).overview().previousSolarTerm().dateTime()).isEqualTo("2026-08-07 19:42:32");
        assertThat(charts.get(5).overview().nextSolarTerm().dateTime()).isEqualTo("2026-01-20 09:44:46");
        assertThat(charts.get(4).palaces()).allSatisfy(palace -> assertThat(palace.hiddenGanZhi()).isNotBlank());
        assertThat(charts.get(0).palaces()).filteredOn(palace -> palace.index() != 5)
                .allSatisfy(palace -> assertThat(palace.hiddenGanZhi()).isNotBlank());
    }

    @Test
    void matchesRepresentativeLegacyPalacePositions() {
        ChartResponse rotating = engine.chart(request(
                "2026-08-11 16:00", standard(), rotating("kun"), automatic("chai_bu"), "hour"));
        Palace kun = rotating.palaces().get(1);
        assertThat(kun.heavenPlate()).isEqualTo(new PlateLayer("壬", "天蓬", "惊门", "值符"));
        assertThat(kun.earthPlate()).isEqualTo(new PlateLayer("辛", "天芮", "死门", null));
        assertThat(kun.attached()).isEqualTo(new Attached("戊", "天禽", null, null));
        assertThat(rotating.overview().chiefStar()).isEqualTo(new Chief("天蓬", 2));
        assertThat(rotating.overview().chiefDoor()).isEqualTo(new Chief("休门", 6));
        assertThat(rotating.overview().horse()).isEqualTo(new Horse("寅", 8));
        assertThat(kun.hiddenGanZhi()).isEqualTo("己");
        assertThat(rotating.palaces()).flatExtracting(Palace::harms).isNotEmpty();
        assertThat(rotating.heavenEarthGates()).extracting(HeavenEarthGate::branch)
                .containsExactly("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥");

        ChartResponse flying = engine.chart(request(
                "2026-08-11 16:00", standard(), flying("yang_forward_yin_reverse"), automatic("chai_bu"), "hour"));
        Palace center = flying.palaces().get(4);
        assertThat(center.hiddenGanZhi()).isEqualTo("己酉");
        assertThat(center.heavenPlate()).isEqualTo(new PlateLayer("壬", "天蓬", "死门", "值符"));
        assertThat(center.earthPlate()).isEqualTo(new PlateLayer("戊", null, null, "太常"));
    }

    @Test
    void rejectsInvalidDatesAndMutuallyExclusiveOptions() {
        assertThatThrownBy(() -> engine.chart(request(
                "2026-02-30 10:00", standard(), rotating("kun"), automatic("chai_bu"), "hour")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("日期");
        assertThatThrownBy(() -> engine.chart(request(
                "2026-08-11 16:00", new TimeOption("true_solar", "000000"), rotating("kun"), automatic("chai_bu"), "hour")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("地区码");
        assertThatThrownBy(() -> engine.chart(request(
                "2026-08-11 16:00", standard(), new PanOption("flying", "kun", "all_forward"), automatic("chai_bu"), "hour")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("寄宫");
        assertThatThrownBy(() -> engine.chart(request(
                "2026-08-11 16:00", standard(), rotating("kun"), manual("yin", 10), "hour")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1–9");
    }

    @Test
    void supportsEveryPanBureauVoidAndCenterCombination() {
        List<BureauOption> bureaus = List.of(
                automatic("chai_bu"),
                automatic("zhi_run"),
                automatic("mao_shan"),
                manual("yang", 1),
                manual("yin", 9));
        List<String> voidBases = List.of("hour", "day", "month", "year");

        Stream.of("kun", "yang_gen_yin_kun", "four_corners", "seasonal")
                .flatMap(center -> bureaus.stream().map(bureau -> new Object[] {center, bureau}))
                .flatMap(pair -> voidBases.stream().map(voidBasis -> new Object[] {pair[0], pair[1], voidBasis}))
                .map(parts -> request(
                        "2026-08-11 16:00",
                        standard(),
                        rotating((String) parts[0]),
                        (BureauOption) parts[1],
                        (String) parts[2]))
                .map(engine::chart)
                .forEach(chart -> {
                    assertThat(chart.palaces()).hasSize(9);
                    assertThat(chart.overview().method()).isEqualTo("转盘 · 寄坤宫 · 拆补 · 时空");
                });

        Stream.of("yang_forward_yin_reverse", "all_forward")
                .flatMap(rule -> bureaus.stream().map(bureau -> new Object[] {rule, bureau}))
                .flatMap(pair -> voidBases.stream().map(voidBasis -> new Object[] {pair[0], pair[1], voidBasis}))
                .map(parts -> request(
                        "2026-08-11 16:00",
                        standard(),
                        flying((String) parts[0]),
                        (BureauOption) parts[1],
                        (String) parts[2]))
                .map(engine::chart)
                .forEach(chart -> assertThat(chart.palaces()).hasSize(9));
    }

    private ChartRequest request(
            String dateTime,
            TimeOption time,
            PanOption pan,
            BureauOption bureau,
            String voidBasis) {
        return new ChartRequest(dateTime, time, pan, bureau, voidBasis);
    }

    private TimeOption standard() {
        return new TimeOption("standard", null);
    }

    private TimeOption trueSolar(String areaCode) {
        return new TimeOption("true_solar", areaCode);
    }

    private PanOption rotating(String centerMethod) {
        return new PanOption("rotating", centerMethod, null);
    }

    private PanOption flying(String directionRule) {
        return new PanOption("flying", null, directionRule);
    }

    private BureauOption automatic(String method) {
        return new BureauOption(method, null, null);
    }

    private BureauOption manual(String dunType, int number) {
        return new BureauOption("manual", dunType, number);
    }
}
