package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class LuojiModels {
    private LuojiModels() {}

    public record ChartRequest(
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String chartDateTime,
            @Size(max = 80) String question,
            @NotBlank @Pattern(regexp = "coins|names|backs") String mode,
            @Pattern(regexp = "[0-3]{6}") String coinBacks,
            String originalHexagram,
            String changedHexagram) {

        @AssertTrue(message = "起盘参数与起盘方式不匹配")
        public boolean isModeConfigurationValid() {
            if ("coins".equals(mode) || "backs".equals(mode)) return coinBacks != null;
            return "names".equals(mode)
                    && originalHexagram != null && !originalHexagram.isBlank()
                    && changedHexagram != null && !changedHexagram.isBlank();
        }
    }

    public record Pillars(String year, String month, String day, String hour) {}

    public record Overview(
            String method,
            String question,
            String solarDateTime,
            String lunarDate,
            Pillars pillars,
            String voidBranches,
            String coinBacks) {}

    public record Palace(String name, int sequence, String type, String element) {}

    public record Hexagram(
            String name,
            String upperTrigram,
            String lowerTrigram,
            List<String> lines,
            Palace palace,
            int shiLine,
            int yingLine) {}

    public record Line(
            int position,
            String deity,
            String hiddenKin,
            String hiddenStemBranch,
            String originalKin,
            String originalStemBranch,
            String originalElement,
            String originalLine,
            boolean isMoving,
            String marker,
            String changedKin,
            String changedStemBranch,
            String changedElement,
            String changedLine) {}

    public record ChartResponse(
            Overview overview,
            Hexagram original,
            Hexagram changed,
            List<Line> lines) {}
}
