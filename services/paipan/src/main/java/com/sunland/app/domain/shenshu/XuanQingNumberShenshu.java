package com.sunland.app.domain.shenshu;

import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.common.utils.DateUtils;
import lombok.Data;

import java.io.Serializable;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * @author: xk
 * @create: 2023-11-01 16:53
 **/
@Data
public class XuanQingNumberShenshu implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 生肖
     */
    public static List<String> zodiacAnimals = Arrays.asList("鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪");

    /**
     * 姓名
     */
    private String userName;

    /**
     * 性别
     */
    private String sex;

    /**
     * 公历年份
     */
    private String yearGongLi;

    /**
     * 农历年份
     */
    private String yearNongLi;

    /**
     * 生肖
     */
    private String chineseZodiac;

    /**
     * 年取数
     */
    private Integer yearNumber;

    /**
     * 月取数
     */
    private Integer monthNumber;

    /**
     * 日取数
     */
    private List<Integer>  dayNumber;

    /**
     * 时取数
     */
    private Integer hourNumber;

    /**
     * 先天
     */
    private ShuResult prev;


    /**
     * 后天
     */
    private ShuResult next;

    /**
     * 解读
     */
    private List<ShuDes> ShuDesList;



    public static XuanQingNumberShenshu getXuanQingNumberShenshu(BaZiBody baZiBody) {
        return new XuanQingNumberShenshu(baZiBody);
    }

    public XuanQingNumberShenshu(BaZiBody baZiBody) {
        String birthDay = baZiBody.getBirthDay();
        Date date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar ldate = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//阴历23点算下一天
        this.userName = baZiBody.getUserName();
        this.sex = baZiBody.getSex();
        this.yearGongLi = birthDay;
        this.yearNongLi = ldate.getYearInChinese() + "年" + ldate.getMonthInChinese() + "月" + ldate.getDayInChinese() + "日"  + ldate.getTimeZhi() + "时";
        this.chineseZodiac = ldate.getYearShengXiao();
        this.yearNumber = getYearNumber(this.chineseZodiac);
        this.monthNumber = getMonthNumber(ldate);
        this.dayNumber = getDayNumber(ldate);
        this.hourNumber = getHourNumber(ldate);
        this.prev = ShuResult.getPrevShuResult(this.yearNumber,this.monthNumber,this.dayNumber,this.hourNumber);
        this.next = ShuResult.getNextShuResult(this.yearNumber,this.monthNumber,this.dayNumber,this.hourNumber);
        this.ShuDesList = ShuDes.getShuDesList(this.prev,this.next);
    }



    /**
     * 计算时取数
     * @param ldate
     * @return
     */
    private Integer getHourNumber(Lunar ldate) {
        return  ldate.getTimeZhiIndex()+1;
    }
    /**
     * 计算日取数
     * @param ldate
     * @return
     */
    private List<Integer> getDayNumber(Lunar ldate) {
        return integerToList(ldate.getDay());
    }
    /**
     * 计算月取数
     * @return
     */
    private Integer getMonthNumber(Lunar ldate) {
        return Math.abs(ldate.getMonth());
    }

    /**
     * 计算年取数
     * @param chineseZodiac
     * @return
     */
    private Integer getYearNumber(String chineseZodiac) {
        return zodiacAnimals.indexOf(chineseZodiac)+1;
    }

    /**
     * 天数转换
     * @param num
     * @return
     */
    public static List<Integer> integerToList(int num) {
        List<Integer> digits = new ArrayList<>();
        if (num >= 1 && num <= 12) {
            digits.add(num);
        } else if (num == 20 || num == 30) {
            int tensDigit = (num / 10) % 10;  // 获取十位数
            digits.add(0,tensDigit );  // 将数字添加到列表的开头
            digits.add(1,10);
        }else {
            int tensDigit = (num / 10) % 10;  // 获取十位数
            int onesDigit = num % 10;  // 获取个位数
            digits.add(0,tensDigit );  // 将数字添加到列表的开头
            digits.add(1,10);
            digits.add(2,onesDigit);
        }
        return digits;
    }




    public static void main(String[] args) throws ParseException {
        String initialDateStr = "2023-3-5 23:13:00";
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

        Date currentDate = sdf.parse(initialDateStr);
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(currentDate);


        for (int i = 0; i < 9000; i++) {
            // 执行每一天的操作

            // 在这里执行你的操作，例如获取奇门造命对象并计算奇门盘

            // 增加一天
            calendar.add(Calendar.DAY_OF_MONTH, 1);
            currentDate = calendar.getTime();



            String currentDateStr = sdf.format(currentDate);
            BaZiBody baZiBody = new BaZiBody();
            baZiBody.setBirthDay(currentDateStr);
            System.out.println(getXuanQingNumberShenshu(baZiBody));

        }

    }




}
