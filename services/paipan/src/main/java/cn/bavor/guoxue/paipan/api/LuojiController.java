package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.LuojiEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/luoji")
public class LuojiController {
    private final LuojiEngine engine;

    public LuojiController(LuojiEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public LuojiModels.ChartResponse chart(@Valid @RequestBody LuojiModels.ChartRequest request) {
        return engine.chart(request);
    }
}
