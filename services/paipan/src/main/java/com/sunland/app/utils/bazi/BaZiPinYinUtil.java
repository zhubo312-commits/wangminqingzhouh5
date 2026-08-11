package com.sunland.app.utils.bazi;

import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.common.constant.Constants;
import com.sunland.common.utils.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author: xk
 * @create: 2023-12-18 17:17
 **/
public class BaZiPinYinUtil {

    public static final Map<String, String> CHINESE_CONVERT_PINYIN = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲", "jia");
            this.put("乙", "yi");
            this.put("丙", "bing");
            this.put("丁", "ding");
            this.put("戊", "wu");
            this.put("己", "ji");
            this.put("庚", "geng");
            this.put("辛", "xin");
            this.put("壬", "ren");
            this.put("癸", "gui");
            this.put("子", "zi");
            this.put("丑", "chou");
            this.put("寅", "yin");
            this.put("卯", "mao");
            this.put("辰", "chen");
            this.put("巳", "si");
            this.put("午", "wu");
            this.put("未", "wei");
            this.put("申", "shen");
            this.put("酉", "you");
            this.put("戌", "xu");
            this.put("亥", "hai");
        }

    };
    public static final Map<String, String> PINYIN_CONVERT_CHINESE_GAN = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("jia", "甲");
            this.put("yi", "乙");
            this.put("bing", "丙");
            this.put("ding", "丁");
            this.put("wu", "戊");
            this.put("ji", "己");
            this.put("geng", "庚");
            this.put("xin", "辛");
            this.put("ren", "壬");
            this.put("gui", "癸");
        }
    };

    public static final Map<String, String> PINYIN_CONVERT_CHINESE_ZHI = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("zi", "子");
            this.put("chou", "丑");
            this.put("yin", "寅");
            this.put("mao", "卯");
            this.put("chen", "辰");
            this.put("si", "巳");
            this.put("wu", "午");
            this.put("wei", "未");
            this.put("shen", "申");
            this.put("you", "酉");
            this.put("xu", "戌");
            this.put("hai", "亥");
        }
    };

    //八字转换拼音
    public static HashMap<String, List<String>> getBaZiPinYin(EightChar eightChar) {
        HashMap<String, List<String>> map = new HashMap<>();

        // For "nian"
        List<String> nianGanZhi = new ArrayList<>();
        nianGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getYearGan()));
        nianGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getYearZhi()));
        map.put(Constants.NIAN, nianGanZhi);

        // For "yue"
        List<String> yueGanZhi = new ArrayList<>();
        yueGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getMonthGan()));
        yueGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getMonthZhi()));
        map.put(Constants.YUE, yueGanZhi);

        // For "ri"
        List<String> riGanZhi = new ArrayList<>();
        riGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getDayGan()));
        riGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getDayZhi()));
        map.put(Constants.RI, riGanZhi);

        // For "shi"
        List<String> shiGanZhi = new ArrayList<>();
        shiGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getTimeGan()));
        shiGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getTimeZhi()));
        map.put(Constants.SHI, shiGanZhi);
        return map;
    }

    public static void main(String[] args) {
        Solar solar = new Solar(2023, 3, 14, 11, 2,0);
        Lunar lunar = solar.getLunar();
        EightChar eightChar = lunar.getEightChar();
        System.out.println(getBaZiPinYin(eightChar, "戊辰", "辛亥", "庚寅", "乙亥"));


    }

    //八字转换拼音
    public static HashMap<String, List<String>> getBaZiPinYin(EightChar eightChar, String... additionalGanZhi) {
        HashMap<String, List<String>> map = new HashMap<>();

        // For "nian"
        List<String> nianGanZhi = new ArrayList<>();
        nianGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getYearGan()));
        nianGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getYearZhi()));
        map.put(Constants.NIAN, nianGanZhi);

        // For "yue"
        List<String> yueGanZhi = new ArrayList<>();
        yueGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getMonthGan()));
        yueGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getMonthZhi()));
        map.put(Constants.YUE, yueGanZhi);

        // For "ri"
        List<String> riGanZhi = new ArrayList<>();
        riGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getDayGan()));
        riGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getDayZhi()));
        map.put(Constants.RI, riGanZhi);

        // For "shi"
        List<String> shiGanZhi = new ArrayList<>();
        shiGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getTimeGan()));
        shiGanZhi.add(CHINESE_CONVERT_PINYIN.get(eightChar.getTimeZhi()));
        map.put(Constants.SHI, shiGanZhi);

        if (additionalGanZhi.length ==1 ) {
            map.put(Constants.DAYUN, createGanZhiList(additionalGanZhi[0]));
        }else if (additionalGanZhi.length ==2) {
            map.put(Constants.DAYUN, createGanZhiList(additionalGanZhi[0]));
            map.put(Constants.LIUNIAN, createGanZhiList(additionalGanZhi[1]));

        }
        else if (additionalGanZhi.length ==3) {
            map.put(Constants.DAYUN, createGanZhiList(additionalGanZhi[0]));
            map.put(Constants.LIUNIAN, createGanZhiList(additionalGanZhi[1]));
            map.put(Constants.LIUYUE, createGanZhiList(additionalGanZhi[2]));
        }
        else if (additionalGanZhi.length ==4) {
            map.put(Constants.DAYUN, createGanZhiList(additionalGanZhi[0]));
            map.put(Constants.LIUNIAN, createGanZhiList(additionalGanZhi[1]));
            map.put(Constants.LIUYUE, createGanZhiList(additionalGanZhi[2]));
            map.put(Constants.LIURI, createGanZhiList(additionalGanZhi[3]));
        } else if (additionalGanZhi.length ==5) {
            map.put(Constants.DAYUN, createGanZhiList(additionalGanZhi[0]));
            map.put(Constants.LIUNIAN, createGanZhiList(additionalGanZhi[1]));
            map.put(Constants.LIUYUE, createGanZhiList(additionalGanZhi[2]));
            map.put(Constants.LIURI, createGanZhiList(additionalGanZhi[3]));
            map.put(Constants.LIUSHI, createGanZhiList(additionalGanZhi[4]));

        }
        return map;
    }

    private static List<String> createGanZhiList(String ganZhi) {
        List<String> ganZhiList = new ArrayList<>();
        ganZhiList.add(CHINESE_CONVERT_PINYIN.get(ganZhi.substring(0,1)));
        ganZhiList.add(CHINESE_CONVERT_PINYIN.get(ganZhi.substring(1,2)));
        return ganZhiList;
    }

}
