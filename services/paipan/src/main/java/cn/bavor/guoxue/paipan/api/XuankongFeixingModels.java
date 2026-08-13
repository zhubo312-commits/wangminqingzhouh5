package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class XuankongFeixingModels {
    private XuankongFeixingModels() {}

    public record ChartRequest(
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String chartDateTime,
            @Min(1) @Max(9) int fortunePeriod,
            @NotBlank @Pattern(regexp = "壬山丙向|子山午向|癸山丁向|丑山未向|艮山坤向|寅山申向|甲山庚向|卯山酉向|乙山辛向|辰山戌向|巽山乾向|巳山亥向|丙山壬向|午山子向|丁山癸向|未山丑向|坤山艮向|申山寅向|庚山甲向|酉山卯向|辛山乙向|戌山辰向|乾山巽向|亥山巳向") String orientation,
            @NotBlank @Pattern(regexp = "base|replacement") String method,
            @Size(max = 10) String note) {}

    public record Overview(
            String chartDateTime,
            String lunarDate,
            int fortunePeriod,
            String fortuneLabel,
            String orientation,
            String method,
            String methodLabel,
            String note) {}

    public record Interpretations(
            String combination,
            String fortune,
            String mountain,
            String facing,
            String annual) {}

    public record Palace(
            int index,
            String trigram,
            String direction,
            String element,
            String star,
            int fortuneStar,
            int mountainStar,
            int facingStar,
            int annualStar,
            int monthlyStar,
            int dailyStar,
            int hourlyStar,
            String mountainPosition,
            String facingPosition,
            Interpretations interpretations) {}

    public record ChartResponse(Overview overview, List<String> directions, List<Palace> palaces) {}
}
