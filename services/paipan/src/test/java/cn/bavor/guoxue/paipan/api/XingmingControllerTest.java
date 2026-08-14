package cn.bavor.guoxue.paipan.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
class XingmingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void initializesTheOfficialDictionaryAndCompleteNumerologyDataset() {
        org.junit.jupiter.api.Assertions.assertEquals(17_197L,
                jdbc.queryForObject("SELECT COUNT(*) FROM chinese_dictionary", Long.class));
        org.junit.jupiter.api.Assertions.assertEquals(81L,
                jdbc.queryForObject("SELECT COUNT(*) FROM yp_81", Long.class));
        org.junit.jupiter.api.Assertions.assertEquals(81L,
                jdbc.queryForObject("SELECT COUNT(DISTINCT num) FROM yp_81 WHERE num BETWEEN 1 AND 81", Long.class));
        org.junit.jupiter.api.Assertions.assertEquals(0L,
                jdbc.queryForObject("SELECT COUNT(*) FROM yp_81 WHERE num NOT BETWEEN 1 AND 81", Long.class));
        org.junit.jupiter.api.Assertions.assertEquals(125L,
                jdbc.queryForObject("SELECT COUNT(*) FROM yp_sancai", Long.class));
        org.junit.jupiter.api.Assertions.assertEquals(125L,
                jdbc.queryForObject("SELECT COUNT(DISTINCT title) FROM yp_sancai", Long.class));
        org.junit.jupiter.api.Assertions.assertTrue(
                jdbc.queryForObject("SELECT LENGTH(content) > 100 FROM yp_81 WHERE num = 81", Boolean.class));
        org.junit.jupiter.api.Assertions.assertEquals(0L,
                jdbc.queryForObject("SELECT COUNT(*) FROM yp_81 WHERE UPPER(content) LIKE '%<BR%'", Long.class));
        org.junit.jupiter.api.Assertions.assertEquals("【大吉】",
                jdbc.queryForObject("SELECT sancai_liu_jx FROM yp_sancai WHERE title = '金土土'", String.class));
        org.junit.jupiter.api.Assertions.assertEquals("7",
                jdbc.queryForObject("SELECT kx_bihua FROM chinese_dictionary WHERE zi = '李'", String.class));
        org.junit.jupiter.api.Assertions.assertEquals(17,
                jdbc.queryForObject("SELECT bihua FROM chinese_dictionary WHERE zi = '陽'", Integer.class));
        org.junit.jupiter.api.Assertions.assertEquals("17",
                jdbc.queryForObject("SELECT kx_bihua FROM chinese_dictionary WHERE zi = '陽'", String.class));
        org.junit.jupiter.api.Assertions.assertEquals("土",
                jdbc.queryForObject("SELECT wx FROM chinese_dictionary WHERE zi = '王'", String.class));
    }

    @Test
    void rejectsOutOfRangeNumerologyAndInvalidThreeTalentKeys() {
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> jdbc.update("INSERT INTO yp_81 (num, yy) VALUES (999, 'test')"));
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> jdbc.update("INSERT INTO yp_sancai (title, yy) VALUES ('金金A', 'test')"));
    }

    @Test
    void calculatesTheVerifiedFiveGridCase() throws Exception {
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"李","givenName":"明","school":"wuge"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataset.status").value("official"))
                .andExpect(jsonPath("$.dataset.dictionaryVersion").value("kangxi-cn-20260813.r3"))
                .andExpect(jsonPath("$.name.fullName").value("李明"))
                .andExpect(jsonPath("$.characters[0].calculationStrokes").value(7))
                .andExpect(jsonPath("$.characters[1].calculationStrokes").value(8))
                .andExpect(jsonPath("$.grids", hasSize(5)))
                .andExpect(jsonPath("$.grids[0].number").value(8))
                .andExpect(jsonPath("$.grids[1].number").value(15))
                .andExpect(jsonPath("$.grids[2].number").value(9))
                .andExpect(jsonPath("$.grids[3].number").value(2))
                .andExpect(jsonPath("$.grids[4].number").value(15))
                .andExpect(jsonPath("$.threeTalents.title").value("金土水"))
                .andExpect(jsonPath("$.score").value(68))
                .andExpect(jsonPath("$.totalGridDescription.summary")
                        .value("（福寿） 福寿圆满，富贵荣誉，涵养雅量，德高望重。"))
                .andExpect(jsonPath("$.totalGridDescription.detail").value(containsString("基业：")))
                .andExpect(jsonPath("$.threeTalents.summary").value(containsString("1、总论:")));
    }

    @Test
    void calculatesCompoundSurnameAndSingleGivenNameWithTheFiveGridRules() throws Exception {
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"诸葛","givenName":"亮","school":"wuge"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name.fullName").value("諸葛亮"))
                .andExpect(jsonPath("$.characters[0].calculationStrokes").value(16))
                .andExpect(jsonPath("$.characters[1].calculationStrokes").value(15))
                .andExpect(jsonPath("$.characters[2].calculationStrokes").value(9))
                .andExpect(jsonPath("$.grids[0].number").value(31))
                .andExpect(jsonPath("$.grids[0].rating").value("大吉"))
                .andExpect(jsonPath("$.grids[1].number").value(24))
                .andExpect(jsonPath("$.grids[1].rating").value("大吉"))
                .andExpect(jsonPath("$.grids[2].number").value(10))
                .andExpect(jsonPath("$.grids[2].rating").value("凶"))
                .andExpect(jsonPath("$.grids[3].number").value(17))
                .andExpect(jsonPath("$.grids[3].rating").value("半吉"))
                .andExpect(jsonPath("$.grids[4].number").value(40))
                .andExpect(jsonPath("$.grids[4].rating").value("凶"))
                .andExpect(jsonPath("$.threeTalents.title").value("木火水"))
                .andExpect(jsonPath("$.threeTalents.rating").value("凶"));
    }

    @Test
    void convertsSimplifiedCharactersAndCalculatesTheVerifiedSixGridCase() throws Exception {
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"欧阳","givenName":"子涵","school":"liuge"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name.surname").value("歐陽"))
                .andExpect(jsonPath("$.characters[0].simplified").value("欧"))
                .andExpect(jsonPath("$.characters[0].traditional").value("歐"))
                .andExpect(jsonPath("$.grids", hasSize(6)))
                .andExpect(jsonPath("$.characters[1].calculationStrokes").value(17))
                .andExpect(jsonPath("$.grids[0].number").value(32))
                .andExpect(jsonPath("$.grids[0].rating").value("吉"))
                .andExpect(jsonPath("$.grids[1].number").value(20))
                .andExpect(jsonPath("$.grids[2].number").value(15))
                .andExpect(jsonPath("$.grids[3].number").value(27))
                .andExpect(jsonPath("$.grids[4].number").value(47))
                .andExpect(jsonPath("$.grids[5].number").value(29))
                .andExpect(jsonPath("$.threeTalents.title").value("木水土"))
                .andExpect(jsonPath("$.threeTalents.rating").value("【凶多于吉】"))
                .andExpect(jsonPath("$.score").value(56))
                .andExpect(jsonPath("$.totalGridDescription.summary")
                        .value("（点石成金）花开之象，万事如意，祯祥吉庆，天赋幸福。"))
                .andExpect(jsonPath("$.totalGridDescription.detail").value(containsString("基业：")));
    }

    @Test
    void returns422WhenTheOfficialDictionaryDoesNotContainACharacter() throws Exception {
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"㐀","givenName":"明","school":"wuge"}
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("XINGMING_DATA_UNAVAILABLE"))
                .andExpect(jsonPath("$.errors[0].field").value("surname"));
    }

    @Test
    @Transactional
    void returns500WhenARequiredNumberInterpretationIsMissing() throws Exception {
        jdbc.update("DELETE FROM yp_81 WHERE num = 8");
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"李","givenName":"明","school":"wuge"}
                                """))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("XINGMING_DATA_INTEGRITY_ERROR"));
    }

    @Test
    @Transactional
    void returns500WhenARequiredThreeTalentsEntryIsMissing() throws Exception {
        jdbc.update("DELETE FROM yp_sancai WHERE title = '金土水'");
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"李","givenName":"明","school":"wuge"}
                                """))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("XINGMING_DATA_INTEGRITY_ERROR"));
    }

    @Test
    void validatesSchoolAndSixGridNameLength() throws Exception {
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"李","givenName":"明明明","school":"liuge"}
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].field").value("givenName"));
    }

    @Test
    void preservesRawGridNumberAndCyclesInterpretationAbove81() throws Exception {
        mockMvc.perform(post("/internal/v1/xingming/chart")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"surname":"龘","givenName":"龘","school":"wuge"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grids[4].number").value(96))
                .andExpect(jsonPath("$.grids[4].interpretationNumber").value(15))
                .andExpect(jsonPath("$.grids[4].interpretation.number").value(15));
    }
}
