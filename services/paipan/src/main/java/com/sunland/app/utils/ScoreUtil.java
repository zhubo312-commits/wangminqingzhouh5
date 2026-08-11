package com.sunland.app.utils;

import com.alibaba.fastjson.JSONObject;
import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.util.LunarUtil;
import com.sunland.app.domain.TitleContent;
import com.sunland.common.utils.DateUtils;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * @author: xk
 * @create: 2023-06-15 14:02
 **/
public class ScoreUtil {

    public static void main(String[] args) {
        String birthDay = "1996-10-26 12:22:23";
        Date date = DateUtils.strToDate(birthDay,DateUtils.YYYY_MM_DD_HH_MM_SS);
        System.out.println(getTodayLuck(date,DateUtils.getToday()));
     }


        public static JSONObject getTodayLuck(Date birthDay,String nowDay) {
        Lunar ldate = Lunar.fromDate(birthDay);// 阴历
        Date date = DateUtils.strToDate(nowDay,DateUtils.YYYY_MM_DD);
        Lunar nowDate = Lunar.fromDate(date); // 流日阴历
        String dayGan = ldate.getDayGan();// 日柱天干
        String nowDayGan = nowDate.getDayGan();// 流日天干
        String nowDayZhi = nowDate.getDayZhi();// 流日地支

        String shiShenDesc = getShiShenZhi(dayGan, nowDayZhi);// 地支十神
        JSONObject jsonObject = new JSONObject();
        // 分数
        int base = 50;// 基础分
        Integer strongWeakScore = getStrongWeakScore(ldate);
        int score = base + Math.round(Math.abs(50 - Math.abs(strongWeakScore -50)) * 0.6f)
                + getShiShenGanScore(dayGan, nowDayGan)
                + getShiShenZhiScore(dayGan, nowDayZhi);
        String category = getCategory(score);//总评价
        jsonObject.put("strongWeakScore",strongWeakScore);// 身强身弱分数
        jsonObject.put("score",score);// 十神分数
        jsonObject.put("shiShen",shiShenDesc);// 十神
        jsonObject.put("shiShenDesc",ScoreUtil.SHI_SHEN_DESC.get(shiShenDesc));// 十神
        jsonObject.put("dayPositionCaiDesc",nowDate.getDayPositionCaiDesc());// 财神方位
        jsonObject.put("taoHua",ScoreUtil.TAO_HUA.get(nowDate.getYearShengXiao()));// 桃花方位
        jsonObject.put("category",category);// 总评价
        jsonObject.put("categoryDesc",ScoreUtil.CATEGORY_DESC.get(category));// 解释

        return jsonObject;
    }

    /**
     * 九龙身强身弱分数
     * 日柱天干和其他7个天干五行进行对比,生日柱天干五行和日柱天干五行相同的加分
     * @return
     */
    public static Integer getStrongWeakScore(Lunar ldate) {
        EightChar eightChar = ldate.getEightChar();
        String yearGanWx = eightChar.getYearWuXing().substring(0,1);
        String yearZhiWx = eightChar.getYearWuXing().substring(1,2);
        String monthGanWx = eightChar.getMonthWuXing().substring(0,1);
        String monthZhiWx = eightChar.getMonthWuXing().substring(1,2);
        String dayGanWx = eightChar.getDayWuXing().substring(0,1);
        String dayZhiWx = eightChar.getDayWuXing().substring(1,2);
        String timeGanWx = eightChar.getTimeWuXing().substring(0,1);
        String timeZhiWx = eightChar.getTimeWuXing().substring(1,2);
        // 生他的和相同的五行
        Integer score = 0;

        if (dayGanWx.equals(dayZhiWx) || getGeneratingElements(dayGanWx, dayZhiWx)) {
            score = score + 12;
        }

        if (dayGanWx.equals(yearGanWx) || getGeneratingElements(dayGanWx, yearGanWx)) {
            score = score + 8;
        }

        if (dayGanWx.equals(yearZhiWx) || getGeneratingElements(dayGanWx, yearZhiWx)) {
            score = score + 4;
        }

        if (dayGanWx.equals(monthGanWx) || getGeneratingElements(dayGanWx, monthGanWx)) {
            score = score + 12;
        }

        if (dayGanWx.equals(monthZhiWx) || getGeneratingElements(dayGanWx, monthZhiWx)) {
            score = score + 40;
        }

        if (dayGanWx.equals(timeGanWx) || getGeneratingElements(dayGanWx, timeGanWx)) {
            score = score + 12;
        }

        if (dayGanWx.equals(timeZhiWx) || getGeneratingElements(dayGanWx, timeZhiWx)) {
            score = score + 12;
        }
        return score;
    }

    /**
     *  获取生自己的五行
     * @param dayGanWx
     * @param targetElement
     * @return
     */
    public static boolean getGeneratingElements(String dayGanWx, String targetElement) {
        return WuXingUtil.getShengWo(dayGanWx).equals(targetElement);
    }

    /**
     * 获取评分
     * @param score
     * @return
     */
    public static String getCategory(int score) {
        if (score >= 80) {
            return "上上";
        } else if (score >= 71) {
            return "中上";
        } else if (score >= 61) {
            return "中中";
        } else if (score >= 50) {
            return "中下";
        } else {
            return "未知"; // Handle scores below 50 if needed
        }
    }

    /**
     * 流日天干十神
     *
     * 生日日柱天干加流日天干获取十神
     */
    public static String getShiShenGan(String dayGan,String nowDayGan) {
        return LunarUtil.SHI_SHEN.get(dayGan + nowDayGan);
    }

    /**
     * 流日天干十神的分数
     */
    public static Integer getShiShenGanScore(String dayGan,String nowDayGan) {
        return ScoreUtil.SHI_SHEN_SCORE.get(getShiShenGan(dayGan,nowDayGan));
    }

    /**
     * 流年地支十神
     * 生日日柱天干加流日地支获取十神
     */
    public static String getShiShenZhi(String dayGan,String nowDayZhi) {
        return ScoreUtil.SHI_SHEN_ZHI.get(dayGan + nowDayZhi);
    }

    /**
     * 流年地支十神的分数
     */
    public static Integer getShiShenZhiScore(String dayGan,String nowDayZhi) {
        return ScoreUtil.SHI_SHEN_SCORE.get(getShiShenZhi(dayGan , nowDayZhi));
    }



    public static final Map<String, String> CATEGORY_DESC = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;{
            this.put("中下", "今日综合运势较为普通，也许不是什么大事儿，也掀不起多大风浪，但总归是对你的生活带来一些变化波动，或多或少会让你有些异样感觉，需要加以克服。");
            this.put("中中", "今日综合运势大致如常，许多事情会暴露出一些问题，一些之前就存在的问题容易重复出现，心里承受的压力可能会比平常大；");
            this.put("中上", "今日综合运势大体平顺，需要你操心的事情不少，先完成最重要、最紧急的事情为好，事情的进展有些可以放慢脚步，着急不解决问题有些事还是顺其自然的好，不过好在很多都逐渐向较为积极的方向发展。");
            this.put("上上", "今日综合运势很好，各项状况都有抬头的趋势，整体正在慢慢向好的方向发展。要保持现阶段自己的良好状态，有条理地完成手中的各项任务，有一个乐观向上的好心情，相信遇到的问题都能够迎刃而解.");
        }
    };

    public static final Map<String, String> SHI_SHEN_DESC = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;{
            this.put("正印", "通常意味着今天在学业文凭、艺术等事情上会有进展；而与长辈师长、母亲、女婿等关系上，需多加留意");
            this.put("偏印", "通常意味着今日事项上，适合在发明、设计、创造、科技、武术、演艺、行销、直销、广告、模特儿等专门性行业发力；人际关系上，与长辈、贵人、母亲的沟通，需处理好，避免过度敏感");
            this.put("正官", "通常意味着今日需要在职位名誉、权力事业、上司关系处理上，多多留意");
            this.put("七杀", "通常在事项上，与武职、军衔、诉讼、建筑等有关，如有涉及，勇于执行，会有不错的进展；人际处事上，要注意戒急戒躁，避免树敌");
            this.put("正财", "通常意味着如果正涉足杂货、百货、批发零售、药商等领域，会有稳定等收入和进展");
            this.put("偏财", "通常通常与商业、企业、投资和投机生意、金融、信息咨询等事项有关，以上领域可能会有意外之财；与父辈的关系今天可以稍加留意");
            this.put("食神", "通常意味着今日适合开业、迁居，个人职业会有明显进展；而与下属晚辈的关系需加留意");
            this.put("伤官", "通常在职业上，与文学、书画、艺术等职业有关，这些领域的今日能量会增强；需要控制好自己的欲望与脾气，下属晚辈的关系会有进展，谨记得理饶人");
            this.put("比肩", "通常意味着今天在直销，开矿者，运动员，流动行业，机械运动，中介等行业，需要主意；个人健康方面，调整好心态，凡事尽量少生气；在兄弟姐妹、同事、朋友近邻等关系上，不轻易变动");
            this.put("劫财", "通常意味事业上，如果是自由业、服务业、直销、投资、贸易等流动行业，事情需要留意；在物像上，多与肢体、使用器具相关；在人际交往上、朋友同辈、兄弟姐妹等有关");
        }
    };

    public static final Map<String, String> TAO_HUA = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;{
            this.put("猴", "正西");
            this.put("鼠", "正西");
            this.put("龙", "正西");
            this.put("蛇", "正南");
            this.put("鸡", "正南");
            this.put("牛", "正南");
            this.put("虎", "正东");
            this.put("马", "正东");
            this.put("狗", "正东");
            this.put("猪", "正北");
            this.put("兔", "正北");
            this.put("羊", "正北");
        }
    };

    public static final Map<String, String> SHI_SHEN_ZHI = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {

            this.put("甲子", "正印");
            this.put("乙子", "偏印");
            this.put("丙子", "正官");
            this.put("丁子", "七杀");
            this.put("戊子", "正财");
            this.put("己子", "偏财");
            this.put("庚子", "伤官");
            this.put("辛子", "食神");
            this.put("壬子", "劫财");
            this.put("癸子", "比肩");

            this.put("甲丑", "正财");
            this.put("乙丑", "偏财");
            this.put("丙丑", "伤官");
            this.put("丁丑", "食神");
            this.put("戊丑", "劫财");
            this.put("己丑", "比肩");
            this.put("庚丑", "正印");
            this.put("辛丑", "偏印");
            this.put("壬丑", "正官");
            this.put("癸丑", "七杀");

            this.put("甲寅", "比肩");
            this.put("乙寅", "劫财");
            this.put("丙寅", "偏印");
            this.put("丁寅", "正印");
            this.put("戊寅", "七杀");
            this.put("己寅", "正官");
            this.put("庚寅", "偏财");
            this.put("辛寅", "正财");
            this.put("壬寅", "食神");
            this.put("癸寅", "伤官");

            this.put("甲卯", "劫财");
            this.put("乙卯", "比肩");
            this.put("丙卯", "正印");
            this.put("丁卯", "偏印");
            this.put("戊卯", "正官");
            this.put("己卯", "七杀");
            this.put("庚卯", "正财");
            this.put("辛卯", "偏财");
            this.put("壬卯", "伤官");
            this.put("癸卯", "食神");

            this.put("甲辰", "偏财");
            this.put("乙辰", "正财");
            this.put("丙辰", "食神");
            this.put("丁辰", "伤官");
            this.put("戊辰", "比肩");
            this.put("己辰", "劫财");
            this.put("庚辰", "偏印");
            this.put("辛辰", "正印");
            this.put("壬辰", "七杀");
            this.put("癸辰", "正官");

            this.put("甲巳", "伤官");
            this.put("乙巳", "食神");
            this.put("丙巳", "劫财");
            this.put("丁巳", "比肩");
            this.put("戊巳", "正印");
            this.put("己巳", "偏印");
            this.put("庚巳", "正官");
            this.put("辛巳", "七杀");
            this.put("壬巳", "正财");
            this.put("癸巳", "偏财");

            this.put("甲午", "食神");
            this.put("乙午", "伤官");
            this.put("丙午", "比肩");
            this.put("丁午", "劫财");
            this.put("戊午", "偏印");
            this.put("己午", "正印");
            this.put("庚午", "七杀");
            this.put("辛午", "正官");
            this.put("壬午", "偏财");
            this.put("癸午", "正财");

            this.put("甲未", "正财");
            this.put("乙未", "偏财");
            this.put("丙未", "伤官");
            this.put("丁未", "食神");
            this.put("戊未", "劫财");
            this.put("己未", "比肩");
            this.put("庚未", "正印");
            this.put("辛未", "偏印");
            this.put("壬未", "正官");
            this.put("癸未", "七杀");

            this.put("甲申", "七杀");
            this.put("乙申", "正官");
            this.put("丙申", "偏财");
            this.put("丁申", "正财");
            this.put("戊申", "食神");
            this.put("己申", "伤官");
            this.put("庚申", "劫财");
            this.put("辛申", "偏印");
            this.put("壬申", "正印");
            this.put("癸申", "比肩");

            this.put("甲酉", "正官");
            this.put("乙酉", "七杀");
            this.put("丙酉", "正财");
            this.put("丁酉", "偏财");
            this.put("戊酉", "伤官");
            this.put("己酉", "食神");
            this.put("庚酉", "劫财");
            this.put("辛酉", "比肩");
            this.put("壬酉", "正印");
            this.put("癸酉", "偏印");

            this.put("甲戌", "偏财");
            this.put("乙戌", "正财");
            this.put("丙戌", "食神");
            this.put("丁戌", "伤官");
            this.put("戊戌", "比肩");
            this.put("己戌", "劫财");
            this.put("庚戌", "偏印");
            this.put("辛戌", "正印");
            this.put("壬戌", "七杀");
            this.put("癸戌", "正官");

            this.put("甲亥", "偏印");
            this.put("乙亥", "正印");
            this.put("丙亥", "七杀");
            this.put("丁亥", "正官");
            this.put("戊亥", "偏财");
            this.put("己亥", "正财");
            this.put("庚亥", "食神");
            this.put("辛亥", "伤官");
            this.put("壬亥", "比肩");
            this.put("癸亥", "劫财");

        }
    };

    public static final Map<String, Integer> SHI_SHEN_SCORE = new HashMap<String, Integer>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("正印", 6);
            this.put("偏印", 4);
            this.put("正官", 8);
            this.put("七杀", 2);
            this.put("正财", 9);
            this.put("偏财", 5);
            this.put("食神", 7);
            this.put("伤官", 3);
            this.put("比肩", 5);
            this.put("劫财", 1);
        }

    };

    /**
     * 穿衣宜
     */
    public static final Map<String, TitleContent> DRESS_YI = new HashMap<String, TitleContent>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("金", new TitleContent("宜：今日“贵人色”为蓝色、灰色和黑色系", "该色系与今日五行相生，身着此色能够增强环境磁场能量，提高你遇见贵人、获得帮扶的机会","black"));
            this.put("水", new TitleContent("宜：今日“贵人色”为绿色、青色和翠色等色系", "该色系与今日五行相生，身着此色能够增强环境磁场能量，提高你遇见贵人、获得帮扶的机会","green"));
            this.put("木", new TitleContent("宜：今日“贵人色”为红色、粉色、橙色和紫色等色系", "该色系与今日五行相生，身着此色能够增强环境磁场能量，提高你遇见贵人、获得帮扶的机会","red"));
            this.put("火", new TitleContent("宜：今日“贵人色”为黄色、咖啡色、棕色和卡其色等褐色系", "该色系与今日五行相生，身着此色能够增强环境磁场能量，提高你遇见贵人、获得帮扶的机会","yellow"));
            this.put("土", new TitleContent("宜：今日“贵人色”为白色、乳白色和银色等色系", "该色系与今日五行相生，身着此色能够增强环境磁场能量，提高你遇见贵人、获得帮扶的机会","white"));

        }

    };

    /**
     * 穿衣忌
     */
    public static final Map<String, TitleContent> DRESS_JI = new HashMap<String, TitleContent>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("金", new TitleContent("忌：今日“不利色”为绿色、青色和翠色等色系", "身着该色系，则意味着你会被今日等大环境所克，容易导致做事成功率下降、运势走低，更容易发生徒劳无功之类的事情","green"));
            this.put("水", new TitleContent("忌：今日“不利色”为红色、粉色、橙色和紫色等色系", "身着该色系，则意味着你会被今日等大环境所克，容易导致做事成功率下降、运势走低，更容易发生徒劳无功之类的事情","red"));
            this.put("木", new TitleContent("忌：今日“不利色”为黄色、咖啡色、棕色和卡其色等褐色系", "身着该色系，则意味着你会被今日等大环境所克，容易导致做事成功率下降、运势走低，更容易发生徒劳无功之类的事情","yellow"));
            this.put("火", new TitleContent("忌：今日“不利色”为白色、乳白色和银色等色系", "身着该色系，则意味着你会被今日等大环境所克，容易导致做事成功率下降、运势走低，更容易发生徒劳无功之类的事情","white"));
            this.put("土", new TitleContent("忌：今日“不利色”为蓝色、灰色和黑色系", "身着该色系，则意味着你会被今日等大环境所克，容易导致做事成功率下降、运势走低，更容易发生徒劳无功之类的事情","black"));

        }

    };
}