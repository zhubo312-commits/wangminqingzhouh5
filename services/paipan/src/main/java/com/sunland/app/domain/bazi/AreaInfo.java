package com.sunland.app.domain.bazi;

import java.io.Serializable;

/**
 * @author: xk
 * @create: 2023-06-30 13:29
 **/
public class AreaInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    private String districtId;
    private String province;
    private String city;
    private String cityGeocode;
    private String district;
    private String districtGeocode;
    private String lon;
    private String lat;
    private String time;

    public String getDistrictId() {
        return districtId;
    }

    public void setDistrictId(String districtId) {
        this.districtId = districtId;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCityGeocode() {
        return cityGeocode;
    }

    public void setCityGeocode(String cityGeocode) {
        this.cityGeocode = cityGeocode;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getDistrictGeocode() {
        return districtGeocode;
    }

    public void setDistrictGeocode(String districtGeocode) {
        this.districtGeocode = districtGeocode;
    }

    public String getLon() {
        return lon;
    }

    public void setLon(String lon) {
        this.lon = lon;
    }

    public String getLat() {
        return lat;
    }

    public void setLat(String lat) {
        this.lat = lat;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    @Override
    public String toString() {
        return "AreaInfo{" +
                "districtId='" + districtId + '\'' +
                ", province='" + province + '\'' +
                ", city='" + city + '\'' +
                ", cityGeocode='" + cityGeocode + '\'' +
                ", district='" + district + '\'' +
                ", districtGeocode='" + districtGeocode + '\'' +
                ", lon='" + lon + '\'' +
                ", lat='" + lat + '\'' +
                ", time='" + time + '\'' +
                '}';
    }
}
