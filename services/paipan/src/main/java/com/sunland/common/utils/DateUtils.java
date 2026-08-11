package com.sunland.common.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public final class DateUtils {
    public static final String YYYY = "yyyy";
    public static final String YYYY_MM = "yyyy-MM";
    public static final String YYYY_MM_DD = "yyyy-MM-dd";
    public static final String YYYY_MM_DD_HH_MM = "yyyy-MM-dd HH:mm";
    public static final String YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss";
    public static final TimeZone TIME_ZONE = TimeZone.getTimeZone("GMT+8");

    private DateUtils() {}

    public static String parseDateToStr(String format, Date date) {
        SimpleDateFormat formatter = formatter(format);
        return formatter.format(date);
    }

    public static Date strToDate(String date, String pattern) {
        try {
            return formatter(pattern).parse(date);
        } catch (ParseException exception) {
            throw new IllegalArgumentException("Invalid date/time", exception);
        }
    }

    public static int getYear(String date, String pattern) {
        Calendar calendar = Calendar.getInstance(TIME_ZONE);
        calendar.setTime(strToDate(date, pattern));
        return calendar.get(Calendar.YEAR);
    }

    public static int getMonth(String date, String pattern) {
        Calendar calendar = Calendar.getInstance(TIME_ZONE);
        calendar.setTime(strToDate(date, pattern));
        return calendar.get(Calendar.MONTH);
    }

    public static String getToday() {
        return parseDateToStr(YYYY_MM_DD, new Date());
    }

    public static String DateAddByYear(String date, Integer years) {
        Calendar calendar = Calendar.getInstance(TIME_ZONE);
        calendar.setTime(strToDate(date, YYYY_MM_DD));
        calendar.add(Calendar.YEAR, years);
        return parseDateToStr(YYYY_MM_DD, calendar.getTime());
    }

    public static int calculateYearsDifference(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        int years = end.getYear() - start.getYear();
        return end.withYear(start.getYear()).isBefore(start) ? years - 1 : years;
    }

    public static String getPreviousYear(String date) {
        return LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE)
                .minusYears(1)
                .format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    public static boolean compareFlowDate(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        return end.getMonthValue() < start.getMonthValue()
                || (end.getMonthValue() == start.getMonthValue()
                && end.getDayOfMonth() < start.getDayOfMonth());
    }

    private static SimpleDateFormat formatter(String pattern) {
        SimpleDateFormat formatter = new SimpleDateFormat(pattern);
        formatter.setLenient(false);
        formatter.setTimeZone(TIME_ZONE);
        return formatter;
    }
}
