package cn.bavor.guoxue.paipan.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class BaziControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsGroupedChartWithoutTheLegacyFlatEnvelope() throws Exception {
        mockMvc.perform(post("/internal/v1/bazi/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "gender": "male",
                                  "birthDateTime": "1990-01-01 12:30",
                                  "areaCode": "110101",
                                  "useTrueSolarTime": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.name").value(""))
                .andExpect(jsonPath("$.pillars.length()").value(4))
                .andExpect(jsonPath("$.pillars[0].stem").value("己"))
                .andExpect(jsonPath("$.fortune.periods[1].ganZhi").value("乙亥"))
                .andExpect(jsonPath("$.strength.level").value("日主偏旺，身强"))
                .andExpect(jsonPath("$.yearGan").doesNotExist());
    }

    @Test
    void rejectsInvalidInputWith422AndNoStackTrace() throws Exception {
        mockMvc.perform(post("/internal/v1/bazi/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"gender\":\"unknown\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("请求参数有误"))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    void reportsAlgorithmResourcesLoaded() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.algorithm.status").value("UP"))
                .andExpect(jsonPath("$.components.algorithm.details.resources").value("loaded"));
    }
}
