package cn.bavor.guoxue.paipan.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cn.bavor.guoxue.paipan.engine.ShanxiangEngine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ShanxiangController.class)
class ShanxiangControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean ShanxiangEngine engine;

    @Test
    void rejectsOutOfRangeDegrees() throws Exception {
        mockMvc.perform(post("/internal/v1/shanxiang-juece/chart")
                        .contentType("application/json")
                        .content("{\"year\":2026,\"degrees\":361,\"question\":\"\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
