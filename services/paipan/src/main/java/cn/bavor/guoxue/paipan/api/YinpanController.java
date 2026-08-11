package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.YinpanEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/yinpan-juece")
public class YinpanController {
    private final YinpanEngine engine;

    public YinpanController(YinpanEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public YinpanModels.ChartResponse chart(@Valid @RequestBody YinpanModels.ChartRequest request) {
        return engine.chart(request);
    }
}
