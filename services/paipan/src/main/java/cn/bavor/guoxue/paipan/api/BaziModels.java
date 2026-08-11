package cn.bavor.guoxue.paipan.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public final class BaziModels {
    private BaziModels() {}

    public record AreaNode(String label, String code, List<AreaNode> children) {}

    public record ResolveBirthRequest(
            @NotBlank @Pattern(regexp = "solar|lunar|fourPillars") String mode,
            String solarDateTime,
            @Valid LunarBirth lunar,
            @Valid FourPillars pillars) {}

    public record LunarBirth(
            @Min(1900) @Max(2100) int year,
            @Min(1) @Max(12) int month,
            @Min(1) @Max(30) int day,
            @Min(0) @Max(23) int hour,
            @Min(0) @Max(59) int minute,
            boolean leapMonth) {}

    public record FourPillars(
            @NotBlank @Size(min = 2, max = 2) String year,
            @NotBlank @Size(min = 2, max = 2) String month,
            @NotBlank @Size(min = 2, max = 2) String day,
            @NotBlank @Size(min = 2, max = 2) String hour) {}

    public record BirthCandidate(String id, String solarDateTime, String label) {}

    public record ResolveBirthResponse(List<BirthCandidate> candidates, int sect) {}

    public record ChartRequest(
            @Size(max = 32) String name,
            @NotBlank @Pattern(regexp = "male|female") String gender,
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String birthDateTime,
            @NotBlank @Pattern(regexp = "\\d{6}") String areaCode,
            boolean useTrueSolarTime) {}

    public record Profile(
            String name,
            String gender,
            String birthDateTime,
            String lunarDate,
            String area,
            String areaCode,
            String trueSolarTime,
            String chineseZodiac,
            String zodiac) {}

    public record BasicFacts(
            String benMingFo,
            String taiYuan,
            String taiYuanNaYin,
            String mingGong,
            String mingGongNaYin,
            String duiChong,
            String sanSha,
            String wenChangWei,
            String prevSolarTerm,
            String nextSolarTerm) {}

    public record HiddenStem(String stem, String element, String tenGod) {}

    public record Pillar(
            String key,
            String label,
            String stem,
            String branch,
            String stemElement,
            String branchElement,
            String tenGod,
            List<HiddenStem> hiddenStems,
            String growth,
            String selfSeat,
            String naYin,
            String voidBranch,
            List<String> shenSha) {}

    public record Attention(List<String> heavenlyStems, List<String> earthlyBranches) {}

    public record FlowYear(
            int index,
            int year,
            int age,
            String ganZhi,
            String voidBranch,
            List<String> tenGods,
            String hiddenStems,
            List<String> hiddenStemTenGods,
            boolean wealthStrong,
            List<String> heavenlyStemAttention,
            List<String> earthlyBranchAttention,
            List<String> shenSha) {}

    public record FortunePeriod(
            int index,
            int startYear,
            int endYear,
            int startAge,
            int endAge,
            String ganZhi,
            List<String> tenGods,
            String growth,
            String hiddenStems,
            List<String> hiddenStemTenGods,
            boolean wealthStrong,
            List<String> heavenlyStemAttention,
            List<String> earthlyBranchAttention,
            List<String> shenSha,
            List<FlowYear> years) {}

    public record Fortune(
            String startSolar,
            String startDescription,
            String changeDescription,
            List<FortunePeriod> periods) {}

    public record StrengthReference(
            int legacyScore,
            int samePartyScore,
            int otherPartyScore,
            String level,
            String pattern,
            String summary,
            String favorableGod,
            List<String> favorableElements,
            Map<String, Integer> relationScores) {}

    public record ChartResponse(
            Profile profile,
            BasicFacts basicFacts,
            List<Pillar> pillars,
            Attention attention,
            Map<String, List<String>> shenShaDescriptions,
            Fortune fortune,
            StrengthReference strength) {}

    public record FlowMonthsRequest(@NotNull @Valid ChartRequest chart, @Min(1900) @Max(2200) int year) {}

    public record FlowMonth(
            int index,
            String monthName,
            String ganZhi,
            String solarTermName,
            String solarTermDateTime,
            List<String> tenGods,
            String hiddenStems,
            List<String> hiddenStemTenGods,
            List<String> heavenlyStemAttention,
            List<String> earthlyBranchAttention,
            List<String> shenSha) {}

    public record FlowMonthsResponse(int year, List<FlowMonth> months) {}

    public record ShenShaRequest(
            @NotNull Map<String, List<String>> pillars,
            @NotBlank @Pattern(regexp = "nian|yue|ri|shi|dayun|liunian|liuyue") String target) {}

    public record ShenShaResponse(String target, List<String> names) {}
}
