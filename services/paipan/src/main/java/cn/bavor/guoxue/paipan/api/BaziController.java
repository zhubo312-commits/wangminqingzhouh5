package cn.bavor.guoxue.paipan.api;

import static cn.bavor.guoxue.paipan.api.BaziModels.*;

import cn.bavor.guoxue.paipan.engine.BaziEngine;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/bazi")
public class BaziController {
    private final BaziEngine engine;

    public BaziController(BaziEngine engine) {
        this.engine = engine;
    }

    @GetMapping("/areas")
    public List<AreaNode> areas() {
        return engine.areas();
    }

    @PostMapping("/resolve-birth")
    public ResolveBirthResponse resolveBirth(@Valid @RequestBody ResolveBirthRequest request) {
        return engine.resolveBirth(request);
    }

    @PostMapping("/chart")
    public ChartResponse chart(@Valid @RequestBody ChartRequest request) {
        return engine.chart(request);
    }

    @PostMapping("/flow-months")
    public FlowMonthsResponse flowMonths(@Valid @RequestBody FlowMonthsRequest request) {
        return engine.flowMonths(request);
    }

    @PostMapping("/shen-sha")
    public ShenShaResponse shenSha(@Valid @RequestBody ShenShaRequest request) {
        return engine.shenSha(request);
    }
}
