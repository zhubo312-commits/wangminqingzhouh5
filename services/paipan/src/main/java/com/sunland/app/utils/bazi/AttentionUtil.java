package com.sunland.app.utils.bazi;

import com.sunland.common.utils.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author: xk 天干地支留意
 * @create: 2023-08-08 10:20
 **/
public class AttentionUtil {

    //天干关系
    public static final Map<String, String> TIAN_GAN_RELATION = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("甲己", "甲己合土");
            this.put("乙庚", "乙庚合金");
            this.put("丙辛", "丙辛合水");
            this.put("丁壬", "丁壬合木");
            this.put("戊癸", "戊癸合火");
            this.put("甲庚", "甲庚相冲");
            this.put("乙辛", "乙辛相冲");
            this.put("丙壬", "丙壬相冲");
            this.put("丁癸", "丁癸相冲");
        }
    };

    // 天干留意
    public static List<String> findTianGanMatchingRelations(List<String> gans) {
        List<String> matched = new ArrayList<>();

        for (String gan1 : gans) {
            for (String gan2 : gans) {
                String combination = gan1 + gan2;
                if (TIAN_GAN_RELATION.containsKey(combination)) {
                    matched.add(TIAN_GAN_RELATION.get(combination));
                }
            }
        }

        return matched.stream().distinct().collect(Collectors.toList());
    }
    //天干留意
    public static List<String> getTianGanAttention(String... gans) {
        List<String> ganList = Arrays.asList(gans);
        return findTianGanMatchingRelations(ganList);
    }

    public static List<String> getTianGanAttention(HashMap<String, List<String>> baZiMap,String gan) {
        List<String> ganList  = new ArrayList<>();
        for (List<String> values : baZiMap.values()) {
            ganList.add(BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_GAN.get(values.get(0)));
        }
        ganList.add(gan);
        return findTianGanMatchingRelations(ganList);
    }


    // 地支关系
    public static final Map<String, String> DI_ZHI_RELATION = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("亥子丑", "亥子丑三会水");
            this.put("寅卯辰", "寅卯辰三会木");
            this.put("巳午未", "巳午未三会火");
            this.put("申酉戌", "申酉戌三会金");
            this.put("申子辰", "申子辰三合水");
            this.put("寅午戌", "寅午戌三合火");
            this.put("亥卯未", "亥卯未三合木");
            this.put("巳酉丑", "巳酉丑三合金");
            this.put("申子", "申子半合水");
            this.put("子辰", "子辰半合水");
            this.put("午戌", "午戌半合火");
            this.put("亥卯", "亥卯半合木");
            this.put("卯未", "卯未半合木");
            this.put("酉丑", "酉丑半合金");
            this.put("寅午", "寅午半合火(暗合土)");
            this.put("巳酉", "巳酉半合金(暗合水)");
            this.put("子巳", "子巳暗合火");
            this.put("卯申", "卯申暗合金");
            this.put("亥午", "亥午暗合木");
            this.put("巳申", "巳申六合水(相破)");
            this.put("辰酉", "辰酉六合金");
            this.put("卯戌", "卯戌六合火");
            this.put("寅亥", "寅亥六合木(相破)");
            this.put("子丑", "子丑六合土");
            this.put("午未", "午未六合火或土");
            this.put("子卯", "子卯无礼相刑");
            this.put("丑未戌", "丑未戌恃势刑");
            this.put("寅巳申", "寅巳申无恩刑");
            this.put("辰辰", "辰辰自刑");
            this.put("午午", "午午自刑");
            this.put("酉酉", "酉酉自刑");
            this.put("亥亥", "亥亥自刑");
            this.put("辰辰辰", "辰辰自刑");
            this.put("午午午", "午午自刑");
            this.put("酉酉酉", "酉酉自刑");
            this.put("亥亥亥", "亥亥自刑");
            this.put("辰辰辰辰", "辰辰自刑");
            this.put("午午午午", "午午自刑");
            this.put("酉酉酉酉", "酉酉自刑");
            this.put("亥亥亥亥", "亥亥自刑");
            this.put("辰辰辰辰辰", "辰辰自刑");
            this.put("午午午午午", "午午自刑");
            this.put("酉酉酉酉酉", "酉酉自刑");
            this.put("亥亥亥亥亥", "亥亥自刑");
            this.put("子午", "子午相冲");
            this.put("卯酉", "卯酉相冲");
            this.put("寅申", "寅申相冲");
            this.put("巳亥", "巳亥相冲");
            this.put("辰戌", "辰戌相冲");
            this.put("丑未", "丑未相冲");
            this.put("子未", "子未相害");
            this.put("丑午", "丑午相害");
            this.put("寅巳", "寅巳相害");
            this.put("卯辰", "卯辰相害");
            this.put("申亥", "申亥相害");
            this.put("酉戌", "酉戌相害");
            this.put("子酉", "子酉相破");
            this.put("卯午", "卯午相破");
            this.put("辰丑", "辰丑相破");
            this.put("未戌", "未戌相破");
        }
    };

    // 地支留意
    public static List<String> findDiZhiMatchingRelations(HashMap<String, Integer> zhiCountMap) {
        List<String> matched = new ArrayList<>();

        for (String i : zhiCountMap.keySet()) {
            for (String j : zhiCountMap.keySet()) {
                for (String k : zhiCountMap.keySet()) {
                    if (!i.equals(j) && !j.equals(k) && !i.equals(k)) {
                        String v = DI_ZHI_RELATION.get(i + j);
                        if (v != null && !matched.contains(v)) {
                            matched.add(v);
                        }
                        v = DI_ZHI_RELATION.get(i + j + k);
                        if (v != null && !matched.contains(v)) {
                            matched.add(v);
                        }
                    }
                }
            }
        }

        for (String i : zhiCountMap.keySet()) {
            int n = zhiCountMap.get(i);
            ArrayList<String> vs = new ArrayList<>();
            for (int j = 0; j < n; j++) {
                vs.add(i);
            }
            String v = DI_ZHI_RELATION.get(String.join("", vs));
            if (v != null && !matched.contains(v)) {
                matched.add(v);
            }
        }
        return matched.stream().distinct().collect(Collectors.toList());
    }


    //   地支留意
    public static List<String> getDiZhiAttention(String... zhis) {
        HashMap<String, Integer> zhiCountMap = new HashMap<>();
        for (String zhi : zhis) {
            if (StringUtils.isNotEmpty(zhi)) {
                zhiCountMap.put(zhi, zhiCountMap.getOrDefault(zhi, 0) + 1);
            }
        }
        return findDiZhiMatchingRelations(zhiCountMap);
    }

    public static List<String> getDiZhiAttention(HashMap<String, List<String>> baZiMap,String zi) {
        HashMap<String, Integer> zhiCountMap = new HashMap<>();
        for (List<String> values : baZiMap.values()) {
            String zhi = BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_ZHI.get(values.get(1));
            if (StringUtils.isNotEmpty(zhi)) {
                zhiCountMap.put(zhi, zhiCountMap.getOrDefault(zhi, 0) + 1);
            }
        }
        zhiCountMap.put(zi, zhiCountMap.getOrDefault(zi, 0) + 1);
        return findDiZhiMatchingRelations(zhiCountMap);
    }


}
