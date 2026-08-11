package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.MeihuaEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/meihua")
public class MeihuaController {
    private final MeihuaEngine engine;

    public MeihuaController(MeihuaEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public MeihuaModels.ChartResponse chart(@Valid @RequestBody MeihuaModels.ChartRequest request) {
        return engine.chart(request);
    }
}
