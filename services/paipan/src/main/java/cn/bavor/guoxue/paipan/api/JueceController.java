package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.ShijiaJueceEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/juece")
public class JueceController {
    private final ShijiaJueceEngine engine;

    public JueceController(ShijiaJueceEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public JueceModels.ChartResponse chart(@Valid @RequestBody JueceModels.ChartRequest request) {
        return engine.chart(request);
    }
}
