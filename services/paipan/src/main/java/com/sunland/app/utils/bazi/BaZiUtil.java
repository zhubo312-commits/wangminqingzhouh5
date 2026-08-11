package com.sunland.app.utils.bazi;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author: xk
 * @create: 2025-01-02 13:59
 **/
public class BaZiUtil {
    public static final Map<String, String> WEN_CHANG_WEI = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲", "东南");
            this.put("乙", "南");
            this.put("丙", "西南");
            this.put("丁", "西");
            this.put("戊", "西南");
            this.put("己", "西");
            this.put("庚", "西北");
            this.put("辛", "北");
            this.put("壬", "东北");
            this.put("癸", "东");
        }

    };

    public static final Map<String, String> CANG_SHEN_DI_ZHI = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲", "亥");
            this.put("乙", "午");
            this.put("丙", "寅");
            this.put("丁", "酉");
            this.put("戊", "寅");
            this.put("己", "酉");
            this.put("庚", "巳");
            this.put("辛", "子");
            this.put("壬", "申");
            this.put("癸", "卯");
        }

    };

    public static final Map<String, Integer> TIAN_GAN_YIN_YANG = new HashMap<String, Integer>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲", 0);
            this.put("乙", 1);
            this.put("丙", 0);
            this.put("丁", 1);
            this.put("戊", 0);
            this.put("己", 1);
            this.put("庚", 0);
            this.put("辛", 1);
            this.put("壬", 0);
            this.put("癸", 1);
        }

    };


    public static final Map<String, String> CANG_GAN = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("子", "癸");
            this.put("丑", "己,癸,辛");
            this.put("寅", "甲,丙,戊");
            this.put("卯", "乙");
            this.put("辰", "戊,乙,癸");
            this.put("巳", "丙,戊,庚");
            this.put("午", "丁,己");
            this.put("未", "己,丁,乙");
            this.put("申", "庚,壬,戊");
            this.put("酉", "辛");
            this.put("戌", "戊,辛,丁");
            this.put("亥", "壬,甲");
        }

    };

    public static final Map<String, String> CANG_GAN_WX = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            put("子", "水");
            put("丑", "土,水,金");
            put("寅", "木,火,土");
            put("卯", "木");
            put("辰", "土,木,水");
            put("巳", "火,金,土");
            put("午", "火,土");
            put("未", "土,火,木");
            put("申", "金,水,土");
            put("酉", "金");
            put("戌", "土,金,火");
            put("亥", "水,木");
        }
    };


    public static List<String> dizhiNames = Arrays.asList("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥");
    // 本命菩萨
    public static List<String> benmingfoList = Arrays.asList("千手观音", "虚空藏菩萨", "虚空藏菩萨", "文殊菩萨", "普贤菩萨", "普贤菩萨", "大势至菩萨", "大日如来", "大日如来", "不动尊菩萨", "阿弥陀佛", "阿弥陀佛");
    // 生肖
    public static List<String> zodiacAnimals = Arrays.asList("鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪");
    // 方位
    public static List<String> directions = Arrays.asList("南", "东", "北", "西");
    public static final String[] CHANG_SHENG = {
            "长生",  // 表示“长生”阶段
            "沐浴",  // 表示“沐浴”阶段
            "冠带",  // 表示“冠带”阶段
            "临官",  // 表示“临官”阶段
            "帝旺",  // 表示“帝旺”阶段
            "衰",    // 表示“衰”阶段
            "病",    // 表示“病”阶段
            "死",    // 表示“死”阶段
            "墓",    // 表示“墓”阶段
            "绝",    // 表示“绝”阶段
            "胎",    // 表示“胎”阶段
            "养"     // 表示“养”阶段
    };

    // 广元八字喜神
    public static final Map<String, String> GUANG_YUAN_BAZI_XI_SHEN = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            // 偏旺格
            put("扶抑格，印枭主导的偏旺格。", "首选财才，次选食伤，再次官杀。");
            put("扶抑格，劫比主导的偏旺格。", "首选食伤，次选财才，再次官杀。");

            // 偏弱格
            put("扶抑格，官杀主导的偏弱格。", "首选印枭，其次劫比。");
            put("扶抑格，财才主导的偏弱格。", "首选劫比，其次印枭。");
            put("扶抑格，食伤主导的偏弱格。", "首选印枭，其次劫比。");

            // 从旺格
            put("从格，印枭主导的从旺格。", "首选印枭，其次劫比。");
            put("从格，劫比主导的从旺格。", "首选劫比，其次印枭。");

            // 从弱格
            put("从格，官杀主导的从弱格。", "首用官杀，其次财才，再次食伤。");
            put("从格，财才主导的从弱格。", "首用财才，其次食伤，再次官杀。");
            put("从格，食伤主导的从弱格。", "首用食伤，其次官杀，再次财才。");
        }
    };


}
