package cn.bavor.guoxue.paipan.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class DunjiaControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void calculatesTheCompleteFrozenLegacyDunjiaChart() throws Exception {
        mockMvc.perform(post("/internal/v1/dunjia/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"chartDateTime":"2026-08-11 13:35"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qiMenZao.yearGanZhi").value("丙午"))
                .andExpect(jsonPath("$.qiMenZao.juShu").value(5))
                .andExpect(jsonPath("$.qiMenZao.zhiFu").value("天蓬星"))
                .andExpect(jsonPath("$.qimenGong.length()").value(9))
                .andExpect(jsonPath("$.qimenGong[3].siHai").isArray())
                .andExpect(jsonPath("$.tianMenDiHuList.length()").value(12));
    }

    @Test
    void rejectsAnInvalidChartTime() throws Exception {
        mockMvc.perform(post("/internal/v1/dunjia/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"chartDateTime":"2026/08/11"}
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
