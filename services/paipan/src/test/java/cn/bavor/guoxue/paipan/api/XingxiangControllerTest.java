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
class XingxiangControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsTheNormalizedXingxiangChart() throws Exception {
        mockMvc.perform(post("/internal/v1/xingxiang/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"测试",
                                  "gender":"male",
                                  "birthDateTime":"1990-01-01 12:00",
                                  "areaCode":"110101",
                                  "useTrueSolarTime":false,
                                  "school":"flying"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.fiveElementsBureau").value("土五局"))
                .andExpect(jsonPath("$.profile.pillars.year").value("己巳"))
                .andExpect(jsonPath("$.palaces.length()").value(12))
                .andExpect(jsonPath("$.palaces[0].flyingTransformations.length()").value(4))
                .andExpect(jsonPath("$.periods.length()").value(12))
                .andExpect(jsonPath("$.periods[0].annuals.length()").value(10))
                .andExpect(jsonPath("$.periods[0].annuals[0].months.length()").value(12));
    }

    @Test
    void rejectsInvalidGenderAndDate() throws Exception {
        mockMvc.perform(post("/internal/v1/xingxiang/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"测试",
                                  "gender":"unknown",
                                  "birthDateTime":"2024-02-30 12:00",
                                  "areaCode":"110101",
                                  "useTrueSolarTime":false,
                                  "school":"flying"
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
