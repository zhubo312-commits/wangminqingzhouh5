package com.sunland.app.domain.bazi;

import com.nlf.calendar.Lunar;
import com.sunland.app.utils.WuXingUtil;
import com.sunland.app.utils.bazi.BaZiUtil;
import lombok.Data;

import java.util.*;

/**
 * @author: xk
 * @create: 2024-04-11 10:19
 * @des 广元身强身弱
 **/
@Data
public class GuangYuanShenQiangShenRuo {
    // 伤食得分
    private int shangShi;
    // 印枭得分
    private int yinXiao;
    // 财才得分
    private int caiCai;
    // 官杀得分
    private int guanSha;
    // 劫比得分
    private int jieBi;
    // 同党关系得分
    private int tongDangScore;
    // 异党关系得分
    private int yiDangScore;
    // 旺弱层次描述
    private String wangRuoCengCi;
    // 格局特点描述
    private String geJu;
    // 命理分析或断语
    private String duanYu;
    // 定喜神
    private String dingXiShen;
    // 喜神化五行
    private List<String> huaWuXing;
    public GuangYuanShenQiangShenRuo(String yearGanWuXing, String monthGanWuXing, String dayGanWuXing, String timeGanWuXing, String yearCangGanWx, String monthCangGanWx, String dayCangGanWx, String timeCangGanWx, String dayGanShiShen, String dayGan, Lunar ldate) {
        // 年干
        calculateScores(yearGanWuXing, dayGanWuXing, 40);
        // 月干
        calculateScores(monthGanWuXing, dayGanWuXing, 40);
        // 日干
        calculateScores(dayGanWuXing, dayGanWuXing, 40);
        // 时干
        calculateScores(timeGanWuXing, dayGanWuXing, 40);
        // 年藏干
        processCangGanWx(yearCangGanWx, dayGanWuXing);
        // 月藏干
        processMonthCangGanWx(monthCangGanWx,dayGanWuXing);
        // 日藏干
        processCangGanWx(dayCangGanWx, dayGanWuXing);
        // 时藏干
        processCangGanWx(timeCangGanWx, dayGanWuXing);
        //判断旺弱层次
        tongDangScore = yinXiao+jieBi;
        yiDangScore = caiCai+shangShi+guanSha;
        wangRuoCengCi = determineStrengthBasedOnTongDangScore(tongDangScore);
        // 判断格局
        geJu = calculateGeJu();
        // 下断语
        duanYu = String.format("此命主乾造%s，%s日主，%s。", dayGanShiShen, dayGan+dayGanWuXing, wangRuoCengCi);
        // 定喜神
        dingXiShen =  BaZiUtil.GUANG_YUAN_BAZI_XI_SHEN.get(this.geJu);
        // 喜神化五行
        huaWuXing = calhuaWuXing(this.geJu,dayGanWuXing);
    }

    /**
     * 我生 → 食伤
     * 生我 → 印枭
     * 我克 → 财才
     * 克我 → 官杀
     * 同我 → 劫比
     * 喜神化五行
     *
     * @param geJu
     * @param dayGanWuXing
     * @return
     */
    private List<String> calhuaWuXing(String geJu, String dayGanWuXing) {
        ArrayList<String> huaWuXing = new ArrayList<>();  // 创建一个用于存储五行信息的列表

        switch (geJu) {
            // 偏旺格 - 当印枭或劫比主导时，五行关系为：我生、我克、生我
            case "扶抑格，印枭主导的偏旺格。":
                huaWuXing.add(WuXingUtil.getWoKe(dayGanWuXing));  // 我克 → 财才
                huaWuXing.add(WuXingUtil.getWoSheng(dayGanWuXing));  // 我生 → 食伤
                huaWuXing.add(WuXingUtil.getKeWo(dayGanWuXing));     // 克我 → 官杀
                break;
            case "扶抑格，劫比主导的偏旺格。":
                huaWuXing.add(WuXingUtil.getWoSheng(dayGanWuXing));  // 我生 → 食伤
                huaWuXing.add(WuXingUtil.getWoKe(dayGanWuXing));  // 我克 → 财才
                huaWuXing.add(WuXingUtil.getKeWo(dayGanWuXing));     // 克我 → 官杀
                break;

            // 偏弱格 - 不同的主导五行关系，使用不同的顺序
            case "扶抑格，官杀主导的偏弱格。":
                huaWuXing.add(WuXingUtil.getShengWo(dayGanWuXing));  // 生我 → 印枭
                huaWuXing.add(dayGanWuXing);     // 同我 → 劫比
                break;
            case "扶抑格，财才主导的偏弱格。":
                huaWuXing.add(dayGanWuXing);  // 同我 → 劫比
                huaWuXing.add(WuXingUtil.getShengWo(dayGanWuXing));  // 生我 → 印枭
                break;
            case "扶抑格，食伤主导的偏弱格。":
                huaWuXing.add(WuXingUtil.getShengWo(dayGanWuXing));  // 生我 → 印枭
                huaWuXing.add(dayGanWuXing);     // 同我 → 劫比
                break;

            // 从旺格 - 印枭或劫比主导时，五行关系与偏旺格相似
            case "从格，印枭主导的从旺格。":
                huaWuXing.add(WuXingUtil.getShengWo(dayGanWuXing));  // 生我 → 印枭
                huaWuXing.add(dayGanWuXing);     // 同我 → 劫比
                break;
            case "从格，劫比主导的从旺格。":
                huaWuXing.add(dayGanWuXing);  // 同我 → 劫比
                huaWuXing.add(WuXingUtil.getShengWo(dayGanWuXing));  // 生我 → 印枭
                break;

            // 从弱格 - 主导五行关系会影响五行排序
            case "从格，官杀主导的从弱格。":
                huaWuXing.add(WuXingUtil.getKeWo(dayGanWuXing));   // 克我 → 官杀
                huaWuXing.add(WuXingUtil.getWoKe(dayGanWuXing)); // 我克 → 财才
                huaWuXing.add(WuXingUtil.getWoSheng(dayGanWuXing)); // 我生 → 食伤
                break;
            case "从格，财才主导的从弱格。":
                huaWuXing.add(WuXingUtil.getWoKe(dayGanWuXing)); // 我克 → 财才
                huaWuXing.add(WuXingUtil.getWoSheng(dayGanWuXing)); // 我生 → 食伤
                huaWuXing.add(WuXingUtil.getKeWo(dayGanWuXing));   // 克我 → 官杀
                break;
            case "从格，食伤主导的从弱格。":
                huaWuXing.add(WuXingUtil.getWoSheng(dayGanWuXing)); // 我生 → 食伤
                huaWuXing.add(WuXingUtil.getKeWo(dayGanWuXing));   // 克我 → 官杀
                huaWuXing.add(WuXingUtil.getWoKe(dayGanWuXing)); // 我克 → 财才
                break;

            default:
                break; // 如果 geJu 没有匹配项，什么都不做
        }

        return huaWuXing;  // 返回包含五行信息的列表
    }


    /**
     * 判断格局
     * @return
     */
    private String calculateGeJu() {
        String strengthCategory;
        if (tongDangScore >= 40 && tongDangScore < 80) {
            strengthCategory = "从弱";
        } else if (tongDangScore >= 80 && tongDangScore < 305) {
            strengthCategory = "偏弱";
        } else if (tongDangScore >= 305 && tongDangScore < 570) {
            strengthCategory = "偏旺";
        } else if (tongDangScore >= 570 && tongDangScore <= 610) {
            strengthCategory = "从旺";
        } else {
            return "Invalid score";
        }
        String dominantCangGan = calculateDominantCangGan(shangShi, yinXiao, guanSha, jieBi, caiCai,strengthCategory);
        String patternType;
        if (strengthCategory.equals("偏弱")||strengthCategory.equals("偏旺")) {
            patternType = "扶抑格";
        }else {
            patternType = "从格";
        }

        return String.format("%s，%s主导的%s格。", patternType, dominantCangGan, strengthCategory);
    }

    /**
     * 计算格局主导
     * @param shangShi
     * @param yinXiao
     * @param guanSha
     * @param jieBi
     * @param caiCai
     * @param strengthCategory
     * @return
     */
    private String calculateDominantCangGan(int shangShi, int yinXiao, int guanSha, int jieBi, int caiCai, String strengthCategory) {
        // 定义两个映射
        Map<String, Integer> cangGanScores1 = new HashMap<>();
        cangGanScores1.put("印枭", yinXiao);
        cangGanScores1.put("劫比", jieBi);

        Map<String, Integer> cangGanScores2 = new HashMap<>();
        cangGanScores2.put("官杀", guanSha);
        cangGanScores2.put("食伤", shangShi);
        cangGanScores2.put("财才", caiCai);

        // 动态选择分数组
        Map<String, Integer> cangGanScores = null;
        int maxScore = 0;

        // 根据 strengthCategory 的不同值进行不同的处理
        if ("从弱".equals(strengthCategory) || "偏弱".equals(strengthCategory)) {
            maxScore = Math.max(shangShi, Math.max(guanSha, caiCai));
            cangGanScores = cangGanScores2;
        } else if ("偏旺".equals(strengthCategory) || "从旺".equals(strengthCategory)) {
            maxScore = Math.max(yinXiao, jieBi);
            cangGanScores = cangGanScores1;
        }
        // 遍历选择分数组，找到对应的最大值
        for (Map.Entry<String, Integer> entry : cangGanScores.entrySet()) {
            if (entry.getValue() == maxScore) {
                return entry.getKey();
            }
        }
        return null;
    }


    /**
     * 计算分数
     * @param ganWuXing
     * @param dayGanWuXing
     * @param score
     */
    private void calculateScores(String ganWuXing, String dayGanWuXing, int score) {
        String relationship = WuXingUtil.getRelationship(dayGanWuXing, ganWuXing);
        switch (relationship) {
            case "我生":
                shangShi += score;
                break;
            case "生我":
                yinXiao += score;
                break;
            case "我克":
                caiCai += score;
                break;
            case "克我":
                guanSha += score;
                break;
            case "同我":
                jieBi += score;
                break;
            default:
                break;
        }
    }

    /**
     * 计算年日时藏干分数
     * @param cangGanWx
     * @param dayGanWuXing
     */
    private void processCangGanWx(String cangGanWx, String dayGanWuXing) {
        List<String> cangGanWxList = Arrays.asList(cangGanWx.split(","));
        int size = cangGanWxList.size();
        switch (size) {
            case 1:
                calculateScores(cangGanWxList.get(0), dayGanWuXing, 100);
                break;
            case 2:
                calculateScores(cangGanWxList.get(0), dayGanWuXing, 70);
                calculateScores(cangGanWxList.get(1), dayGanWuXing, 30);
                break;
            case 3:
                calculateScores(cangGanWxList.get(0), dayGanWuXing, 70);
                calculateScores(cangGanWxList.get(1), dayGanWuXing, 20);
                calculateScores(cangGanWxList.get(2), dayGanWuXing, 10);
                break;
            default:
                break;
        }
    }

    /**
     * 计算月藏干分数
     * @param cangGanWx
     * @param dayGanWuXing
     */
    private void processMonthCangGanWx(String cangGanWx, String dayGanWuXing) {
        List<String> cangGanWxList = Arrays.asList(cangGanWx.split(","));
        int size = cangGanWxList.size();
        switch (size) {
            case 1:
                calculateScores(cangGanWxList.get(0), dayGanWuXing, 150);
                break;
            case 2:
                calculateScores(cangGanWxList.get(0), dayGanWuXing, 105);
                calculateScores(cangGanWxList.get(1), dayGanWuXing, 45);
                break;
            case 3:
                calculateScores(cangGanWxList.get(0), dayGanWuXing, 105);
                calculateScores(cangGanWxList.get(1), dayGanWuXing, 30);
                calculateScores(cangGanWxList.get(2), dayGanWuXing, 15);
                break;
            default:
                break;
        }
    }

    /**
     * 判断旺弱层次
     * @param tongDangScore
     * @return
     */
    public String determineStrengthBasedOnTongDangScore(int tongDangScore) {
        if (tongDangScore >= 40 && tongDangScore < 80) {
            return "日主弱极，从弱";
        } else if (tongDangScore >= 80 && tongDangScore < 180) {
            return "日主较弱，身弱";
        } else if (tongDangScore >= 180 && tongDangScore < 305) {
            return "日主偏弱，身弱";
        } else if (tongDangScore >= 305 && tongDangScore < 440) {
            return "日主偏旺，身强";
        } else if (tongDangScore >= 445 && tongDangScore < 570) {
            return "日主较旺，身强";
        } else if (tongDangScore >= 570 && tongDangScore <= 610) {
            return "日主旺极，从强";
        } else {
            return "Invalid score";
        }
    }

}
