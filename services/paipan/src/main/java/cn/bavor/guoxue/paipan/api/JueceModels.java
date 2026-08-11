package cn.bavor.guoxue.paipan.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public final class JueceModels {
    private JueceModels() {}

    public record ChartRequest(
            @NotBlank
            @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")
            String chartDateTime,
            @NotNull @Valid TimeOption time,
            @NotNull @Valid PanOption pan,
            @NotNull @Valid BureauOption bureau,
            @NotBlank String voidBasis) {}

    public record TimeOption(
            @NotBlank String mode,
            String areaCode) {}

    public record PanOption(
            @NotBlank String style,
            String centerPalaceMethod,
            String directionRule) {}

    public record BureauOption(
            @NotBlank String method,
            String dunType,
            Integer number) {}

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record ChartResponse(
            Overview overview,
            List<Palace> palaces,
            List<HeavenEarthGate> heavenEarthGates) {}

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record Overview(
            String method,
            String clockDateTime,
            String effectiveDateTime,
            String timeMode,
            String areaCode,
            String areaName,
            String trueSolarTime,
            String lunarDate,
            Pillars pillars,
            VoidBranches voidBranches,
            String selectedVoidBranches,
            SolarTerm previousSolarTerm,
            SolarTerm nextSolarTerm,
            String panStyle,
            String panStyleLabel,
            String bureauMethod,
            String bureauLabel,
            String directionRule,
            String centerPalaceMethod,
            String dunType,
            int juNumber,
            String xunShou,
            Chief chiefStar,
            Chief chiefDoor,
            Horse horse) {}

    public record Pillars(
            String year,
            String month,
            String day,
            String hour) {}

    public record VoidBranches(
            String year,
            String month,
            String day,
            String hour) {}

    public record SolarTerm(String name, String dateTime) {}

    public record Chief(String name, int palace) {}

    public record Horse(String branch, int palace) {}

    public record Harm(String symbol, String type) {}

    public record GrowthStage(String branch, String stage) {}

    public record HeavenEarthGate(
            String branch,
            String heavenGate,
            String earthGate) {}

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record PlateLayer(
            String stem,
            String star,
            String door,
            String deity) {}

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record Attached(
            String earthStem,
            String earthStar,
            String heavenStem,
            String heavenStar) {}

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record Palace(
            int index,
            String trigram,
            String direction,
            String element,
            PlateLayer heavenPlate,
            PlateLayer earthPlate,
            Attached attached,
            String hiddenGanZhi,
            List<Harm> harms,
            List<GrowthStage> heavenGrowth,
            List<GrowthStage> earthGrowth,
            boolean isVoid,
            boolean isHorse,
            boolean isChief,
            boolean isChiefDoor) {}
}
