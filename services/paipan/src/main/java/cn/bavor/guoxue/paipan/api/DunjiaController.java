package cn.bavor.guoxue.paipan.api;

import com.alibaba.fastjson.JSONObject;
import cn.bavor.guoxue.paipan.engine.DunjiaEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/dunjia")
public class DunjiaController {
    private final DunjiaEngine engine;

    public DunjiaController(DunjiaEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public JSONObject chart(@Valid @RequestBody DunjiaModels.ChartRequest request) {
        return engine.chart(request.chartDateTime());
    }
}
