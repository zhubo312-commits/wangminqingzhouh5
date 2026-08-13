package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.XuankongFeixingEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/xuankong-feixing")
public class XuankongFeixingController {
    private final XuankongFeixingEngine engine;

    public XuankongFeixingController(XuankongFeixingEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public XuankongFeixingModels.ChartResponse chart(@Valid @RequestBody XuankongFeixingModels.ChartRequest request) {
        return engine.chart(request);
    }
}
