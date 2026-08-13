package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.XuankongFeixingModels.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sunland.app.utils.xuanKongFeiXing.XuanKongFeiXingUtil;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

class XuankongFeixingReferenceParityTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final XuankongFeixingEngine engine = new XuankongFeixingEngine();

    @ParameterizedTest
    @ValueSource(strings = {"case-01", "case-02", "case-03"})
    void matchesEveryFrozenFlyingStar(String caseName) throws IOException {
        Path root = Path.of("..", "..", "docs", "xuankong-feixing-golden", caseName);
        JsonNode request = JSON.readTree(root.resolve("reference-request.json").toFile());
        JsonNode expected = JSON.readTree(root.resolve("expected-summary.json").toFile());
        ChartResponse actual = engine.chart(new ChartRequest(
                request.path("paipanTime").asText(), request.path("daYun").asInt(),
                request.path("shanXiang").asText(), request.path("type").asInt() == 1 ? "replacement" : "base",
                request.path("remark").asText()));

        assertThat(actual.overview().lunarDate()).isEqualTo(expected.path("yearNongLi").asText());
        if (expected.has("mode")) assertThat(actual.overview().methodLabel()).isEqualTo(expected.path("mode").asText());
        if (expected.has("direction")) {
            assertThat(actual.directions()).containsExactlyElementsOf(
                    JSON.convertValue(expected.path("direction"), JSON.getTypeFactory().constructCollectionType(List.class, String.class)));
        }
        for (JsonNode expectedPalace : expected.path("palaces")) {
            Palace actualPalace = actual.palaces().stream()
                    .filter(item -> item.index() == expectedPalace.path("index").asInt()).findFirst().orElseThrow();
            assertOptionalText(expectedPalace, "trigram", actualPalace.trigram());
            assertOptionalText(expectedPalace, "direction", actualPalace.direction());
            assertOptionalText(expectedPalace, "element", actualPalace.element());
            assertOptionalText(expectedPalace, "star", actualPalace.star());
            assertOptionalNumber(expectedPalace, "yun", actualPalace.fortuneStar());
            assertOptionalNumber(expectedPalace, "mountain", actualPalace.mountainStar());
            assertOptionalNumber(expectedPalace, "facing", actualPalace.facingStar());
            assertOptionalNumber(expectedPalace, "year", actualPalace.annualStar());
            assertOptionalNumber(expectedPalace, "month", actualPalace.monthlyStar());
            assertOptionalNumber(expectedPalace, "day", actualPalace.dailyStar());
            assertOptionalNumber(expectedPalace, "hour", actualPalace.hourlyStar());
            assertOptionalText(expectedPalace, "mountainPosition", actualPalace.mountainPosition());
            assertOptionalText(expectedPalace, "facingPosition", actualPalace.facingPosition());
        }
    }

    @Test
    void supportsAllTwentyFourOrientationsNinePeriodsAndBothMethods() {
        for (String orientation : XuanKongFeiXingUtil.shanXiang24) {
            for (String method : List.of("base", "replacement")) {
                for (int fortunePeriod = 1; fortunePeriod <= 9; fortunePeriod++) {
                    ChartResponse actual = engine.chart(new ChartRequest(
                            "2026-08-13 12:00", fortunePeriod, orientation, method, "全量校验"));
                    assertThat(actual.palaces()).as(orientation + " " + method + " " + fortunePeriod + "运").hasSize(9);
                    assertThat(actual.directions()).as(orientation + " " + method + " " + fortunePeriod + "运").hasSize(8);
                    assertThat(actual.palaces()).allSatisfy(palace -> {
                        assertThat(palace.fortuneStar()).isBetween(1, 9);
                        assertThat(palace.mountainStar()).isBetween(1, 9);
                        assertThat(palace.facingStar()).isBetween(1, 9);
                    });
                }
            }
        }
    }

    private void assertOptionalNumber(JsonNode expected, String field, int actual) {
        if (expected.has(field)) assertThat(actual).as(field).isEqualTo(expected.path(field).asInt());
    }

    private void assertOptionalText(JsonNode expected, String field, String actual) {
        if (expected.has(field)) assertThat(actual).as(field).isEqualTo(expected.path(field).asText());
    }
}
