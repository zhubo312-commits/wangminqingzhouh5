package cn.bavor.guoxue.paipan.api;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ShanxiangModels {
    private ShanxiangModels() {}

    public record ChartRequest(
            @NotNull @Min(1930) @Max(2100) Integer year,
            @NotNull @DecimalMin("0") @DecimalMax("360") Double degrees,
            @Size(max = 80) String question) {}

    public record Chief(String name, int palace) {}
    public record Horse(String branch, int palace) {}
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

    public record PanelOverview(
            double degrees,
            String direction,
            String mountain,
            String degreeRange,
            String dunType,
            int juNumber,
            String yearPillar,
            String hourPillar,
            String voidBranches,
            String xunShou,
            Chief chiefStar,
            Chief chiefDoor,
            Horse horse,
            String huangQuan) {}

    public record Panel(PanelOverview overview, List<Palace> palaces) {}
    public record Overview(int year, double selectedDegrees, String question) {}
    public record ChartResponse(Overview overview, List<Panel> panels) {}
}
