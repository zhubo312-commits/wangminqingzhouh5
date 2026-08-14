package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.XingmingEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/xingming")
public class XingmingController {
    private final XingmingEngine engine;

    public XingmingController(XingmingEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public XingmingModels.ChartResponse chart(@Valid @RequestBody XingmingModels.ChartRequest request) {
        return engine.chart(request);
    }
}
