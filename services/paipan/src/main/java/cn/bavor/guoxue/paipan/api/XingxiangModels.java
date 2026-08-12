package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class XingxiangModels {
    private XingxiangModels() {}

    public record ChartRequest(
            @NotBlank @Size(max = 10) String name,
            @NotBlank @Pattern(regexp = "male|female") String gender,
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String birthDateTime,
            @NotBlank @Pattern(regexp = "flying") String school) {}

    public record Pillars(String year, String month, String day, String hour) {}

    public record Profile(
            String name,
            String gender,
            String genderLabel,
            String yinYangGender,
            String solarDateTime,
            String lunarDate,
            String fiveElementsBureau,
            Pillars pillars) {}

    public record Star(
            String name,
            String category,
            String brightness,
            String natalTransformation) {}

    public record SelfTransformation(
            String transformation,
            String star,
            boolean inward) {}

    public record Palace(
            String branch,
            String name,
            String heavenlyStem,
            boolean bodyPalace,
            boolean zodiacPalace,
            boolean originPalace,
            List<Star> stars,
            List<SelfTransformation> selfTransformations) {}

    public record PalaceName(String branch, String name) {}

    public record Transformation(String transformation, String star) {}

    public record Annual(
            int age,
            int year,
            String ganZhi,
            List<PalaceName> palaceNames,
            List<Transformation> transformations) {}

    public record Period(
            String ganZhi,
            int startAge,
            int endAge,
            int startYear,
            int endYear,
            List<PalaceName> palaceNames,
            List<Transformation> transformations,
            List<Annual> annuals) {}

    public record ChartResponse(
            Profile profile,
            List<Palace> palaces,
            List<Period> periods) {}
}
