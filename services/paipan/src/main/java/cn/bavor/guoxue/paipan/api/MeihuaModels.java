package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public final class MeihuaModels {
    private MeihuaModels() {}

    public record ChartRequest(
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String chartDateTime,
            @NotBlank @Pattern(regexp = "time|random|number|specified") String mode,
            @Min(1) @Max(999_999_999) Long numberOne,
            @Min(1) @Max(999_999_999) Long numberTwo,
            Boolean includeHour,
            @Pattern(regexp = "digit_sum|raw_number") String school,
            @Min(1) @Max(8) Integer upperTrigram,
            @Min(1) @Max(8) Integer lowerTrigram,
            @Min(1) @Max(6) Integer movingLine) {

        @AssertTrue(message = "起盘参数与起盘方式不匹配")
        public boolean isModeConfigurationValid() {
            if ("number".equals(mode)) {
                return numberOne != null && numberTwo != null && includeHour != null && school != null;
            }
            if ("random".equals(mode) || "specified".equals(mode)) {
                return upperTrigram != null && lowerTrigram != null && movingLine != null;
            }
            return "time".equals(mode);
        }
    }

    public record Pillars(String year, String month, String day, String hour) {}

    public record Overview(
            String method,
            String solarDateTime,
            String lunarDate,
            Pillars pillars,
            String voidBranches,
            String school,
            Long numberOne,
            Long numberTwo,
            boolean includeHour) {}

    public record Trigram(
            int index,
            String key,
            String name,
            String symbol,
            String element,
            List<String> lines) {}

    public record Hexagram(
            String key,
            String name,
            Trigram upper,
            Trigram lower,
            List<String> lines) {}

    public record ChartResponse(
            Overview overview,
            int upperTrigram,
            int lowerTrigram,
            int movingLine,
            Hexagram original,
            Hexagram mutual,
            Hexagram changed) {}
}
