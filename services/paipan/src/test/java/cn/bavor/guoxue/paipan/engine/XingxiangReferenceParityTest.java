package cn.bavor.guoxue.paipan.engine;

import static cn.bavor.guoxue.paipan.api.XingxiangModels.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class XingxiangReferenceParityTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final XingxiangEngine engine = new XingxiangEngine();

    static List<Arguments> cases() {
        return List.of(
                Arguments.of("case-01", "1990-01-01 12:00", "male"),
                Arguments.of("case-02", "2000-08-16 04:00", "female"),
                Arguments.of("case-03", "2024-02-10 23:30", "male"));
    }

    @ParameterizedTest(name = "{0} matches every frozen palace, star, period and annual")
    @MethodSource("cases")
    void matchesEveryFrozenBusinessField(String caseName, String dateTime, String gender) throws IOException {
        JsonNode data = JSON.readTree(Path.of("..", "..", "docs", "xingxiang-golden", caseName,
                "reference-response.redacted.json").toFile()).path("data");
        ChartResponse actual = engine.chart(new ChartRequest("测试", gender, dateTime, "flying"));
        JsonNode profile = data.path("mingZao");
        assertThat(actual.profile().solarDateTime()).isEqualTo(profile.path("completeDateTime").asText());
        assertThat(actual.profile().lunarDate()).isEqualTo(profile.path("completeLunarDateTime").asText());
        assertThat(actual.profile().yinYangGender()).isEqualTo(profile.path("sexNameString").asText());
        assertThat(actual.profile().fiveElementsBureau()).isEqualTo(profile.path("wuXingJu").asText());
        assertThat(actual.profile().pillars()).isEqualTo(new Pillars(
                profile.path("yearGanZhi").asText(), profile.path("monthGanZhi").asText(),
                profile.path("dayGanZhi").asText(), profile.path("hourGanZhi").asText()));

        Map<String, Palace> actualPalaces = new LinkedHashMap<>();
        actual.palaces().forEach(palace -> actualPalaces.put(palace.branch(), palace));
        assertThat(data.path("feiXinGong")).hasSize(12);
        for (JsonNode expected : data.path("feiXinGong")) {
            String branch = expected.path("gongDiZhi").asText();
            Palace palace = actualPalaces.get(branch);
            assertThat(palace).as(caseName + " " + branch + "宫").isNotNull();
            assertThat(palace.name()).isEqualTo(expected.path("gongName").asText());
            assertThat(palace.heavenlyStem()).isEqualTo(expected.path("gongTianGan").asText());
            assertThat(palace.bodyPalace()).isEqualTo(expected.path("isShenGong").asBoolean());
            assertThat(palace.zodiacPalace()).isEqualTo(expected.path("isShengXiaoGong").asBoolean());
            assertThat(palace.originPalace()).isEqualTo(expected.path("isLaiYinGong").asBoolean());
            assertThat(normalizeActualStars(palace.stars())).as(caseName + " " + branch + "宫星曜")
                    .containsExactlyElementsOf(normalizeReferenceStars(expected.path("starsList")));
            assertThat(normalizeActualSelf(palace.selfTransformations())).as(caseName + " " + branch + "宫自化")
                    .containsExactlyElementsOf(normalizeReferenceSelf(expected.path("gongZiHuaList")));
        }

        assertThat(actual.periods()).hasSize(12);
        for (int index = 0; index < 12; index++) {
            Period period = actual.periods().get(index);
            JsonNode expected = data.path("daxian").get(index);
            assertThat(period.ganZhi()).isEqualTo(expected.path("ganzhi").asText());
            assertThat(period.startAge() + "-" + period.endAge()).isEqualTo(expected.path("yearRange").asText());
            assertThat(period.startYear()).isEqualTo(expected.path("yearStart").asInt());
            assertThat(normalizeActualNames(period.palaceNames())).containsExactlyElementsOf(normalizeReferenceNames(expected.path("gongweiNames")));
            assertThat(normalizeActualTransforms(period.transformations())).containsExactlyElementsOf(normalizeReferenceTransforms(expected.path("feixinStarList")));
            assertThat(period.annuals()).hasSize(10);
            for (int annualIndex = 0; annualIndex < 10; annualIndex++) {
                Annual annual = period.annuals().get(annualIndex);
                JsonNode expectedAnnual = expected.path("ziWeiLiuNian").get(annualIndex);
                assertThat(List.of(annual.age(), annual.year(), annual.ganZhi()))
                        .containsExactly(expectedAnnual.path("age").asInt(), expectedAnnual.path("year").asInt(), expectedAnnual.path("ganZhi").asText());
                assertThat(normalizeActualNames(annual.palaceNames())).containsExactlyElementsOf(normalizeReferenceNames(expectedAnnual.path("gongweiNames")));
                assertThat(normalizeActualTransforms(annual.transformations())).containsExactlyElementsOf(normalizeReferenceTransforms(expectedAnnual.path("ziHuaStar")));
            }
        }
    }

    private List<String> normalizeActualStars(List<Star> stars) {
        return stars.stream().map(star -> star.name() + "|" + star.brightness() + "|" + nullText(star.natalTransformation()))
                .sorted().toList();
    }

    private List<String> normalizeReferenceStars(JsonNode stars) {
        return StreamSupport.stream(stars.spliterator(), false)
                .map(star -> star.path("starName").asText() + "|" + star.path("lightLevel").asText("") + "|" + star.path("siHuaXing").asText(""))
                .sorted().toList();
    }

    private List<String> normalizeActualSelf(List<SelfTransformation> items) {
        return items.stream().map(item -> item.transformation() + "|" + item.star() + "|" + item.inward()).sorted().toList();
    }

    private List<String> normalizeReferenceSelf(JsonNode items) {
        return StreamSupport.stream(items.spliterator(), false)
                .map(item -> item.path("zihuaName").asText() + "|" + item.path("ziHuaXing").asText() + "|" + item.path("benGong").asBoolean())
                .sorted().toList();
    }

    private List<String> normalizeActualNames(List<PalaceName> names) {
        return names.stream().map(item -> item.branch() + "|" + item.name()).sorted().toList();
    }

    private List<String> normalizeReferenceNames(JsonNode names) {
        List<String> result = new ArrayList<>();
        for (JsonNode item : names) item.fields().forEachRemaining(field -> result.add(field.getKey() + "|" + field.getValue().asText()));
        return result.stream().sorted().toList();
    }

    private List<String> normalizeActualTransforms(List<Transformation> items) {
        return items.stream().map(item -> item.transformation() + "|" + item.star()).sorted().toList();
    }

    private List<String> normalizeReferenceTransforms(JsonNode items) {
        return StreamSupport.stream(items.spliterator(), false)
                .map(item -> item.path("siHuaXing").asText() + "|" + item.path("starName").asText())
                .sorted(Comparator.naturalOrder()).toList();
    }

    private String nullText(String value) {
        return value == null ? "" : value;
    }
}
