package com.sunland.app.domain.qimen;

import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.utils.qimen.QimenPan;
import com.sunland.app.utils.qimen.QimenPanUtil;
import com.sunland.common.utils.DateUtils;
import com.sunland.common.utils.StringUtils;
import lombok.Data;

import java.io.Serializable;
import java.text.ParseException;

import java.util.*;

/**
 * 阴盘奇门
 *
 * @author: xk
 * @create: 2023-09-21 17:11
 **/
@Data
public class QiMenZao implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 旬首表
     */
    public static final Map<String, List<String>> XUN_SHOU = new HashMap<String, List<String>>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲子戊", Arrays.asList("甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉"));
            this.put("甲戌己", Arrays.asList("甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未"));
            this.put("甲申庚", Arrays.asList("甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳"));
            this.put("甲午辛", Arrays.asList("甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯"));
            this.put("甲辰壬", Arrays.asList("甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑"));
            this.put("甲寅癸", Arrays.asList("甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"));
        }

    };
    /**
     * 子午卯酉是上元，寅申巳亥是中元，辰戌丑未是下元
     * 山元
     */
    public static final Map<String, List<String>> SHAN_YUAN = new HashMap<String, List<String>>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("子", Arrays.asList("甲子", "乙丑", "丙寅", "丁卯", "戊辰"));
            this.put("丑", Arrays.asList("己丑", "庚寅", "辛卯", "壬辰", "癸巳"));
            this.put("寅", Arrays.asList("甲寅", "乙卯", "丙辰", "丁巳", "戊午"));
            this.put("卯", Arrays.asList("己卯", "庚辰", "辛巳", "壬午", "癸未"));
            this.put("辰", Arrays.asList("甲辰", "乙巳", "丙午", "丁未", "戊申"));
            this.put("巳", Arrays.asList("己巳", "庚午", "辛未", "壬申", "癸酉"));
            this.put("午", Arrays.asList("甲午", "乙未", "丙申", "丁酉", "戊戌"));
            this.put("未", Arrays.asList("己未", "庚申", "辛酉", "壬戌", "癸亥"));
            this.put("申", Arrays.asList("甲申", "乙酉", "丙戌", "丁亥", "戊子"));
            this.put("酉", Arrays.asList("己酉", "庚戌", "辛亥", "壬子", "癸丑"));
            this.put("戌", Arrays.asList("甲戌", "乙亥", "丙子", "丁丑", "戊寅"));
            this.put("亥", Arrays.asList("己亥", "庚子", "辛丑", "壬寅", "癸卯"));
        }

    };
    public static final Map<String, List<Integer>> SHAN_YUAN_JUSHU = new HashMap<String, List<Integer>>() {
        private static final long serialVersionUID = -1L;

        {
            // 阳遁九局
            put("冬至", Arrays.asList(1, 7, 4));
            put("惊蛰", Arrays.asList(1, 7, 4));
            put("小寒", Arrays.asList(2, 8, 5));
            put("大寒", Arrays.asList(3, 9, 6));
            put("春分", Arrays.asList(3, 9, 6));
            put("立春", Arrays.asList(8, 5, 2));
            put("谷雨", Arrays.asList(5, 2, 8));
            put("小满", Arrays.asList(5, 2, 8));
            put("雨水", Arrays.asList(9, 6, 3));
            put("清明", Arrays.asList(4, 1, 7));
            put("立夏", Arrays.asList(4, 1, 7));
            put("芒种", Arrays.asList(6, 3, 9));

            // 阴遁九局
            put("夏至", Arrays.asList(9, 3, 6));
            put("白露", Arrays.asList(9, 3, 6));
            put("小暑", Arrays.asList(8, 2, 5));
            put("大暑", Arrays.asList(7, 1, 4));
            put("秋分", Arrays.asList(7, 1, 4));
            put("立秋", Arrays.asList(2, 5, 8));
            put("霜降", Arrays.asList(5, 8, 2));
            put("小雪", Arrays.asList(5, 8, 2));
            put("大雪", Arrays.asList(4, 7, 1));
            put("处暑", Arrays.asList(1, 4, 7));
            put("寒露", Arrays.asList(6, 9, 3));
            put("立冬", Arrays.asList(6, 9, 3));
        }

    };
    /**
     * 马星表
     */
    public static final Map<String, String> MA_XING = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("巽", "亥卯未");
            this.put("艮", "申子辰");
            this.put("坤", "寅午戌");
            this.put("乾", "巳酉丑");
        }
    };

    /**
     * 地支六冲
     */

    public static final Map<String, String> MA_XING_CHONG = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("子", "午");
            this.put("丑", "未");
            this.put("寅", "申");
            this.put("卯", "酉");
            this.put("辰", "戌");
            this.put("巳", "亥");
            this.put("午", "子");
            this.put("未", "丑");
            this.put("申", "寅");
            this.put("酉", "卯");
            this.put("戌", "辰");
            this.put("亥", "巳");
        }
    };

    /**
     * 空亡表
     */
    public static final Map<String, String> XUN_KONG = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲子", "戌亥");
            this.put("甲寅", "子丑");
            this.put("甲辰", "寅卯");
            this.put("甲午", "辰巳");
            this.put("甲申", "午未");
            this.put("甲戌", "申酉");

        }
    };

    public static final Map<String, String> XUN_KONG_GONG = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("甲子", "乾");
            this.put("甲寅", "坎艮");
            this.put("甲辰", "艮震");
            this.put("甲午", "巽");
            this.put("甲申", "离坤");
            this.put("甲戌", "坤兑");

        }
    };

    public static final Map<Integer, String> YUE_JIANG = new HashMap<Integer, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put(1, "亥");
            this.put(2, "戌");
            this.put(3, "酉");
            this.put(4, "申");
            this.put(5, "未");
            this.put(6, "午");
            this.put(7, "巳");
            this.put(8, "辰");
            this.put(9, "卯");
            this.put(10, "寅");
            this.put(11, "丑");
            this.put(12, "子");
        }
    };

    /**
     * 奇门类别
     */
    public String qimenType;
    /**
     * 公历年份
     */
    public String yearGongLi;

    /**
     * 农历年份
     */
    public String yearNongLi;

    /**
     * 年干支
     */
    public String yearGanZhi;

    /**
     * 月干支
     */
    public String monthGanZhi;

    /**
     * 月支
     */
    public String monthZhi;

    /**
     * 日干支
     */
    public String dayGanZhi;

    /**
     * 时干支
     */
    public String hourGanZhi;

    /**
     * 时干
     */
    public String hourGan;

    /**
     * 时支
     */
    public String hourZhi;

    /**
     * 上一节气
     */
    public String prevJieQiName;

    /**
     * 下一节气
     */
    public String nextJieQiName;

    /**
     * 阴遁还是阳遁
     */
    public String yinOrYangDun;

    /**
     * 局数
     */
    public Integer juShu;

    /**
     * 旬首
     */
    public String xunShou;

    /**
     * 马星
     */
    public String maXing;


    /**
     * 马星内容
     */
    public String maXingContent;

    /**
     * 旬空
     */
    public String xunKong;

    /**
     * 旬空宫
     */
    public String xunKongGong;

    /**
     * 值符
     */
    public String zhiFu;

    /**
     * 值符宫位
     */
    public Integer zhiFuIndex;

    /**
     * 值使
     */
    public String zhiShi;

    /**
     * 值使宫位
     */
    public Integer zhiShiIndex;

    /**
     * 事项
     */
    public String question;

    /**
     * 月将
     */
    public String yueJiang;

    /**
     * 向
     */
    public String xiang;

    /**
     * 山
     */
    public String shan;

    /**
     * 度数范围
     */
    public String degreeRange;
    /**
     * 性别
     */
    public String sex;
    /**
     * 莲花奇门流日
     */
    public String lotusGateFlowDate;

    /**
     * 黄泉八煞
     */
    public String huangQuan;

    // 年空亡
    private String yearXunKong;
    // 月空亡
    private String monthXunKong;
    // 日空亡
    private String dayXunKong;
    // 时空亡
    private String timeXunKong;

    private String prevJieQiTime;

    private String nextJieQiTime;

    private String dayGan;


    public static QiMenZao getYinPanQiMen(BaZiBody baZiBody) {
        return new QiMenZao(baZiBody);
    }

    /**
     * 0阴盘奇门时盘
     * 1阴盘奇门刻盘
     * 2山向奇门
     * 3莲花奇门
     * 4星河奇门
     * @param baZiBody
     */
    public QiMenZao(BaZiBody baZiBody) {
        if (baZiBody == null) {
            throw new IllegalArgumentException("内容不能为空");
        }
        if ("1".equals(baZiBody.getIsKe())) {
            kePan(baZiBody);
        } else if ("0".equals(baZiBody.getIsKe())) {
            shiPan(baZiBody);
        } else if ("2".equals(baZiBody.getIsKe())) {
            ShanXiang(baZiBody);
        } else if ("3".equals(baZiBody.getIsKe())) {
            lianHua(baZiBody);
        }else if ("4".equals(baZiBody.getIsKe())) {
            xingHe(baZiBody);
        }

    }


    public static QiMenZao getShanXiangQiMen(BaZiBody baZiBody) {
        return new QiMenZao(baZiBody);
    }

    public static QiMenZao getLianHuaQiMen(BaZiBody baZiBody) {
        return new QiMenZao(baZiBody);
    }

    public static QiMenZao getXingHeQimenH5(BaZiBody baZiBody) {
        return new QiMenZao(baZiBody);
    }

    /**
     * 星河奇门
     */
    private void xingHe(BaZiBody baZiBody) {
        String birthDay = baZiBody.getBirthDay();
        Date date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar ldate = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//23点算下一天

        // 八字问题
        EightChar eightChar = sdate.getLunar().getEightChar();
        eightChar.setSect(1);


        this.qimenType = baZiBody.getIsKe();
        this.yearGongLi = birthDay;
        this.yearNongLi = ldate.getYearInChinese() + "年" + ldate.getMonthInChinese() + "月" + ldate.getDayInChinese() + "日";
        this.yearGanZhi = eightChar.getYear();
        this.monthGanZhi = eightChar.getMonth();
        this.monthZhi = eightChar.getMonthZhi();
        this.dayGanZhi = eightChar.getDay();
        this.dayGan = eightChar.getDayGan();
        this.hourGanZhi = eightChar.getTime();
        this.hourGan = eightChar.getTimeGan();
        this.hourZhi = eightChar.getTimeZhi();
        this.prevJieQiName = ldate.getPrevJieQi().getName();
        this.nextJieQiName = ldate.getNextJieQi().getName();
        this.prevJieQiTime =  ldate.getPrevJieQi().getSolar().toYmdHms();
        this.nextJieQiTime =  ldate.getNextJieQi().getSolar().toYmdHms();
        this.yinOrYangDun = getYangOrYin(ldate);
        this.juShu = getXingHeJuShu(ldate,this.dayGanZhi);
        this.xunShou = getXunShou(this.hourGanZhi);
        this.maXing = getMaXing(this.hourZhi);
        this.maXingContent = getMaXingContent(this.maXing);
        this.xunKong = getXunKong(this.xunShou);
        this.xunKongGong = getXunKongGong(this.xunShou);
        this.question = baZiBody.getQuestion();
        this.yueJiang = getYueJiang(ldate);
        this.yearXunKong = eightChar.getYearXunKong();
        this.monthXunKong = eightChar.getMonthXunKong();
        this.dayXunKong = eightChar.getDayXunKong();
        this.timeXunKong = eightChar.getTimeXunKong();
    }

    /**
     * 子午卯酉是上元0，寅申巳亥是中元1，辰戌丑未是下元2
     * @param dayGanZhi
     * @return
     */
    private Integer getXingHeJuShu(Lunar ldate,String dayGanZhi) {
        String jieQi = ldate.getPrevJieQi().getName();

        String collect = SHAN_YUAN.entrySet().stream().filter(kvEntry -> kvEntry.getValue().contains(dayGanZhi)).map(Map.Entry::getKey).findFirst().get();
        List<String> shang = (Arrays.asList("子", "午", "卯", "酉"));
        List<String> zhong =(Arrays.asList("寅", "申", "巳", "亥"));
        List<String> xia =(Arrays.asList("辰", "戌", "丑", "未"));
        int position=0;
        if (shang.contains(collect)) {
            position = 0;
        }else if (zhong.contains(collect)) {
            position = 1;
        }else if (xia.contains(collect)) {
            position = 2;
        }
        return SHAN_YUAN_JUSHU.get(jieQi).get(position);
    }

    /**
     * 莲花奇门
     * 四柱天干的序数相加除以9，余数就是局数
     *
     * @param baZiBody
     */
    private void lianHua(BaZiBody baZiBody) {
        String birthDay = baZiBody.getBirthDay();
        Date date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar ldate = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//23点算下一天

        // 八字问题
        EightChar eightChar = sdate.getLunar().getEightChar();
        eightChar.setSect(1);

        this.qimenType = baZiBody.getIsKe();
        this.yearGongLi = birthDay;
        this.yearNongLi = ldate.getYearInChinese() + "年" + ldate.getMonthInChinese() + "月" + ldate.getDayInChinese() + "日";
        this.yearGanZhi = eightChar.getYear();
        this.monthGanZhi = eightChar.getMonth();
        this.monthZhi = eightChar.getMonthZhi();
        this.dayGanZhi = eightChar.getDay();
        this.hourGanZhi = eightChar.getTime();
        this.hourGan = eightChar.getTimeGan();
        this.hourZhi = eightChar.getTimeZhi();
        this.prevJieQiName = ldate.getPrevJieQi().getName();
        this.nextJieQiName = ldate.getNextJieQi().getName();
        this.yinOrYangDun = getYangOrYinLianHua(ldate,baZiBody);
        this.juShu = getLianHuaJuShu(eightChar, baZiBody);
        this.xunShou = getXunShou(this.hourGanZhi);
        this.maXing = getMaXing(this.hourZhi);
        this.maXingContent = getMaXingContent(this.maXing);
        this.xunKong = getXunKong(this.xunShou);
        this.xunKongGong = getXunKongGong(this.xunShou);
        this.question = baZiBody.getQuestion();
        this.yueJiang = getYueJiang(ldate);
        this.sex = baZiBody.getSex();
        this.lotusGateFlowDate = baZiBody.getLotusGateFlowDate();
    }

    /**
     * 阳遁：冬至后夏至前包含冬至
     * 阴遁：夏至后冬至前包含夏至
     */
    public static String getYangOrYinLianHua(Lunar ldate, BaZiBody baZiBody) {
        // 如果已经指定了起卦数，则直接返回
        if (StringUtils.isNotNull(baZiBody.getJuShu())&&baZiBody.getJuShu() != 0) {
            return baZiBody.getJuShu()>0?"阳":"阴";
        }
        String name = ldate.getPrevJieQi().getName();
        List<String> yang = Arrays.asList("冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种");
        List<String> yin = Arrays.asList("夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪");
        if (yang.contains(name)) {
            return "阳";
        }
        if (yin.contains(name)) {
            return "阴";
        }
        return "未知";
    }

    private Integer getLianHuaJuShu(EightChar eightChar, BaZiBody baZiBody) {
        // 如果已经指定了起卦数，则直接返回
        if (StringUtils.isNotNull(baZiBody.getJuShu())&&baZiBody.getJuShu() != 0) {
            return Math.abs(baZiBody.getJuShu());
        }
        // 计算四柱干支的数字之和
        int sum = QimenPanUtil.GAN.indexOf(eightChar.getYearGan()) + 1;
        sum += QimenPanUtil.GAN.indexOf(eightChar.getMonthGan()) + 1;
        sum += QimenPanUtil.GAN.indexOf(eightChar.getDayGan()) + 1;
        sum += QimenPanUtil.GAN.indexOf(eightChar.getTimeGan()) + 1;

        int juShu = sum % 9;
        return juShu == 0 ? 9 : juShu;
    }


    /**
     * 山向奇门
     *
     * @param baZiBody
     */
    private void ShanXiang(BaZiBody baZiBody) {
        Double degrees = baZiBody.getDegrees();
        Integer year = baZiBody.getYear();
        List<String> mountain = getMountain(degrees);
        Lunar lunar = Lunar.fromYmd(year, 1, 1);

        this.qimenType = baZiBody.getIsKe();
        this.xiang = mountain.get(0);
        this.shan = QimenPanUtil.SHAN_XIANG.get(this.xiang);
        this.huangQuan=QimenPanUtil.MOUNTAIN_DIRECTION_TO_HUANGQUAN_MAP.get(this.shan);
        this.yinOrYangDun = mountain.get(3);
        this.juShu = Integer.parseInt(mountain.get(4));
        this.yearGanZhi = lunar.getYearInGanZhi();
        this.hourGanZhi = QimenPanUtil.getHourGanZhi(this.yearGanZhi.substring(0, 1), this.xiang);
        this.hourGan = this.hourGanZhi.substring(0, 1);
        this.hourZhi = this.hourGanZhi.substring(1);
        this.xunShou = getXunShou(this.hourGanZhi);
        this.maXing = getMaXing(this.hourZhi);
        this.maXingContent = getMaXingContent(this.maXing);
        this.xunKong = getXunKong(this.xunShou);
        this.xunKongGong = getXunKongGong(this.xunShou);
        this.degreeRange = mountain.get(1) + "~" + mountain.get(2);
    }

    /**
     * 获取山向基本数据
     *
     * @param degrees
     * @return
     */
    public static List<String> getMountain(Double degrees) {
        if (degrees == 360) {
            degrees = Double.valueOf(0);
        }
        for (List<String> direction : QimenPanUtil.MOUNTAIN_TABLE) {
            int lowerBound = Integer.parseInt(direction.get(1));
            int upperBound = Integer.parseInt(direction.get(2)) + 1;
            if (degrees >= lowerBound && degrees < upperBound) {
                return direction;
            }
        }
        return null;
    }

    /**
     * 阴盘奇门时盘
     *
     * @param baZiBody
     */
    private void shiPan(BaZiBody baZiBody) {
        String birthDay = baZiBody.getBirthDay();
        Date date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar ldate = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//23点算下一天

        // 八字问题
        EightChar eightChar = sdate.getLunar().getEightChar();
        eightChar.setSect(1);

        this.qimenType = baZiBody.getIsKe();
        this.yearGongLi = birthDay;
        this.yearNongLi = ldate.getYearInChinese() + "年" + ldate.getMonthInChinese() + "月" + ldate.getDayInChinese() + "日";
        this.yearGanZhi = eightChar.getYear();
        this.monthGanZhi = eightChar.getMonth();
        this.monthZhi = eightChar.getMonthZhi();
        this.dayGanZhi = eightChar.getDay();
        this.hourGanZhi = eightChar.getTime();
        this.hourGan = eightChar.getTimeGan();
        this.hourZhi = eightChar.getTimeZhi();
        this.prevJieQiName = ldate.getPrevJieQi().getName();
        this.nextJieQiName = ldate.getNextJieQi().getName();
        this.yinOrYangDun = getYangOrYin(ldate);
        this.juShu = getJuShu(ldate);
        this.xunShou = getXunShou(this.hourGanZhi);
        this.maXing = getMaXing(this.hourZhi);
        this.maXingContent = getMaXingContent(this.maXing);
        this.xunKong = getXunKong(this.xunShou);
        this.xunKongGong = getXunKongGong(this.xunShou);
        this.question = baZiBody.getQuestion();
        this.yueJiang = getYueJiang(ldate);
    }

    /**
     * 阴盘奇门刻盘
     *
     * @param baZiBody
     */
    private void kePan(BaZiBody baZiBody) {
        String birthDay = baZiBody.getBirthDay();
        Date date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar ldate = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//23点算下一天

        // 八字问题
        EightChar eightChar = sdate.getLunar().getEightChar();
        eightChar.setSect(1);

        this.qimenType = baZiBody.getIsKe();
        this.yearGongLi = birthDay;
        this.yearNongLi = ldate.getYearInChinese() + "年" + ldate.getMonthInChinese() + "月" + ldate.getDayInChinese() + "日";
        this.yearGanZhi = eightChar.getMonth();
        this.monthGanZhi = eightChar.getDay();
        this.dayGanZhi = eightChar.getTime();
        this.hourGanZhi = getMinuteGanZhi(ldate);
        this.hourGan = getMinuteGan(ldate);
        this.hourZhi = getMinuteZhi(ldate);
        this.prevJieQiName = ldate.getPrevJieQi().getName();
        this.nextJieQiName = ldate.getNextJieQi().getName();
        this.yinOrYangDun = getYangOrYin(ldate);
        this.juShu = getKeJuShu(ldate);
        this.xunShou = getXunShou(this.hourGanZhi);
        this.maXing = getMaXing(this.hourZhi);
        this.maXingContent = getMaXingContent(this.maXing);
        this.xunKong = getXunKong(this.xunShou);
        this.xunKongGong = getXunKongGong(this.xunShou);
        this.question = baZiBody.getQuestion();
        this.yueJiang = getYueJiang(ldate);
    }

    private static int calculateCMin(Lunar lunar) {
        Solar solar = lunar.getSolar();
        int hour = solar.getHour();
        int minute = solar.getMinute();
        if (hour % 2 == 0) {
            minute = 60 + minute;
        }
        int timeGanIndex = lunar.getTimeGanIndex();
        int cMin = timeGanIndex * 12 + minute / 10;
        return cMin;
    }

    public static int getMinuteGanIndex(Lunar lunar) {
        return calculateCMin(lunar) % 10;
    }

    public static int getMinuteZhiIndex(Lunar lunar) {
        return calculateCMin(lunar) % 12;
    }

    public static String getMinuteGan(Lunar lunar) {
        return QimenPanUtil.GAN.get(getMinuteGanIndex(lunar));
    }

    public static String getMinuteZhi(Lunar lunar) {
        return QimenPanUtil.ZHI.get(getMinuteZhiIndex(lunar));
    }

    public static String getMinuteGanZhi(Lunar lunar) {
        return getMinuteGan(lunar) + getMinuteZhi(lunar);
    }

    public static Integer getKeJuShu(Lunar ldate) {
        int yearZhiIndex = ldate.getYearZhiIndexByLiChun() + 1;
        int timeZhiIndex = ldate.getTimeZhiIndex() + 1;
        int minuteZhiIndex = getMinuteZhiIndex(ldate) + 1;
        int month = ldate.getMonth();
        int day = ldate.getDay();
        int juShu = (yearZhiIndex + month + day + timeZhiIndex + minuteZhiIndex) % 9;
        return juShu == 0 ? 9 : juShu;
    }


    /**
     * 阳遁：冬至后夏至前包含冬至
     * 阴遁：夏至后冬至前包含夏至
     */
    public static String getYangOrYin(Lunar ldate) {
        String name = ldate.getPrevJieQi().getName();
        List<String> yang = Arrays.asList("冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种");
        List<String> yin = Arrays.asList("夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪");
        if (yang.contains(name)) {
            return "阳";
        }
        if (yin.contains(name)) {
            return "阴";
        }
        return "未知";
    }

    /**
     * 获取局数:(年支序数+月数+日数+时支序数）/9的余数
     *
     * @param ldate
     * @return
     */
    public static Integer getJuShu(Lunar ldate) {
        int yearZhiIndex = ldate.getYearZhiIndexByLiChun() + 1;
        int timeZhiIndex = ldate.getTimeZhiIndex() + 1;
        int month = ldate.getMonth();
        int day = ldate.getDay();
        int juShu = (yearZhiIndex + month + day + timeZhiIndex) % 9;
        return juShu == 0 ? 9 : juShu;
    }

    /**
     * 获取旬首：时干支所对应的行的第一个干支，就是旬首
     *
     * @param hourGanZhi
     * @return
     */
    public static String getXunShou(String hourGanZhi) {
        String collect = XUN_SHOU.entrySet().stream().filter(kvEntry -> kvEntry.getValue().contains(hourGanZhi)).map(Map.Entry::getKey).findFirst().get();
        return collect;
    }

    /**
     * 获取马星
     * 看时柱的地支
     * 亥卯未的时间，马星在巽宫，
     * 申子辰的时间，马星在艮宫，
     * 寅午戌的时间，马星在坤宫，
     * 巳酉丑的时间，马星在乾宫。
     *
     * @param timeZhi
     * @return
     */

    public String getMaXing(String timeZhi) {
        String collect = MA_XING.entrySet().stream().filter(kvEntry -> kvEntry.getValue().contains(timeZhi)).map(Map.Entry::getKey).findFirst().get();
        return collect;
    }

    /**
     * 马星对应的子
     *
     * @param maXing
     * @return
     */
    public String getMaXingContent(String maXing) {
        return MA_XING_CHONG.get(MA_XING.get(maXing).substring(0, 1));
    }


    /**
     * 查询旬空
     * | 旬  | 空  | 宫  |
     * |----|----|----|
     * | 甲子 | 戌亥 | 乾  |
     * | 甲寅 | 子丑 | 坎艮 |
     * | 甲辰 | 寅卯 | 艮震 |
     * | 甲午 | 辰巳 | 巽  |
     * | 甲申 | 午未 | 离坤 |
     * | 甲戌 | 申酉 | 坤兑 |
     *
     * @param xunShou
     * @return
     */
    public String getXunKong(String xunShou) {
        return XUN_KONG.get(xunShou.substring(0, 2));
    }

    /**
     * 旬首对应的宫位
     *
     * @param xunShou
     * @return
     */
    public String getXunKongGong(String xunShou) {
        return XUN_KONG_GONG.get(xunShou.substring(0, 2));
    }

    /**
     * 获取月将 节气所在月份
     *
     * @param ldate
     * @return
     */
    public String getYueJiang(Lunar ldate) {
        List<String> qiList = Arrays.asList("雨水", "春分", "谷雨", "小满", "夏至", "大暑", "处暑", "秋分", "霜降", "小雪", "冬至", "大寒");
        String qi = ldate.getPrevQi().getName();
        return YUE_JIANG.get(qiList.indexOf(qi) + 1);
    }


    public static void main(String[] args) throws ParseException {

        BaZiBody baZiBody = new BaZiBody();
//        baZiBody.setBirthDay("2024-05-14 16:45");
        baZiBody.setIsKe("2");
        baZiBody.setYear(2012);
        baZiBody.setDegrees(5.0);
//        baZiBody.setSex("男");
//        baZiBody.setJuShu(-2);
        QiMenZao yinPanQiMen = getShanXiangQiMen(baZiBody);
        System.out.println(QimenPan.getQimenPan(yinPanQiMen));

//        初始日期字符串
//        String initialDateStr = "2023-02-05 07:13:00";
//        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//
//        // 解析初始日期字符串
//        Date currentDate = sdf.parse(initialDateStr);
//        Calendar calendar = Calendar.getInstance();
//        calendar.setTime(currentDate);
//
//        // 循环执行 1000 天的操作
//        for (int i = 0; i < 10000; i++) {
//            // 执行每一天的操作
//
//            // 增加一天
//            calendar.add(Calendar.DAY_OF_MONTH, 1);
//            currentDate = calendar.getTime();
//            String currentDateStr = sdf.format(currentDate);
//
//            // 创建八字信息
//            BaZiBody baZiBody = new BaZiBody();
//            baZiBody.setBirthDay(currentDateStr);
//            baZiBody.setIsKe("3");
//            baZiBody.setSex("男");
//
//            // 获取对应的奇门遁甲盘
//            QiMenZao yinPanQiMen = getLianHuaQiMen(baZiBody);
//
//            // 输出日期和奇门遁甲盘
//            System.out.println("---------------------------------------");
//            System.out.println("Date: " + currentDateStr);
//            System.out.println(QimenPan.getQimenPan(yinPanQiMen));
//        }

    }


}
