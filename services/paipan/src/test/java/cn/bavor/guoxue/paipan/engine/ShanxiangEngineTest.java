package cn.bavor.guoxue.paipan.engine;

import static org.assertj.core.api.Assertions.assertThat;

import cn.bavor.guoxue.paipan.api.ShanxiangModels.ChartRequest;
import org.junit.jupiter.api.Test;

class ShanxiangEngineTest {
    private final ShanxiangEngine engine = new ShanxiangEngine();

    @Test
    void matchesReferenceFor2026NorthSector() {
        var result = engine.chart(new ChartRequest(2026, 0d, "书房坐向"));

        assertThat(result.overview().question()).isEqualTo("书房坐向");
        assertThat(result.panels()).hasSize(3);
        var first = result.panels().get(0);
        assertThat(first.overview().degrees()).isZero();
        assertThat(first.overview().direction()).isEqualTo("癸");
        assertThat(first.overview().mountain()).isEqualTo("丁");
        assertThat(first.overview().degreeRange()).isEqualTo("0~4");
        assertThat(first.overview().dunType()).isEqualTo("阴");
        assertThat(first.overview().juNumber()).isEqualTo(7);
        assertThat(first.overview().yearPillar()).isEqualTo("丙午");
        assertThat(first.overview().hourPillar()).isEqualTo("己丑");
        assertThat(first.overview().xunShou()).isEqualTo("甲申庚");
        assertThat(first.overview().voidBranches()).isEqualTo("午未");
        assertThat(first.overview().chiefStar().name()).isEqualTo("天芮星");
        assertThat(first.overview().chiefStar().palace()).isEqualTo(6);
        assertThat(first.overview().chiefDoor().name()).isEqualTo("死");
        assertThat(first.overview().chiefDoor().palace()).isEqualTo(9);
        assertThat(first.overview().horse().branch()).isEqualTo("亥");
        assertThat(first.overview().horse().palace()).isEqualTo(6);
        assertThat(first.overview().huangQuan()).isEqualTo("黄泉亥");
        assertThat(first.palaces()).hasSize(9);
        assertThat(first.palaces().get(0).door()).isEqualTo("生");
        assertThat(first.palaces().get(0).heavenStems()).containsExactly("戊");
        assertThat(result.panels()).extracting(panel -> panel.overview().degrees())
                .containsExactly(0d, 5d, 10d);
        assertThat(result.panels()).extracting(panel -> panel.overview().degreeRange())
                .containsExactly("0~4", "5~9", "10~14");
        assertThat(result.panels()).extracting(panel -> panel.overview().juNumber())
                .containsExactly(7, 1, 4);
        assertThat(result.panels()).extracting(panel -> panel.overview().chiefStar().name())
                .containsExactly("天芮星", "天任星", "天芮星");
        assertThat(result.panels()).extracting(panel -> panel.overview().chiefDoor().palace())
                .containsExactly(9, 3, 6);
    }

    @Test
    void putsSelectedFiveDegreeSubsectorFirstAndNormalizes360() {
        assertThat(engine.chart(new ChartRequest(2026, 7d, "")).panels())
                .extracting(panel -> panel.overview().degrees())
                .containsExactly(5d, 0d, 10d);
        assertThat(engine.chart(new ChartRequest(2026, 360d, "")).panels().get(0).overview().degrees())
                .isZero();
    }
}
