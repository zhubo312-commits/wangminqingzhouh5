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
class XuankongFeixingControllerTest {
    @Autowired MockMvc mockMvc;

    @Test
    void returnsNinePalacesAndRejectsUnknownOrientation() throws Exception {
        mockMvc.perform(post("/internal/v1/xuankong-feixing/chart").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"chartDateTime\":\"2024-02-04 12:00\",\"fortunePeriod\":9,\"orientation\":\"子山午向\",\"method\":\"base\",\"note\":\"黄金样例\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overview.methodLabel").value("下盘"))
                .andExpect(jsonPath("$.palaces.length()").value(9));
        mockMvc.perform(post("/internal/v1/xuankong-feixing/chart").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"chartDateTime\":\"2024-02-04 12:00\",\"fortunePeriod\":9,\"orientation\":\"未知山向\",\"method\":\"base\",\"note\":\"\"}"))
                .andExpect(status().isUnprocessableEntity());
    }
}
