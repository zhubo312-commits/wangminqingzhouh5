package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class DunjiaModels {
    private DunjiaModels() {}

    public record ChartRequest(
            @NotBlank
            @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")
            String chartDateTime) {}
}
