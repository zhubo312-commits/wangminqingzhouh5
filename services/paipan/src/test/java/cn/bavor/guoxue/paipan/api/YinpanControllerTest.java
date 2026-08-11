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
class YinpanControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsTheNormalizedYinpanChart() throws Exception {
        mockMvc.perform(post("/internal/v1/yinpan-juece/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 21:31",
                                  "gender":"male",
                                  "question":"",
                                  "mode":"time",
                                  "lifetime":false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overview.dunType").value("阴"))
                .andExpect(jsonPath("$.overview.juNumber").value(9))
                .andExpect(jsonPath("$.overview.chiefStar.name").value("天芮星"))
                .andExpect(jsonPath("$.overview.chiefStar.palace").value(6))
                .andExpect(jsonPath("$.overview.chiefDoor.name").value("死"))
                .andExpect(jsonPath("$.overview.chiefDoor.palace").value(7))
                .andExpect(jsonPath("$.palaces.length()").value(9))
                .andExpect(jsonPath("$.heavenEarthGates.length()").value(12))
                .andExpect(jsonPath("$.lifetimeChart").doesNotExist());
    }

    @Test
    void rejectsInvalidInput() throws Exception {
        mockMvc.perform(post("/internal/v1/yinpan-juece/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 21:31",
                                  "gender":"unknown",
                                  "question":"",
                                  "mode":"time",
                                  "lifetime":false
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
