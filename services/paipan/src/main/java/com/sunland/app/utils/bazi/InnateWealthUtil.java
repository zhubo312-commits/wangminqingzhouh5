package com.sunland.app.utils.bazi;

import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.sunland.app.utils.ScoreUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author: xk 先天财富
 * @create: 2023-08-16 10:35
 **/
public class InnateWealthUtil {

    /**
     * 先天财富
     * @param lunar
     * @return
     */
    public static String getInnateWealth(Lunar lunar) {
        EightChar eightChar = lunar.getEightChar();
        List<String> ganShiShenList = new ArrayList<>();
        ganShiShenList.add(eightChar.getYearShiShenGan());
        ganShiShenList.add(eightChar.getMonthShiShenGan());
        ganShiShenList.add(eightChar.getDayShiShenGan());
        ganShiShenList.add(eightChar.getTimeShiShenGan());

        List<String> zhiShiShenList = new ArrayList<>();
        zhiShiShenList.addAll(eightChar.getYearShiShenZhi());
        zhiShiShenList.addAll(eightChar.getMonthShiShenZhi());
        zhiShiShenList.addAll(eightChar.getDayShiShenZhi());
        zhiShiShenList.addAll(eightChar.getTimeShiShenZhi());

        List<String> zhiList = new ArrayList<>();
        zhiList.add(eightChar.getYearZhi());
        zhiList.add(eightChar.getMonthZhi());
        zhiList.add(eightChar.getDayZhi());
        zhiList.add(eightChar.getTimeZhi());

        StringBuilder result = new StringBuilder();

        if (ganShiShenList.contains("正财") && zhiShiShenList.contains("正财")) {
            result.append("正财星透干通根，");
        }

        if (ganShiShenList.contains("偏财") && zhiShiShenList.contains("偏财")) {
            result.append("偏财星透干通根，");
        }

        if (zhiList.contains(DAY_GAN_CAIKU.get(eightChar.getDayGan()))) {
            result.append("八字自带财库，");
        }

        if (result.length() > 0) {
            result.append("为财旺");
            return result.toString();
        } else {
            return "八字属于财弱";
        }


    }

    /**
     * 先天财富简评
     * @param lunar
     * @return
     */

    public static String getInnateWealthDesc(Lunar lunar) {
        String wealthAnalysisResult = getInnateWealth(lunar);
        int strongWeakScore = ScoreUtil.getStrongWeakScore(lunar);

        if (strongWeakScore >= 50 && wealthAnalysisResult.contains("财旺")) {
            return "有欲望，能拿的起，可以发大财";
        }

        if (strongWeakScore >= 50 && wealthAnalysisResult.contains("财弱")) {
            return "无欲望，碰到特殊的流年才能发小财";
        }

        if (strongWeakScore < 50 && wealthAnalysisResult.contains("财旺")) {
            return "有欲望，发大财的时候，会为其所累";
        }

        if (strongWeakScore < 50 && wealthAnalysisResult.contains("财弱")) {
            return "无欲望，一生顺遂，看淡了反而某些年份发小财";
        }
        return "";
    }

    /**
     * 日元天干对应的财库
     */
    public static final Map<String, String> DAY_GAN_CAIKU  = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲", "戌");
            this.put("乙", "戌");
            this.put("丙", "丑");
            this.put("丁", "丑");
            this.put("戊", "辰");
            this.put("己", "辰");
            this.put("庚", "未");
            this.put("辛", "未");
            this.put("壬", "戌");
            this.put("癸", "戌");

        }
    };


}
