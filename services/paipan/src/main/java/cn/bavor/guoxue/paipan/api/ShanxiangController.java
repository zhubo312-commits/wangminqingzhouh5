package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.ShanxiangEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/shanxiang-juece")
public class ShanxiangController {
    private final ShanxiangEngine engine;

    public ShanxiangController(ShanxiangEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public ShanxiangModels.ChartResponse chart(@Valid @RequestBody ShanxiangModels.ChartRequest request) {
        return engine.chart(request);
    }
}
