package com.sunland.app.domain.bazi;

import java.io.Serializable;

/**
 * @author: xk
 * @create: 2023-06-30 13:33
 **/
public class ApparentSolarTime implements Serializable {

    private static final long serialVersionUID = 1L;

    private String monthAndDay;

    private String time;

    public String getMonthAndDay() {
        return monthAndDay;
    }

    public void setMonthAndDay(String monthAndDay) {
        this.monthAndDay = monthAndDay;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    @Override
    public String toString() {
        return "ApparentSolarTime{" +
                "monthAndDay='" + monthAndDay + '\'' +
                ", time='" + time + '\'' +
                '}';
    }
}
