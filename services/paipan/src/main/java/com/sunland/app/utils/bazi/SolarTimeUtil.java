package com.sunland.app.utils.bazi;

import cn.hutool.core.io.resource.Resource;
import cn.hutool.core.io.resource.ResourceUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.sunland.app.domain.bazi.ApparentSolarTime;
import com.sunland.app.domain.bazi.AreaInfo;
import com.sunland.app.domain.bazi.TreeNode;
import com.sunland.common.utils.DateUtils;
import com.sunland.common.utils.StringUtils;

import java.util.*;

/**
 * @author: xk
 * @create: 2023-06-30 14:40
 *
 *
 * 出生地方时间＝出生钟表时间—时间差
 *
 * 出生真太阳时＝出生地方时间—时间差
 */
public class SolarTimeUtil {


    private static final List<String> directMunicipalities = Arrays.asList("北京市", "天津市", "重庆市", "上海市", "香港", "澳门");
    private static final List<String> otherList = Arrays.asList("其他地区");

    private static final List<AreaInfo> areaInfosolarTimeList;
    private static final List<ApparentSolarTime> solarTimeList;

    static {
        areaInfosolarTimeList = loadAreaInfoList();
        solarTimeList = loadSolarTimeList();
    }

    private static List<AreaInfo> loadAreaInfoList() {
        Resource areaInforesource = ResourceUtil.getResourceObj("classpath:static/areaInfo.json");
        String areaInfocontent = areaInforesource.readUtf8Str();
        JSONArray areaInfojsonArray = JSON.parseArray(areaInfocontent);
        return areaInfojsonArray.toJavaList(AreaInfo.class);
    }

    private static List<ApparentSolarTime> loadSolarTimeList() {
        Resource resource = ResourceUtil.getResourceObj("classpath:static/apparentSolarTime.json");
        String content = resource.readUtf8Str();
        JSONArray jsonArray = JSON.parseArray(content);
        return jsonArray.toJavaList(ApparentSolarTime.class);
    }

    public static List<TreeNode> getProvinceCountry() {
        return convertToTree(areaInfosolarTimeList);
    }
    public static List<TreeNode> convertToTree(List<AreaInfo> areaInfoList) {
        List<TreeNode> tree = new ArrayList<>();
        Map<String, TreeNode> provinceMap = new HashMap<>();

        for (AreaInfo areaInfo : areaInfoList) {
            String districtId = areaInfo.getDistrictId();
            String province = areaInfo.getProvince();
            String cityGeocode = areaInfo.getCityGeocode();
            String city = areaInfo.getCity();
            String districtGeocode = areaInfo.getDistrictGeocode();
            String district = areaInfo.getDistrict();
            if (otherList.contains(province)) {
                // 一级节点（其他地区）
                TreeNode provinceNode = provinceMap.get(province);
                if (provinceNode == null) {
                    provinceNode = new TreeNode(province, districtId, new ArrayList<>()); // 初始化children字段
                    provinceMap.put(province, provinceNode);
                    tree.add(provinceNode);
                }
            }
            else if (directMunicipalities.contains(province)) {
                // 二级节点（直辖市）
                TreeNode provinceNode = provinceMap.get(province);
                if (provinceNode == null) {
                    provinceNode = new TreeNode(province, districtId, new ArrayList<>()); // 初始化children字段
                    provinceMap.put(province, provinceNode);
                    tree.add(provinceNode);
                }

                TreeNode districtNode = findChildNode(provinceNode.getChildren(), district, districtGeocode);
                if (districtNode == null) {
                    districtNode = new TreeNode(district, districtGeocode); // 初始化children字段
                    provinceNode.getChildren().add(districtNode);
                }
            }else {
                // 三级节点（非直辖市）
                TreeNode provinceNode = provinceMap.get(province);
                if (provinceNode == null) {
                    provinceNode = new TreeNode(province, districtId, new ArrayList<>()); // 初始化children字段
                    provinceMap.put(province, provinceNode);
                    tree.add(provinceNode);
                }

                TreeNode cityNode = findChildNode(provinceNode.getChildren(), city, cityGeocode);
                if (cityNode == null) {
                    cityNode = new TreeNode(city, cityGeocode, new ArrayList<>()); // 初始化children字段
                    provinceNode.getChildren().add(cityNode);
                }

                TreeNode districtNode = findChildNode(cityNode.getChildren(), district, districtGeocode);
                if (districtNode == null) {
                    districtNode = new TreeNode(district, districtGeocode); // 初始化children字段
                    cityNode.getChildren().add(districtNode);
                }
            }

        }
        return tree;
    }
    private static TreeNode findChildNode(List<TreeNode> nodes, String text, String value) {
        for (TreeNode node : nodes) {
            if (node.getText().equals(text) && node.getValue().equals(value)) {
                return node;
            }
        }
        return null;
    }

    public static String getArea(String districtGeocode) {
        AreaInfo areaInfo = areaInfosolarTimeList.stream()
                .filter(e -> e.getDistrictGeocode().equals(districtGeocode))
                .findFirst()
                .orElse(null);

        if (areaInfo == null) {
            return ""; // 或者抛出异常
        }

        String province = areaInfo.getProvince();
        if (directMunicipalities.contains(province)) {
            return areaInfo.getProvince() + areaInfo.getDistrict();
        } else {
            return areaInfo.getProvince() + areaInfo.getCity();
        }
    }
    public static AreaInfo getAreaInfo(String districtGeocode) {
        AreaInfo areaInfo = areaInfosolarTimeList.stream()
                .filter(e -> e.getDistrictGeocode().equals(districtGeocode))
                .findFirst()
                .orElse(null);

        return areaInfo;
    }


    public static String getSolarTime(String stringDate,String districtGeocode) {
        Calendar returnCalendar = Calendar.getInstance(DateUtils.TIME_ZONE);
        returnCalendar.setTime(DateUtils.strToDate(stringDate, DateUtils.YYYY_MM_DD_HH_MM));

        //出生地方时间＝出生钟表时间—时间差
        AreaInfo areaInfo = areaInfosolarTimeList.stream().filter(e -> e.getDistrictGeocode().equals(districtGeocode)).findFirst().get();
        Calendar localTimeBirth = getlocaltime(areaInfo.getTime(), returnCalendar);

        //出生真太阳时＝出生地方时间—时间差
        String monthAndDay = String.format("%d月%02d日", localTimeBirth.get(Calendar.MONTH) + 1, localTimeBirth.get(Calendar.DATE));
        ApparentSolarTime apparentSolarTime = solarTimeList.stream().filter(e -> e.getMonthAndDay().equals(monthAndDay)).findFirst().get();
        Calendar solartime = getlocaltime(apparentSolarTime.getTime(), localTimeBirth);

        return DateUtils.parseDateToStr(DateUtils.YYYY_MM_DD_HH_MM, solartime.getTime());
    }

    /**
     * 计算时间差
     *
     * @param timeDifference 时间差，格式为：[+/-]HH:mm:ss
     * @param cal            时间
     * @return 返回计算好的时间
     * @throws IllegalArgumentException 如果时间差格式不正确或符号不合法
     */
    public static Calendar getlocaltime(String timeDifference, Calendar cal) {
        Calendar returnCalendar = (Calendar) cal.clone();

        // 检查时间差格式是否正确，应为[+/-]HH:mm:ss
        if (!timeDifference.matches("[+-]\\d{1,2}(?::\\d{1,2})?(:\\d{1,2})?")) {
            throw new IllegalArgumentException("Invalid time difference format: " + timeDifference);
        }

        char sign = timeDifference.charAt(0);
        String[] timeParts = timeDifference.substring(1).split(":");

        int hours = 0;
        int minutes = 0;
        int seconds = 0;

        // 根据时间差的组成部分确定小时、分钟和秒数
        if (timeParts.length == 2) {
            minutes = Integer.parseInt(timeParts[0]);
            seconds = Integer.parseInt(timeParts[1]);
        } else if (timeParts.length == 3) {
            hours = Integer.parseInt(timeParts[0]);
            minutes = Integer.parseInt(timeParts[1]);
            seconds = Integer.parseInt(timeParts[2]);
        }

        // 根据符号（+/-）进行相应的时间计算
        switch (sign) {
            case '+':
                returnCalendar.add(Calendar.HOUR_OF_DAY, hours);
                returnCalendar.add(Calendar.MINUTE, minutes);
                returnCalendar.add(Calendar.SECOND, seconds);
                break;
            case '-':
                returnCalendar.add(Calendar.HOUR_OF_DAY, -hours);
                returnCalendar.add(Calendar.MINUTE, -minutes);
                returnCalendar.add(Calendar.SECOND, -seconds);
                break;
            default:
                // 如果符号不是+或-，则抛出异常
                throw new IllegalArgumentException("Invalid sign in time difference: " + sign);
        }

        return returnCalendar;
    }

    /**
     * 判断是否为空和是否存在这个地区
     * @param districtGeocode
     * @return
     */
    public static boolean isContain(String districtGeocode){
        if (StringUtils.isEmpty(districtGeocode)) {
            return false;
        }
        return areaInfosolarTimeList.stream()
                .anyMatch(areaInfo -> areaInfo.getDistrictGeocode().equals(districtGeocode));
    }
}
