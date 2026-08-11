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
class LuojiControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsTheNormalizedLuojiChart() throws Exception {
        mockMvc.perform(post("/internal/v1/luoji/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 21:31",
                                  "question":"",
                                  "mode":"backs",
                                  "coinBacks":"312101"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overview.voidBranches").value("子丑"))
                .andExpect(jsonPath("$.original.name").value("火泽睽"))
                .andExpect(jsonPath("$.original.palace.name").value("艮宫"))
                .andExpect(jsonPath("$.changed.name").value("天水讼"))
                .andExpect(jsonPath("$.changed.palace.type").value("游魂"))
                .andExpect(jsonPath("$.lines.length()").value(6))
                .andExpect(jsonPath("$.lines[1].hiddenKin").value("妻财"))
                .andExpect(jsonPath("$.lines[5].isMoving").value(true));
    }

    @Test
    void rejectsInvalidBackCount() throws Exception {
        mockMvc.perform(post("/internal/v1/luoji/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 21:31",
                                  "question":"",
                                  "mode":"backs",
                                  "coinBacks":"31210"
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
