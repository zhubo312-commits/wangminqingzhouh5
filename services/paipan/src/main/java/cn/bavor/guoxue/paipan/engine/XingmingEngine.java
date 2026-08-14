package cn.bavor.guoxue.paipan.engine;

import cn.bavor.guoxue.paipan.api.XingmingModels;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class XingmingEngine {
    private static final Map<String, Integer> TIAN_SCORES = Map.of("大凶", 10, "凶", 30, "半吉", 50, "吉", 70, "大吉", 90);
    private static final Map<String, Integer> DI_SCORES = Map.of("大凶", 12, "凶", 32, "半吉", 52, "吉", 72, "大吉", 92);
    private static final Map<String, Integer> REN_SCORES = TIAN_SCORES;
    private static final Map<String, Integer> SANCAI_SCORES = Map.of("大凶", 15, "凶", 35, "半吉", 55, "吉", 75, "大吉", 95);
    private static final Map<Integer, String> LIUGE_RATINGS = createLiugeRatings();
    private static final Pattern SECTION = Pattern.compile("(?:^|[\\n\\r])\\s*(基业|家庭|健康|含义)[：:]\\s*(.*?)(?=(?:[\\n\\r]\\s*(?:基业|家庭|健康|含义)[：:])|$)", Pattern.DOTALL);
    private static final Map<String, String> GENERATES = Map.of("木", "火", "火", "土", "土", "金", "金", "水", "水", "木");
    private static final Map<String, String> CONTROLS = Map.of("木", "土", "土", "水", "水", "火", "火", "金", "金", "木");
    private final XingmingRepository repository;
    private final String datasetStatus;
    private final String datasetVersion;
    private final String dictionaryVersion;
    private final String numerologyVersion;

    public XingmingEngine(
            XingmingRepository repository,
            @Value("${xingming.dataset.status:provisional}") String datasetStatus,
            @Value("${xingming.dataset.version:provisional-unknown}") String datasetVersion,
            @Value("${xingming.dataset.dictionary-version:unknown}") String dictionaryVersion,
            @Value("${xingming.dataset.numerology-version:unknown}") String numerologyVersion) {
        this.repository = repository;
        this.datasetStatus = datasetStatus;
        this.datasetVersion = datasetVersion;
        this.dictionaryVersion = dictionaryVersion;
        this.numerologyVersion = numerologyVersion;
    }

    public XingmingModels.ChartResponse chart(XingmingModels.ChartRequest request) {
        String surnameInput = request.surname().trim();
        String givenNameInput = request.givenName().trim();
        if ("liuge".equals(request.school()) && givenNameInput.codePointCount(0, givenNameInput.length()) > 2) {
            throw XingmingDataException.unavailable("givenName", "六格仅支持一字名或两字名");
        }
        List<ResolvedCharacter> surnameRows = resolveCharacters(surnameInput, "surname");
        List<ResolvedCharacter> givenRows = resolveCharacters(givenNameInput, "givenName");
        String surname = joinTraditional(surnameRows);
        String givenName = joinTraditional(givenRows);
        int[] surnameStrokes = surnameRows.stream().mapToInt(row -> row.row().strokes()).toArray();
        int[] givenStrokes = givenRows.stream().mapToInt(row -> row.row().strokes()).toArray();

        LinkedHashMap<String, Integer> gridNumbers = "wuge".equals(request.school()) ? wuge(surnameStrokes, givenStrokes) : liuge(surnameStrokes, givenStrokes);
        Map<Integer, XingmingRepository.NumberRow> numbers = requireNumbers(gridNumbers.values());
        int heaven = gridNumbers.get("heaven");
        int person = gridNumbers.get("person");
        int earth = gridNumbers.get("earth");
        XingmingRepository.SanCaiRow sanCai = requireSanCai(element(heaven) + element(person) + element(earth));

        List<XingmingModels.Grid> grids = gridNumbers.entrySet().stream().map(entry -> {
            int interpretationNumber = normalizeNumber(entry.getValue());
            XingmingRepository.NumberRow number = numbers.get(interpretationNumber);
            String rating = "liuge".equals(request.school()) ? LIUGE_RATINGS.get(interpretationNumber) : number.rating();
            return new XingmingModels.Grid(entry.getKey(), label(entry.getKey()), entry.getValue(), interpretationNumber,
                    element(entry.getValue()), rating, interpretation(number));
        }).toList();

        String sanCaiRating = "liuge".equals(request.school()) && hasText(sanCai.liugeRating()) ? sanCai.liugeRating() : sanCai.rating();
        List<XingmingModels.ScoreComponent> components = scoreComponents(
                numbers.get(normalizeNumber(heaven)).rating(), numbers.get(normalizeNumber(earth)).rating(),
                numbers.get(normalizeNumber(person)).rating(), sanCai.rating());
        int score = components.stream().mapToInt(XingmingModels.ScoreComponent::contribution).sum();
        XingmingRepository.NumberRow total = numbers.get(normalizeNumber(gridNumbers.get("total")));

        List<XingmingModels.CharacterDetail> characterDetails = new ArrayList<>();
        surnameRows.forEach(row -> characterDetails.add(toCharacter(row)));
        givenRows.forEach(row -> characterDetails.add(toCharacter(row)));
        XingmingModels.ThreeTalents threeTalents = new XingmingModels.ThreeTalents(
                sanCai.title(), sanCaiRating,
                "liuge".equals(request.school()) && hasText(sanCai.liugeSummary()) ? sanCai.liugeSummary() : nullableText(sanCai.content()),
                nullableText(sanCai.foundationLuck()), nullableText(sanCai.foundationRating()),
                nullableText(sanCai.successLuck()), nullableText(sanCai.successRating()),
                nullableText(sanCai.relationships()), nullableText(sanCai.relationshipsRating()),
                nullableText(sanCai.personality()), nullableText(sanCai.liugeSummary()), nullableText(sanCai.liugeRating()));

        return new XingmingModels.ChartResponse(
                new XingmingModels.Dataset(datasetStatus, datasetVersion, dictionaryVersion, numerologyVersion),
                request.school(), new XingmingModels.NormalizedName(surname, givenName, surname + givenName),
                characterDetails, grids, threeTalents,
                List.of(relation("天格", element(heaven), "人格", element(person)), relation("人格", element(person), "地格", element(earth))),
                score, new XingmingModels.ScoreBreakdown(components, score, "总分由天格20%、地格20%、人格20%和三才40%加权得出，仅作传统姓名学参考。"),
                interpretation(total));
    }

    private List<ResolvedCharacter> resolveCharacters(String value, String field) {
        List<ResolvedCharacter> rows = new ArrayList<>();
        for (String character : value.codePoints().mapToObj(codePoint -> new String(Character.toChars(codePoint))).toList()) {
            XingmingRepository.CharacterRow row = repository.findCharacter(character).orElseThrow(() ->
                    XingmingDataException.unavailable(field, "正式康熙字库尚未收录“" + character + "”字，请更换用字后重试"));
            rows.add(new ResolvedCharacter(character, row));
        }
        return rows;
    }

    private Map<Integer, XingmingRepository.NumberRow> requireNumbers(Iterable<Integer> values) {
        Map<Integer, XingmingRepository.NumberRow> rows = new LinkedHashMap<>();
        for (Integer raw : values) {
            int value = normalizeNumber(raw);
            rows.computeIfAbsent(value, number -> repository.findNumber(number).orElseThrow(() -> missingStaticData("yp_81 缺少数理 " + number)));
        }
        return rows;
    }

    private XingmingRepository.SanCaiRow requireSanCai(String title) {
        return repository.findSanCai(title).orElseThrow(() -> missingStaticData("yp_sancai 缺少三才组合 " + title));
    }

    private XingmingDataException missingStaticData(String message) {
        return "official".equals(datasetStatus) ? XingmingDataException.integrity(message) : XingmingDataException.unavailable("name", "临时数据尚未覆盖此姓名组合");
    }

    private static int normalizeNumber(int value) { return ((value - 1) % 81) + 1; }

    private static XingmingModels.NumberInterpretation interpretation(XingmingRepository.NumberRow row) {
        Map<String, String> sections = parseSections(row.detail());
        return new XingmingModels.NumberInterpretation(row.number(), row.number() % 2 == 0 ? "阴" : "阳", row.rating(),
                nullableText(row.poem()), nullableText(row.categories()), sections.get("基业"), sections.get("家庭"), sections.get("健康"),
                sections.get("含义"), nullableText(row.detail()));
    }

    private static Map<String, String> parseSections(String text) {
        Map<String, String> values = new LinkedHashMap<>();
        if (!hasText(text)) return values;
        Matcher matcher = SECTION.matcher(text);
        while (matcher.find()) values.put(matcher.group(1), matcher.group(2).trim());
        return values;
    }

    private static XingmingModels.CharacterDetail toCharacter(ResolvedCharacter resolved) {
        XingmingRepository.CharacterRow row = resolved.row();
        int kangxi = parseStrokes(row.kangxiStrokes(), row.strokes());
        XingmingModels.UsageReference usage = new XingmingModels.UsageReference(
                row.recommendationPercent(), row.culturePercent(), row.genderTendency(), row.usageCount(),
                row.firstCharacterPercent(), row.malePercent(), row.femalePercent(),
                "来源站统计，仅作用字参考，不参与姓名学评分。");
        return new XingmingModels.CharacterDetail(resolved.input(), row.simplified(), row.traditional(),
                hasText(row.fullPinyin()) ? row.fullPinyin() : row.pinyin(), nullableText(row.radical()), kangxi,
                row.strokes(), row.element(), nullableText(row.rating()), row.common(), nullableText(row.nameUsageClass()),
                nullableText(row.nameExplanation()), nullableText(row.namingMeaning()), nullableText(row.namingImplication()),
                nullableText(row.taboosText()), usage);
    }

    private static int parseStrokes(String value, int fallback) {
        try { return Integer.parseInt(value); } catch (RuntimeException ignored) { return fallback; }
    }

    private static List<XingmingModels.ScoreComponent> scoreComponents(String heaven, String earth, String person, String sanCai) {
        return List.of(component("heaven", "天格", 20, TIAN_SCORES.getOrDefault(heaven, 0)),
                component("earth", "地格", 20, DI_SCORES.getOrDefault(earth, 0)),
                component("person", "人格", 20, REN_SCORES.getOrDefault(person, 0)),
                component("threeTalents", "三才", 40, SANCAI_SCORES.getOrDefault(sanCai, 0)));
    }

    private static XingmingModels.ScoreComponent component(String key, String label, int weight, int raw) {
        return new XingmingModels.ScoreComponent(key, label, weight, raw, (int) Math.round(raw * weight / 100.0));
    }

    private static XingmingModels.ElementRelation relation(String fromLabel, String from, String toLabel, String to) {
        String relation;
        if (from.equals(to)) relation = "比和";
        else if (to.equals(GENERATES.get(from))) relation = "相生";
        else if (from.equals(GENERATES.get(to))) relation = "受生";
        else if (to.equals(CONTROLS.get(from))) relation = "相克";
        else relation = "受克";
        return new XingmingModels.ElementRelation(fromLabel, toLabel, relation, fromLabel + from + " → " + toLabel + to + "：" + relation);
    }

    private static LinkedHashMap<String, Integer> wuge(int[] surname, int[] given) {
        LinkedHashMap<String, Integer> values = new LinkedHashMap<>();
        int totalLength = surname.length + given.length;
        int heaven = surname.length == 1 ? (totalLength == 4 ? surname[0] + given[0] : surname[0] + 1) : sum(surname);
        int person = surname.length == 1 ? (totalLength == 4 ? given[0] + given[1] : surname[0] + given[0]) : surname[surname.length - 1] + given[0];
        int earth = given.length > 1 ? given[given.length - 2] + given[given.length - 1] : given[0] + 1;
        int outer = surname.length > 1
                ? surname[0] + (given.length == 1 ? 1 : given[given.length - 1])
                : given.length == 1 ? 2 : given.length == 2 ? given[1] + 1 : surname[0] + given[given.length - 1];
        values.put("heaven", heaven); values.put("person", person); values.put("earth", earth); values.put("outer", outer); values.put("total", sum(surname) + sum(given));
        return values;
    }

    private static LinkedHashMap<String, Integer> liuge(int[] surname, int[] given) {
        LinkedHashMap<String, Integer> values = new LinkedHashMap<>();
        int heaven = surname.length == 1 ? surname[0] + 1 : sum(surname);
        int person = surname.length == 1 ? surname[0] + given[0] : (given.length == 1 ? surname[0] + given[0] : surname[1] + given[0]);
        int earth = given.length == 1 ? given[0] + 1 : sum(given);
        int outer = surname.length == 1 ? (given.length == 1 ? 2 : given[1] + 1) : (given.length == 1 ? surname[0] + 1 : surname[0] + given[1]);
        int change = surname.length == 1 ? surname[0] + given[given.length - 1] : surname[1] + given[given.length - 1];
        values.put("heaven", heaven); values.put("person", person); values.put("earth", earth); values.put("outer", outer); values.put("total", sum(surname) + sum(given)); values.put("change", change);
        return values;
    }

    private static String element(int number) {
        return switch (number % 10) { case 1, 2 -> "木"; case 3, 4 -> "火"; case 5, 6 -> "土"; case 7, 8 -> "金"; case 0, 9 -> "水"; default -> throw new IllegalStateException("无法判定五行"); };
    }

    private static String joinTraditional(List<ResolvedCharacter> rows) { return rows.stream().map(row -> row.row().traditional()).reduce("", String::concat); }
    private static int sum(int[] values) { int result = 0; for (int value : values) result += value; return result; }
    private static String label(String key) { return switch (key) { case "heaven" -> "天格"; case "person" -> "人格"; case "earth" -> "地格"; case "outer" -> "外格"; case "total" -> "总格"; case "change" -> "变格"; default -> key; }; }
    private static boolean hasText(String value) { return value != null && !value.isBlank(); }
    private static String nullableText(String value) { return hasText(value) ? value : null; }

    private static Map<Integer, String> createLiugeRatings() {
        int[] auspicious = {1,3,5,6,7,8,11,13,15,16,18,21,23,24,25,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81};
        int[] mixed = {17,27,29,30,38,51,58,71,73,75,77,78};
        Map<Integer, String> result = new LinkedHashMap<>();
        for (int number = 1; number <= 81; number++) result.put(number, "凶");
        for (int number : auspicious) result.put(number, "吉");
        for (int number : mixed) result.put(number, "半吉半凶");
        return Map.copyOf(result);
    }

    private record ResolvedCharacter(String input, XingmingRepository.CharacterRow row) {}
}
