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
class ShuziGuilvControllerTest {
    @Autowired MockMvc mockMvc;

    @Test
    void returnsNormalizedChartAndRejectsInvalidGender() throws Exception {
        mockMvc.perform(post("/internal/v1/shuzi-guilv/chart").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"测试者\",\"gender\":\"male\",\"birthDateTime\":\"1990-01-01 12:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.innate.year.numbers[0]").value(6))
                .andExpect(jsonPath("$.acquired.year.numbers[0]").value(12));
        mockMvc.perform(post("/internal/v1/shuzi-guilv/chart").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"测试者\",\"gender\":\"unknown\",\"birthDateTime\":\"1990-01-01 12:00\"}"))
                .andExpect(status().isUnprocessableEntity());
    }
}
