package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ShuziGuilvModels {
    private ShuziGuilvModels() {}

    public record ChartRequest(
            @NotBlank @Size(max = 10) String name,
            @NotBlank @Pattern(regexp = "male|female") String gender,
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String birthDateTime) {}

    public record Overview(
            String name,
            String gender,
            String genderLabel,
            String solarDateTime,
            String lunarDate,
            String chineseZodiac) {}

    public record NumberCell(List<Integer> numbers, List<String> yinYang, List<String> elements) {}

    public record NumberSet(NumberCell year, NumberCell month, NumberCell day, NumberCell hour) {}

    public record Interpretation(
            String combination,
            String position,
            String category,
            String description,
            int occurrences) {}

    public record ChartResponse(
            Overview overview,
            NumberSet innate,
            NumberSet acquired,
            List<Interpretation> interpretations) {}
}
