package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.ShuziGuilvEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/shuzi-guilv")
public class ShuziGuilvController {
    private final ShuziGuilvEngine engine;

    public ShuziGuilvController(ShuziGuilvEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public ShuziGuilvModels.ChartResponse chart(@Valid @RequestBody ShuziGuilvModels.ChartRequest request) {
        return engine.chart(request);
    }
}
