package cn.bavor.guoxue.paipan.api;

import cn.bavor.guoxue.paipan.engine.XingxiangEngine;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/xingxiang")
public class XingxiangController {
    private final XingxiangEngine engine;

    public XingxiangController(XingxiangEngine engine) {
        this.engine = engine;
    }

    @PostMapping("/chart")
    public XingxiangModels.ChartResponse chart(@Valid @RequestBody XingxiangModels.ChartRequest request) {
        return engine.chart(request);
    }
}
