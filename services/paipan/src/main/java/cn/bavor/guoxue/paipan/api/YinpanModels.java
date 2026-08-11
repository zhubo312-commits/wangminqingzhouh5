package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class YinpanModels {
    private YinpanModels() {}

    public record ChartRequest(
            @NotBlank @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}") String chartDateTime,
            @NotBlank @Pattern(regexp = "male|female") String gender,
            @Size(max = 30) String question,
            @NotBlank @Pattern(regexp = "time|ke") String mode,
            @NotNull Boolean lifetime) {}

    public record Pillars(String year, String month, String day, String hour) {}

    public record Chief(String name, int palace) {}

    public record Horse(String branch, int palace) {}

    public record Overview(
            String method,
            String question,
            String gender,
            String solarDateTime,
            String lunarDate,
            Pillars pillars,
            String voidBranches,
            String dunType,
            int juNumber,
            String xunShou,
            Chief chiefStar,
            Chief chiefDoor,
            String previousSolarTerm,
            String nextSolarTerm,
            String monthGeneral,
            Horse horse) {}

    public record Harm(String symbol, String type) {}

    public record GrowthStage(String branch, String stage) {}

    public record Palace(
            int index,
            String trigram,
            String direction,
            String element,
            String deity,
            String star,
            String door,
            List<String> heavenStems,
            List<String> earthStems,
            String hiddenStem,
            List<Harm> harms,
            List<GrowthStage> heavenGrowth,
            List<GrowthStage> earthGrowth,
            boolean isVoid,
            boolean isHorse,
            boolean isChief,
            boolean isChiefDoor) {}

    public record HeavenEarthGate(String branch, String heavenGate, String earthGate) {}

    public record ChartResponse(
            Overview overview,
            List<Palace> palaces,
            List<HeavenEarthGate> heavenEarthGates,
            BaziModels.ChartResponse lifetimeChart) {}
}
