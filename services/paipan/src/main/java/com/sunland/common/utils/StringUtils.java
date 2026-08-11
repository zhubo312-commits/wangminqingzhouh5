package com.sunland.common.utils;

public final class StringUtils {
    private StringUtils() {}

    public static boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static boolean isNotEmpty(String value) {
        return !isEmpty(value);
    }

    public static String defaultIfEmpty(String value, String defaultValue) {
        return isEmpty(value) ? defaultValue : value;
    }
}
