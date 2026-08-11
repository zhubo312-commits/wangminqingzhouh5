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
class MeihuaControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsTheNormalizedMeihuaChart() throws Exception {
        mockMvc.perform(post("/internal/v1/meihua/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 21:31",
                                  "mode":"time"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overview.method").value("时间起盘"))
                .andExpect(jsonPath("$.overview.school").doesNotExist())
                .andExpect(jsonPath("$.upperTrigram").value(2))
                .andExpect(jsonPath("$.lowerTrigram").value(6))
                .andExpect(jsonPath("$.movingLine").value(6))
                .andExpect(jsonPath("$.original.name").value("泽水困"))
                .andExpect(jsonPath("$.mutual.name").value("风火家人"))
                .andExpect(jsonPath("$.changed.name").value("天水讼"));
    }

    @Test
    void rejectsIncompleteNumberInput() throws Exception {
        mockMvc.perform(post("/internal/v1/meihua/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 21:31",
                                  "mode":"number",
                                  "numberOne":123,
                                  "includeHour":false,
                                  "school":"digit_sum"
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
