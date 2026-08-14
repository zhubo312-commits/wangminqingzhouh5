package cn.bavor.guoxue.paipan.engine;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class XingmingRepository {
    public record CharacterRow(
            String simplified, String traditional, String pinyin, String fullPinyin,
            String radical, int strokes, String element, String rating, String kangxiStrokes,
            Integer recommendationPercent, Integer culturePercent, Integer genderTendency,
            Boolean common, String nameUsageClass, String nameExplanation, String namingMeaning,
            String namingImplication, Long usageCount, Integer firstCharacterPercent,
            Integer malePercent, Integer femalePercent, String taboosText) {}

    public record NumberRow(int number, String poem, String rating, String categories, String detail) {}

    public record SanCaiRow(
            String title, String rating, String content,
            String foundationLuck, String foundationRating,
            String successLuck, String successRating,
            String relationships, String relationshipsRating,
            String personality, String liugeSummary, String liugeRating) {}

    private final JdbcTemplate jdbc;

    public XingmingRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CharacterRow> findCharacter(String character) {
        List<CharacterRow> rows = jdbc.query("""
                SELECT dictionary.jtz, dictionary.zi, dictionary.py, dictionary.pinyin,
                  dictionary.bushou, dictionary.bihua, dictionary.wx, dictionary.jx,
                  dictionary.kx_bihua, profile.recommendation_percent, profile.culture_percent,
                  profile.gender_tendency, profile.common_flag, profile.name_usage_class,
                  profile.name_explanation, profile.naming_meaning, profile.naming_implication,
                  profile.usage_count, profile.first_character_percent, profile.male_percent,
                  profile.female_percent, profile.taboos_text
                FROM chinese_dictionary dictionary
                LEFT JOIN chinese_dictionary_alias alias ON alias.target_zi = dictionary.zi
                LEFT JOIN chinese_dictionary_profile profile ON profile.zi = dictionary.zi
                WHERE dictionary.zi = ? OR dictionary.jtz = ? OR alias.alias = ?
                ORDER BY CASE WHEN dictionary.zi = ? THEN 0 WHEN alias.alias = ? THEN 1 ELSE 2 END
                LIMIT 1
                """, (result, row) -> new CharacterRow(
                        result.getString("jtz"), result.getString("zi"), result.getString("py"),
                        result.getString("pinyin"), result.getString("bushou"), result.getInt("bihua"),
                        result.getString("wx"), result.getString("jx"), result.getString("kx_bihua"),
                        integer(result, "recommendation_percent"), integer(result, "culture_percent"),
                        integer(result, "gender_tendency"), booleanValue(result, "common_flag"),
                        result.getString("name_usage_class"), result.getString("name_explanation"),
                        result.getString("naming_meaning"), result.getString("naming_implication"),
                        longValue(result, "usage_count"), integer(result, "first_character_percent"),
                        integer(result, "male_percent"), integer(result, "female_percent"),
                        result.getString("taboos_text")),
                character, character, character, character, character);
        return rows.stream().findFirst();
    }

    public Optional<NumberRow> findNumber(int number) {
        return jdbc.query("SELECT num, yy, jx, als, content FROM yp_81 WHERE num = ?",
                        (result, row) -> new NumberRow(result.getInt("num"), result.getString("yy"),
                                result.getString("jx"), result.getString("als"), result.getString("content")), number)
                .stream().findFirst();
    }

    public Optional<SanCaiRow> findSanCai(String title) {
        return jdbc.query("""
                        SELECT title, jx, content, jcy, jx1, cgy, jx2, rjgx, jx3, xg,
                          sancai_liu_result, sancai_liu_jx FROM yp_sancai WHERE title = ?
                        """, (result, row) -> new SanCaiRow(
                                result.getString("title"), result.getString("jx"), result.getString("content"),
                                result.getString("jcy"), result.getString("jx1"), result.getString("cgy"),
                                result.getString("jx2"), result.getString("rjgx"), result.getString("jx3"),
                                result.getString("xg"), result.getString("sancai_liu_result"),
                                result.getString("sancai_liu_jx")), title)
                .stream().findFirst();
    }

    private static Integer integer(java.sql.ResultSet result, String column) throws java.sql.SQLException {
        return result.getObject(column, Integer.class);
    }

    private static Long longValue(java.sql.ResultSet result, String column) throws java.sql.SQLException {
        return result.getObject(column, Long.class);
    }

    private static Boolean booleanValue(java.sql.ResultSet result, String column) throws java.sql.SQLException {
        Integer value = integer(result, column);
        return value == null ? null : value == 1;
    }
}
