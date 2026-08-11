package com.sunland.app.domain.bazi;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.nlf.calendar.EightChar;
import com.nlf.calendar.JieQi;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.nlf.calendar.util.LunarUtil;

import java.io.IOException;
import java.io.ObjectOutputStream;
import java.io.Serializable;

/**
 * @author: xk
 * @create: 2023-08-11 10:12
 **/
public class CustomYun implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int gender;
    private int startYear;
    private int startMonth;
    private int startDay;
    private int startHour;
    private final boolean forward;
    @JsonIgnore
    private final Lunar lunar;
    private String type;

    public CustomYun(EightChar eightChar, int gender ,String type) {
        this(eightChar, gender, 2);
        this.type = type;
    }
    public CustomYun(EightChar eightChar, int gender) {
        this(eightChar, gender, 2);
    }

    public CustomYun(EightChar eightChar, int gender, int sect) {
        this.lunar = eightChar.getLunar();
        this.gender = gender;
        boolean yang = 0 == this.lunar.getYearGanIndexExact() % 2;
        boolean man = 1 == gender;
        this.forward = yang && man || !yang && !man;
        this.computeStart(sect);
    }

    private void computeStart(int sect) {
        JieQi prev = this.lunar.getPrevJie();
        JieQi next = this.lunar.getNextJie();
        Solar current = this.lunar.getSolar();
        Solar start = this.forward ? current : prev.getSolar();
        Solar end = this.forward ? next.getSolar() : current;
        int hour = 0;
        int year;
        int month;
        int day;
        if (2 == sect) {
            long minutes = (long)end.subtractMinute(start);
            long y = minutes / 4320L;
            minutes -= y * 4320L;
            long m = minutes / 360L;
            minutes -= m * 360L;
            long d = minutes / 12L;
            minutes -= d * 12L;
            long h = minutes * 2L;
            year = (int)y;
            month = (int)m;
            day = (int)d;
            hour = (int)h;
        } else {
            int endTimeZhiIndex = end.getHour() == 23 ? 11 : LunarUtil.getTimeZhiIndex(end.toYmdHms().substring(11, 16));
            int startTimeZhiIndex = start.getHour() == 23 ? 11 : LunarUtil.getTimeZhiIndex(start.toYmdHms().substring(11, 16));
            int hourDiff = endTimeZhiIndex - startTimeZhiIndex;
            int dayDiff = end.subtract(start);
            if (hourDiff < 0) {
                hourDiff += 12;
                --dayDiff;
            }

            int monthDiff = hourDiff * 10 / 30;
            month = dayDiff * 4 + monthDiff;
            day = hourDiff * 10 - monthDiff * 30;
            year = month / 12;
            month -= year * 12;
        }

        this.startYear = year;
        this.startMonth = month;
        this.startDay = day;
        this.startHour = hour;
    }

    public int getGender() {
        return this.gender;
    }

    public int getStartYear() {
        return this.startYear;
    }

    public int getStartMonth() {
        return this.startMonth;
    }

    public int getStartDay() {
        return this.startDay;
    }

    public int getStartHour() {
        return this.startHour;
    }

    public boolean isForward() {
        return this.forward;
    }

    @JsonIgnore
    public Lunar getLunar() {
        return this.lunar;
    }

    public Solar getStartSolar() {
        Solar solar = this.lunar.getSolar();
        solar = solar.nextYear(this.startYear);
        solar = solar.nextMonth(this.startMonth);
        solar = solar.next(this.startDay);
        return solar.nextHour(this.startHour);
    }

    public CustomDaYun[] getCustomDaYun() {
        return this.getCustomDaYun(11);
    }

    public CustomDaYun[] getCustomDaYun(int n) {
        CustomDaYun[] l = new CustomDaYun[n];

        for(int i = 0; i < n; ++i) {
            l[i] = new CustomDaYun(this, i);
        }

        return l;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
