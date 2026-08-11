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
class JueceControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsTheNormalizedTimeSchoolDecisionChart() throws Exception {
        mockMvc.perform(post("/internal/v1/juece/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 16:00",
                                  "time":{"mode":"standard"},
                                  "pan":{"style":"rotating","centerPalaceMethod":"kun"},
                                  "bureau":{"method":"chai_bu"},
                                  "voidBasis":"hour"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overview.panStyle").value("rotating"))
                .andExpect(jsonPath("$.overview.dunType").value("阴"))
                .andExpect(jsonPath("$.overview.juNumber").value(5))
                .andExpect(jsonPath("$.overview.xunShou").value("甲辰壬"))
                .andExpect(jsonPath("$.palaces.length()").value(9))
                .andExpect(jsonPath("$.palaces[1].heavenPlate.star").value("天蓬"))
                .andExpect(jsonPath("$.overview.areaCode").value((Object) null))
                .andExpect(jsonPath("$.palaces[0].earthPlate.deity").value((Object) null))
                .andExpect(jsonPath("$.palaces[0].attached").value((Object) null))
                .andExpect(jsonPath("$.palaces[0].hiddenGanZhi").value((Object) null))
                .andExpect(jsonPath("$.panHead").doesNotExist());
    }

    @Test
    void rejectsMutuallyExclusiveOptionsAndInvalidJson() throws Exception {
        mockMvc.perform(post("/internal/v1/juece/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "chartDateTime":"2026-08-11 16:00",
                                  "time":{"mode":"standard"},
                                  "pan":{"style":"flying","centerPalaceMethod":"kun","directionRule":"all_forward"},
                                  "bureau":{"method":"chai_bu"},
                                  "voidBasis":"hour"
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/internal/v1/juece/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
