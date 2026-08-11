package com.sunland.app.utils;

/**
 * @author: xk
 * @create: 2023-06-29 16:34
 **/
public class WuXingUtil {
    /**
     * 根据输入的五行元素返回其生的五行
     */
    public static String getWoSheng(String wuxing) {
        String wx = "";
        switch (wuxing) {
            case "金":
                wx = "水";
                break;
            case "木":
                wx = "火";
                break;
            case "水":
                wx = "木";
                break;
            case "火":
                wx = "土";
                break;
            case "土":
                wx = "金";
                break;
            default:
                wx = "";
                break;
        }
        return wx;
    }

    /**
     * 根据输入的五行元素返回其克的五行
     * @param wuxing
     * @return
     */
    public static String getWoKe(String wuxing) {
        String wx = "";
        switch (wuxing) {
            case "金":
                wx = "木";
                break;
            case "木":
                wx = "土";
                break;
            case "水":
                wx = "火";
                break;
            case "火":
                wx = "金";
                break;
            case "土":
                wx = "水";
                break;
            default:
                wx = "";
                break;
        }
        return wx;
    }

    /**
     *  获取生自己的五行
     * @param wuxing
     * @return
     */
    public static String getShengWo(String wuxing) {
        String wx = "";
        switch (wuxing) {
            case "金":
                wx = "土";
                break;
            case "木":
                wx = "水";
                break;
            case "水":
                wx = "金";
                break;
            case "火":
                wx = "木";
                break;
            case "土":
                wx = "火";
                break;
            default:
                wx = "";
        }
        return wx;
    }

    /**
     *  获取克自己的五行
     * @param wuxing
     * @return
     */
    public static String getKeWo(String wuxing) {
        String wx = "";
        switch (wuxing) {
            case "金":
                wx = "火";
                break;
            case "木":
                wx = "金";
                break;
            case "水":
                wx = "土";
                break;
            case "火":
                wx = "水";
                break;
            case "土":
                wx = "木";
                break;
            default:
                wx = "";
        }
        return wx;
    }


    // 判断五行之间的关系
    public static String getRelationship(String woWx, String otherWx) {
        if (getWoSheng(woWx).equals(otherWx)) {
            return "我生";
        } else if (getShengWo(woWx).equals(otherWx)) {
            return "生我";
        } else if (getWoKe(woWx).equals(otherWx)) {
            return "我克";
        } else if (getKeWo(woWx).equals(otherWx)) {
            return "克我";
        } else if (woWx.equals(otherWx)) {
            return "同我";
        } else {
            return "无关系";
        }
    }

    // 判断五行之间的关系获取十神
    public static String getRelationshipShiShen(String woWx, String otherWx) {
        if (getWoSheng(woWx).equals(otherWx)) {
            return "食伤";
        } else if (getShengWo(woWx).equals(otherWx)) {
            return "印枭";
        } else if (getWoKe(woWx).equals(otherWx)) {
            return "财才";
        } else if (getKeWo(woWx).equals(otherWx)) {
            return "官杀";
        } else if (woWx.equals(otherWx)) {
            return "比劫";
        } else {
            return "无关系";
        }
    }


}
