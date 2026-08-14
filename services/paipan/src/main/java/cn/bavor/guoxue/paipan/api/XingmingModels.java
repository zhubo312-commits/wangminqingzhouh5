package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public final class XingmingModels {
    private XingmingModels() {}

    public record ChartRequest(
            @NotBlank @Pattern(regexp = "\\p{IsHan}{1,2}", message = "姓氏须为 1 至 2 个汉字") String surname,
            @NotBlank @Pattern(regexp = "\\p{IsHan}{1,3}", message = "名字须为 1 至 3 个汉字") String givenName,
            @NotBlank @Pattern(regexp = "wuge|liuge", message = "流派仅支持 wuge 或 liuge") String school) {}

    public record Dataset(String status, String version, String dictionaryVersion, String numerologyVersion) {}

    public record NormalizedName(String surname, String givenName, String fullName) {}

    public record UsageReference(
            Integer recommendationPercent,
            Integer culturePercent,
            Integer genderTendency,
            Long usageCount,
            Integer firstCharacterPercent,
            Integer malePercent,
            Integer femalePercent,
            String sourceNote) {}

    public record CharacterDetail(
            String input,
            String simplified,
            String traditional,
            String pinyin,
            String radical,
            int kangxiStrokes,
            int calculationStrokes,
            String element,
            String rating,
            Boolean common,
            String nameUsageClass,
            String nameExplanation,
            String namingMeaning,
            String namingImplication,
            String taboos,
            UsageReference usageReference) {}

    public record NumberInterpretation(
            int number,
            String yinYang,
            String rating,
            String summary,
            String categories,
            String foundation,
            String family,
            String health,
            String meaning,
            String detail) {}

    public record Grid(
            String key,
            String label,
            int number,
            int interpretationNumber,
            String element,
            String rating,
            NumberInterpretation interpretation) {}

    public record ThreeTalents(
            String title,
            String rating,
            String summary,
            String foundationLuck,
            String foundationRating,
            String successLuck,
            String successRating,
            String relationships,
            String relationshipsRating,
            String personality,
            String liugeSummary,
            String liugeRating) {}

    public record ElementRelation(String from, String to, String relation, String summary) {}

    public record ScoreComponent(
            String key, String label, int weightPercent, int rawScore, int contribution) {}

    public record ScoreBreakdown(List<ScoreComponent> components, int total, String note) {}

    public record ChartResponse(
            Dataset dataset,
            String school,
            NormalizedName name,
            List<CharacterDetail> characters,
            List<Grid> grids,
            ThreeTalents threeTalents,
            List<ElementRelation> elementRelations,
            int score,
            ScoreBreakdown scoreBreakdown,
            NumberInterpretation totalGridDescription) {}
}
