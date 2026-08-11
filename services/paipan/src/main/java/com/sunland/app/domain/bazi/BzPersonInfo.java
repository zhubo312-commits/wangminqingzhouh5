package com.sunland.app.domain.bazi;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.nlf.calendar.*;
import com.nlf.calendar.util.LunarUtil;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.utils.bazi.*;
import com.sunland.app.utils.ScoreUtil;
import com.sunland.common.constant.Constants;
import com.sunland.common.utils.DateUtils;
import com.sunland.common.utils.StringUtils;
import lombok.Data;

import java.io.Serializable;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * @author: xk
 * @create: 2023-06-30 16:28
 **/
@Data
public class BzPersonInfo implements Serializable {

    private static final long serialVersionUID = 1L;
    // 姓名
    private String userName;
    // 性别
    private String sex;
    // 农历日期
    private String lunarDate;
    // 生日日期
    private String birthDay;
    // 地区
    private String area;
    // 地区id
    private String districtGeocode;
    // 真太阳时
    private String trueSolarTime;
    // 本命佛
    private String benmingfo;
    // 生肖
    private String chineseZodiac;
    // 星座
    private String zodiac;
    // 胎元
    private String taiYuan;
    // 胎元纳音
    private String taiYuanNaYin;
    // 命宫
    private String mingGong;
    // 命宫纳音
    private String mingGongNaYin;
    // 对冲
    private String duiChong;
    // 三煞
    private String sanSha;
    // 文昌位
    private String wenChangWei;
    // 年干
    private String yearGan;
    // 年支
    private String yearZhi;
    // 年干的五行属性
    private String yearGanWuXing;
    // 年支的五行属性
    private String yearZhiWuXing;
    // 月干
    private String monthGan;
    // 月支
    private String monthZhi;
    // 月干的五行属性
    private String monthGanWuXing;
    // 月支的五行属性
    private String monthZhiWuXing;
    // 日干
    private String dayGan;
    // 日支
    private String dayZhi;
    // 日干的五行属性
    private String dayGanWuXing;
    // 日支的五行属性
    private String dayZhiWuXing;
    // 时干
    private String timeGan;
    // 时支
    private String timeZhi;
    // 时干的五行属性
    private String timeGanWuXing;
    // 时支的五行属性
    private String timeZhiWuXing;
    // 年干十神
    private String yearGanShiShen;
    // 月干十神
    private String monthGanShiShen;
    // 日干十神
    private String dayGanShiShen;
    // 时干十神
    private String timeGanShiShen;
    // 年藏干十神
    private List<String> yearZhiShiShen;
    // 月藏干十神
    private List<String> monthZhiShiShen;
    // 日藏干十神
    private List<String> dayZhiShiShen;
    // 时藏干十神
    private List<String> timeZhiShiShen;
    // 年藏干
    private String yearCangGan;
    // 月藏干
    private String monthCangGan;
    // 日藏干
    private String dayCangGan;
    // 时藏干
    private String timeCangGan;
    // 年藏干五行
    private String yearCangGanWx;
    // 月藏干五行
    private String monthCangGanWx;
    // 日藏干五行
    private String dayCangGanWx;
    // 时藏干五行
    private String timeCangGanWx;
    // 年纳音
    private String yearNaYin;
    // 月纳音
    private String monthNaYin;
    // 日纳音
    private String dayNaYin;
    // 时纳音
    private String timeNaYin;
    // 年份的地势
    private String yearDiShi;
    // 月份的地势
    private String monthDiShi;
    // 日期的地势
    private String dayDiShi;
    // 时间的地势
    private String timeDiShi;
    // 年份的自坐
    private String yearZiZuo;
    // 月份的自坐
    private String monthZiZuo;
    // 日期的自坐
    private String dayZiZuo;
    // 时间的自坐
    private String timeZiZuo;
    // 年空亡
    private String yearXunKong;
    // 月空亡
    private String monthXunKong;
    // 日空亡
    private String dayXunKong;
    // 时空亡
    private String timeXunKong;
    // 喜神
    public String dayPositionXi;
    // 阳贵人
    public String dayPositionYangGui;
    // 女贵人
    public String dayPositionYinGui;
    // 福神
    public String dayPositionFu;
    // 财神
    public String dayPositionCai;
    // 年神煞
    private List<String> yearShenSha;
    // 月神煞
    private List<String> monthShenSha;
    // 日神煞
    private List<String> dayShenSha;
    // 时神煞
    private List<String> timeShenSha;
    // 神煞解释
    private Map<String, List<String>> shenShaDesc;
    //大运
    private List<JSONObject> daYun;
    //起运时间
    private String startSolarYun;
    //起运
    private String startYun;
    //交运
    private String changeYun;
    // 身强身弱分数
    private Integer strongWeakScore;
    //天干留意
    private List<String> tianGanAttention;
    //地支留意
    private List<String> diZhiAttention;
    //上一节气
    private String prevJieQi;
    //下一节气
    private String nextJieQi;
    // 广元身强身弱
    private GuangYuanShenQiangShenRuo  guangYuanShenQiangShenRuo ;

    // 地势星运
    public static String getDishiWithDizhi(String tiangan, String dizhi) {
        int h = BaZiUtil.dizhiNames.indexOf(dizhi); // 地支顺序
        int e = BaZiUtil.dizhiNames.indexOf(BaZiUtil.CANG_SHEN_DI_ZHI.get(tiangan)); //  长生地支顺序
        int s = BaZiUtil.TIAN_GAN_YIN_YANG.get(tiangan); // 天干阴阳
        int n = (12 + (int) (Math.pow(-1, s) * h) - (int) (Math.pow(-1, s) * e)) % 12;
        return BaZiUtil.CHANG_SHENG[n];
    }


    // 地支十神
    public static List<String> getShiShenZhi(String dayGan, String zhi) {
        List<String> hideGan = Arrays.asList(BaZiUtil.CANG_GAN.get(zhi).split(","));
        List<String> l = new ArrayList(hideGan.size());
        Iterator var4 = hideGan.iterator();

        while (var4.hasNext()) {
            String gan = (String) var4.next();
            l.add(LunarUtil.SHI_SHEN.get(dayGan + gan));
        }
        return l;
    }

    public BzPersonInfo(Date date, Integer gender, String type) {
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar lunar = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//阴历23点算下一天
        Lunar ldate = sdate.getLunar();
        EightChar eightChar = ldate.getEightChar();
        eightChar.setSect(1);
        //八字五行

        this.lunarDate = lunar.getYearInChinese() + "年" + lunar.getMonthInChinese() + "月" + lunar.getDayInChinese() + "日" + lunar.getTimeZhi() + "时";
        this.benmingfo = BaZiUtil.benmingfoList.get(BaZiUtil.zodiacAnimals.indexOf(ldate.getYearShengXiaoExact()));
        this.chineseZodiac = ldate.getYearShengXiaoExact();
        this.zodiac = sdate.getXingZuo();
        this.taiYuan = eightChar.getTaiYuan();
        this.taiYuanNaYin = eightChar.getTaiYuanNaYin();
        this.mingGong = eightChar.getMingGong();
        this.mingGongNaYin = eightChar.getMingGongNaYin();
        this.duiChong = BaZiUtil.zodiacAnimals.get((ldate.getDayZhiIndex() + 6) % 12);
        this.sanSha = BaZiUtil.directions.get((ldate.getDayZhiIndex() % 4));
        this.wenChangWei = BaZiUtil.WEN_CHANG_WEI.get(ldate.getYearGan());
        this.yearGan = eightChar.getYearGan();
        this.yearZhi = eightChar.getYearZhi();
        this.yearGanWuXing = eightChar.getYearWuXing().substring(0, 1);
        this.yearZhiWuXing = eightChar.getYearWuXing().substring(1);
        this.monthGan = eightChar.getMonthGan();
        this.monthZhi = eightChar.getMonthZhi();
        this.monthGanWuXing = eightChar.getMonthWuXing().substring(0, 1);
        this.monthZhiWuXing = eightChar.getMonthWuXing().substring(1);
        this.dayGan = eightChar.getDayGan();
        this.dayZhi = eightChar.getDayZhi();
        this.dayGanWuXing = eightChar.getDayWuXing().substring(0, 1);
        this.dayZhiWuXing = eightChar.getDayWuXing().substring(1);
        this.timeGan = eightChar.getTimeGan();
        this.timeZhi = eightChar.getTimeZhi();
        this.timeGanWuXing = eightChar.getTimeWuXing().substring(0, 1);
        this.timeZhiWuXing = eightChar.getTimeWuXing().substring(1);
        this.yearGanShiShen = eightChar.getYearShiShenGan();
        this.monthGanShiShen = eightChar.getMonthShiShenGan();
        this.dayGanShiShen = gender.equals(1) ? "元男" : "元女";
        this.timeGanShiShen = eightChar.getTimeShiShenGan();
        this.yearZhiShiShen = eightChar.getYearShiShenZhi();
        this.monthZhiShiShen = eightChar.getMonthShiShenZhi();
        this.dayZhiShiShen = eightChar.getDayShiShenZhi();
        this.timeZhiShiShen = eightChar.getTimeShiShenZhi();
        this.yearCangGan = String.join(",", eightChar.getYearHideGan());
        this.monthCangGan = String.join(",", eightChar.getMonthHideGan());
        this.dayCangGan = String.join(",", eightChar.getDayHideGan());
        this.timeCangGan = String.join(",", eightChar.getTimeHideGan());
        this.yearCangGanWx = BaZiUtil.CANG_GAN_WX.get(this.yearZhi);
        this.monthCangGanWx = BaZiUtil.CANG_GAN_WX.get(this.monthZhi);
        this.dayCangGanWx = BaZiUtil.CANG_GAN_WX.get(this.dayZhi);
        this.timeCangGanWx = BaZiUtil.CANG_GAN_WX.get(this.timeZhi);
        this.yearNaYin = eightChar.getYearNaYin();
        this.monthNaYin = eightChar.getMonthNaYin();
        this.dayNaYin = eightChar.getDayNaYin();
        this.timeNaYin = eightChar.getTimeNaYin();
        this.yearDiShi = eightChar.getYearDiShi();
        this.monthDiShi = eightChar.getMonthDiShi();
        this.dayDiShi = eightChar.getDayDiShi();
        this.timeDiShi = eightChar.getTimeDiShi();
        this.yearZiZuo = getDishiWithDizhi(this.yearGan, this.yearZhi);
        this.monthZiZuo = getDishiWithDizhi(this.monthGan, this.monthZhi);
        this.dayZiZuo = getDishiWithDizhi(this.dayGan, this.dayZhi);
        this.timeZiZuo = getDishiWithDizhi(this.timeGan, this.timeZhi);
        this.yearXunKong = eightChar.getYearXunKong();
        this.monthXunKong = eightChar.getMonthXunKong();
        this.dayXunKong = eightChar.getDayXunKong();
        this.timeXunKong = eightChar.getTimeXunKong();
        this.dayPositionXi = ldate.getDayPositionXiDesc();
        this.dayPositionYangGui = ldate.getDayPositionYangGuiDesc();
        this.dayPositionYinGui = ldate.getDayPositionYinGuiDesc();
        this.dayPositionFu = ldate.getDayPositionFuDesc();
        this.dayPositionCai = ldate.getDayPositionCaiDesc();
        this.yearShenSha = ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(eightChar), Constants.NIAN,type);
        this.monthShenSha = ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(eightChar), Constants.YUE,type);
        this.dayShenSha = ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(eightChar), Constants.RI,type);
        this.timeShenSha = ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(eightChar), Constants.SHI,type);
        this.shenShaDesc = ShenShaDataUtil.getShenShaDesc(this.yearShenSha, this.monthShenSha, this.dayShenSha, this.timeShenSha);
        this.daYun = getDaYunLiuNian(eightChar, gender, type);
        this.strongWeakScore = ScoreUtil.getStrongWeakScore(ldate);
        this.tianGanAttention = AttentionUtil.getTianGanAttention(this.yearGan, this.monthGan, this.dayGan, this.timeGan);
        this.diZhiAttention = AttentionUtil.getDiZhiAttention(this.yearZhi, this.monthZhi, this.dayZhi, this.timeZhi);
        this.startSolarYun = eightChar.getYun(gender).getStartSolar().toYmdHms();
        this.startYun = getStartYun(eightChar, gender);
        this.changeYun = getChangeYun(eightChar, gender);
        this.prevJieQi = ldate.getPrevJieQi().getSolar().toYmdHms() + " " + ldate.getPrevJieQi().getName();
        this.nextJieQi = ldate.getNextJieQi().getSolar().toYmdHms() + " " + ldate.getNextJieQi().getName();
        this.guangYuanShenQiangShenRuo = new GuangYuanShenQiangShenRuo(this.yearGanWuXing,this.monthGanWuXing,this.dayGanWuXing,this.timeGanWuXing,this.yearCangGanWx, this.monthCangGanWx, this.dayCangGanWx, this.timeCangGanWx,this.dayGanShiShen,this.dayGan,ldate);

    }

    /**
     * 交运
     * @param eightChar
     * @param gender
     * @return
     */
    private String getChangeYun(EightChar eightChar, Integer gender) {
        CustomYun customYun = new CustomYun(eightChar, gender, 2);
        CustomDaYun[] daYun = customYun.getCustomDaYun(2);
        CustomLiuNian[] customLiuNian = daYun[1].getCustomLiuNian(6);

        String firstYear = customLiuNian[0].getGan();
        String lastYear = customLiuNian[5].getGan();

        Solar startSolar = customYun.getStartSolar();
        JieQi prevJie = startSolar.getLunar().getPrevJie();
        String prevJieName = prevJie.getName();
        int yearsToNextJie = startSolar.subtract(prevJie.getSolar());

        return String.format("逢%s、%s年，%s后%d天交大运", firstYear, lastYear, prevJieName, yearsToNextJie);
    }


    /**
     * 起运
     * @param eightChar
     * @param gender
     * @return
     */
    private String getStartYun(EightChar eightChar, Integer gender) {
        CustomYun customYun = new CustomYun(eightChar, gender, 2);
        return "出生后" + customYun.getStartYear() + "年" + customYun.getStartMonth() + "月" + customYun.getStartDay() + "天"+customYun.getStartHour()+"时起运";
    }

    /**
     * 九龙八字排盘
     * @param baZiBody
     * @return
     */
    public static BzPersonInfo baziPanJiuLong(BaZiBody baZiBody) {
        BzPersonInfo bzPersonInfo = fromBaZiBody(baZiBody);
        bzPersonInfo.yearZhiShiShen = getShiShenZhi(bzPersonInfo.dayGan,bzPersonInfo.yearZhi);
        bzPersonInfo.monthZhiShiShen = getShiShenZhi(bzPersonInfo.dayGan,bzPersonInfo.monthZhi);
        bzPersonInfo.dayZhiShiShen = getShiShenZhi(bzPersonInfo.dayGan,bzPersonInfo.dayZhi);
        bzPersonInfo.timeZhiShiShen = getShiShenZhi(bzPersonInfo.dayGan,bzPersonInfo.timeZhi);
        bzPersonInfo.yearCangGan = BaZiUtil.CANG_GAN.get(bzPersonInfo.yearZhi);
        bzPersonInfo.monthCangGan = BaZiUtil.CANG_GAN.get(bzPersonInfo.monthZhi);
        bzPersonInfo.dayCangGan = BaZiUtil.CANG_GAN.get(bzPersonInfo.dayZhi);
        bzPersonInfo.timeCangGan = BaZiUtil.CANG_GAN.get(bzPersonInfo.timeZhi);
        return bzPersonInfo;
    }

    public static BzPersonInfo fromBaZiBody(BaZiBody baZiBody) {
        // 设置默认地区编码为北京市（110100）
        String districtGeocode = SolarTimeUtil.isContain(baZiBody.getDistrictGeocode()) ? baZiBody.getDistrictGeocode() : "999999";
//        String districtGeocode = StringUtils.isEmpty(baZiBody.getDistrictGeocode()) ? "110100" : baZiBody.getDistrictGeocode();
        boolean isSolar = baZiBody.isSolar();
        String birthDay = baZiBody.getBirthDay();
        String sex = baZiBody.getSex();
        Integer gender = sex.equals("男") ? 1 : 0; // 根据性别设置性别代码
        String trueSolarTime = null;
        Date date;
        // 根据是否使用阳历获取生日时间
        if (isSolar) {
            trueSolarTime = SolarTimeUtil.getSolarTime(birthDay, districtGeocode);
            date = DateUtils.strToDate(trueSolarTime, DateUtils.YYYY_MM_DD_HH_MM);
        } else {
            date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        }

        // 创建 BzPersonInfo 实例并设置属性
        BzPersonInfo bzPersonInfo = new BzPersonInfo(date, gender,baZiBody.getType());
        bzPersonInfo.setUserName(baZiBody.getUserName());
        bzPersonInfo.setSex(sex);
        bzPersonInfo.setBirthDay(birthDay);
        bzPersonInfo.setTrueSolarTime(trueSolarTime);
        bzPersonInfo.setArea(SolarTimeUtil.getArea(districtGeocode));
        bzPersonInfo.setDistrictGeocode(districtGeocode);
        return bzPersonInfo;
    }

    /**
     * 大运流年
     *
     * @param eightChar
     * @param gender
     * @param type
     * @return
     */
    public List<JSONObject> getDaYunLiuNian(EightChar eightChar, Integer gender, String type) {
        List<JSONObject> returnList = new ArrayList<>();
        CustomYun customYun = new CustomYun(eightChar, gender, type);
        CustomDaYun[] daYunArr = customYun.getCustomDaYun();
        for (int i = 0; i < daYunArr.length; i++) {
            CustomDaYun daYun = daYunArr[i];
            JSONObject daYunJson = new JSONObject();
            daYunJson.put("startYear", daYun.getStartYear());
            daYunJson.put("endYear", daYun.getEndYear());
            daYunJson.put("startAge", daYun.getStartAge());
            daYunJson.put("endAge", daYun.getEndAge());
            daYunJson.put("index", daYun.getIndex());
            daYunJson.put("ganZhi", daYun.getGanZhi());
//            daYunJson.put("xunKong", daYun.getXunKong());
            daYunJson.put("tianGanAttention", daYun.getTianGanAttention());
            daYunJson.put("diZhiAttention", daYun.getDiZhiAttention());
            daYunJson.put("shiShen", daYun.getShiShen());
            daYunJson.put("diShi", daYun.getDiShi());
            daYunJson.put("cangGan", daYun.getCangGan());
            daYunJson.put("cangGanShiShen", daYun.getCangGanShiShen());
            daYunJson.put("wealthStrong", daYun.getWealthStrong());
            daYunJson.put("shenSha", daYun.getShenSha());
            daYunJson.put("xiaoYun", daYun.getCustomXiaoYun());

            JSONArray liuNianArray = new JSONArray(); // 存储流年信息的 JSON 数组

            for (CustomLiuNian liuNian : daYun.getCustomLiuNian()) {
                JSONObject liuNianJson = new JSONObject(); // 存储流年信息的 JSON 对象

                liuNianJson.put("index", liuNian.getIndex());
                liuNianJson.put("year", liuNian.getYear());
                liuNianJson.put("age", liuNian.getAge());
                liuNianJson.put("ganZhi", liuNian.getGanZhi());
                liuNianJson.put("xunKong", liuNian.getXunKong());
                liuNianJson.put("tianGanAttention", liuNian.getTianGanAttention());
                liuNianJson.put("diZhiAttention", liuNian.getDiZhiAttention());
                liuNianJson.put("shiShen", liuNian.getShiShen());
                liuNianJson.put("cangGan", liuNian.getCangGan());
                liuNianJson.put("cangGanShiShen", liuNian.getCangGanShiShen());
                liuNianJson.put("wealthStrong", liuNian.getWealthStrong());
                liuNianJson.put("shenSha", liuNian.getShenSha());
                liuNianArray.add(liuNianJson);
            }
            daYunJson.put("customLiuNian", liuNianArray);
            returnList.add(daYunJson);
        }

        return returnList;
    }

    /**
     * 获取流月
     * @return
     */
    /**
     * 获取流月信息
     *
     * @param baZiBody 八字体信息
     * @return 流月信息数组
     */
    public static List<CustomLiuYue> getLiuYue(BaZiBody baZiBody) {
        // 获取地区编码，如果为空则使用默认值 "110100"
        String districtGeocode = StringUtils.defaultIfEmpty(baZiBody.getDistrictGeocode(), "110100");
        // 判断是否使用阳历
        boolean isSolar = baZiBody.isSolar();
        // 获取出生日期
        String birthDay = baZiBody.getBirthDay();
        // 获取性别
        String sex = baZiBody.getSex();
        // 将性别映射为性别代码，1 表示男性，0 表示女性
        int gender = "男".equals(sex) ? 1 : 0;

        // 初始化阳历时间和日期对象
        String trueSolarTime = null;
        Date date;
        if (isSolar) {
            trueSolarTime = SolarTimeUtil.getSolarTime(birthDay, districtGeocode);
            date = DateUtils.strToDate(trueSolarTime, DateUtils.YYYY_MM_DD_HH_MM);
        } else {
            date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        }

        // 获取阳历日期和八字信息
        Solar solarDate = Solar.fromDate(date);
        Lunar lunarDate = solarDate.getLunar();
        EightChar eightChar = lunarDate.getEightChar();
        eightChar.setSect(1); // 设置 sect 为 1，表示起运的八字
        // 获取目标年份
        int targetYear = DateUtils.getYear(baZiBody.getYearMonth(), DateUtils.YYYY);
        // 创建 CustomYun 实例，计算大运信息
        CustomYun customYun = new CustomYun(eightChar, gender,baZiBody.getType());
        CustomDaYun[] daYun = customYun.getCustomDaYun();
        // 获取目标年份对应的流月信息
        return getLiuYue(daYun, targetYear);
    }

    public static List<CustomLiuYue> getLiuYue(CustomDaYun[] daYunArray, int targetYear) {
        for (CustomDaYun customDaYun : daYunArray) {
            CustomLiuNian[] customLiuNianArray = customDaYun.getCustomLiuNian();
            for (CustomLiuNian customLiuNian : customLiuNianArray) {
                int year = customLiuNian.getYear();
                if (year == targetYear) {
                    return customLiuNian.getCustomLiuYue();
                }
            }
        }
        return null; // 如果未找到匹配的年份，返回一个空的 CustomLiuYue 数组
    }

    public static void main(String[] args) {
        BaZiBody baZiBody = new BaZiBody();
        baZiBody.setBirthDay("1978-05-12 23:37");
        baZiBody.setSex("男");
        baZiBody.setUserName("xk");
        baZiBody.setYearMonth("2035-1");
        BzPersonInfo bzPersonInfo = BzPersonInfo.fromBaZiBody(baZiBody);
        System.out.println(bzPersonInfo.toString());

    }

}
