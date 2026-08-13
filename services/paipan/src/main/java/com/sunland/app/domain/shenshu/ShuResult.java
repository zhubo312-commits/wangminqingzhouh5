package com.sunland.app.domain.shenshu;

import com.sunland.app.domain.param.BaZiBody;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author: xk
 * @create: 2023-11-02 10:41
 **/
@Data
public class ShuResult implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 五行数字对应
     */
    public static final Map<Integer, String> ELEMENT_MAP = new HashMap<Integer, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put(1, "水");
            this.put(2, "水");
            this.put(3, "土");
            this.put(4, "木");
            this.put(5, "木");
            this.put(6, "火");
            this.put(7, "火");
            this.put(8, "土");
            this.put(9, "土");
            this.put(10, "金");
            this.put(11, "金");
            this.put(12, "水");

        }
    };

    private Integer year;
    private Integer month;
    private List<Integer> day;
    private Integer hour;
    private String yearYinYang;
    private String monthYinYang;
    private List<String> dayYinYang;
    private String hourYinYang;
    private String yearWuXing;
    private String monthWuXing;
    private List<String> dayWuXing;
    private String hourWuXing;

    public static ShuResult getPrevShuResult(Integer year, Integer month, List<Integer> day, Integer hour) {
        return new ShuResult(year,month,day,hour);
    }

    public static ShuResult getNextShuResult(Integer year, Integer month, List<Integer> day, Integer hour) {
        return new ShuResult(convertToLaterNumber(year),convertToLaterNumber(month),convertToLaterNumber(day),convertToLaterNumber(hour));
    }

    public ShuResult(Integer year, Integer month, List<Integer> day, Integer hour) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.yearYinYang = determineYinYang(this.year);
        this.monthYinYang = determineYinYang(this.month);
        this.dayYinYang = determineYinYang(this.day);
        this.hourYinYang = determineYinYang(this.hour);
        this.yearWuXing = getElement(this.year);
        this.monthWuXing = getElement(this.month);
        this.dayWuXing = getElement(this.day);
        this.hourWuXing = getElement(this.hour);
    }

    /**
     * 先天数转后天数
     * @param number
     * @return
     */
    public static Integer convertToLaterNumber(Integer number) {
        if (number >= 1 && number <= 6) {
            return number + 6;
        } else if (number >= 7 && number <= 12) {
            return number - 6;
        }
        return 0;
    }

    public static List<Integer>  convertToLaterNumber(List<Integer> numbers) {
        List<Integer> results = new ArrayList<>();
        for (Integer number : numbers) {
            results.add(convertToLaterNumber(number));
        }
        return results;
    }



    /**
     * 数字转阴阳
     * @param number
     * @return
     */

    public static String determineYinYang(int number) {
        if (number >= 1 && number <= 4 || number == 11 || number == 12) {
            return "阳";
        } else if (number >= 5 && number <= 10) {
            return "阴";
        }
        return null;
    }

    public static List<String> determineYinYang(List<Integer> numbers) {
        List<String> results = new ArrayList<>();
        for (int number : numbers) {
            results.add(determineYinYang(number));
        }
        return results;
    }

    /**
     * 数字五行
     * @param number
     * @return
     */
    public static String getElement(int number) {
        return ELEMENT_MAP.getOrDefault(number, null);
    }

    public static List<String> getElement(List<Integer> numbers) {
        List<String> elements = new ArrayList<>();
        for (int number : numbers) {
            elements.add(getElement(number));
        }
        return elements;
    }
}
