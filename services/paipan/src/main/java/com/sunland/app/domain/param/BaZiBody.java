package com.sunland.app.domain.param;

import com.sunland.common.constant.Constants;

public class BaZiBody {
    private String userName;
    private String birthDay;
    private String sex;
    private boolean solar;
    private String districtGeocode;
    private String yearMonth;
    private String type = Constants.BAZI;

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getBirthDay() { return birthDay; }
    public void setBirthDay(String birthDay) { this.birthDay = birthDay; }
    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }
    public boolean isSolar() { return solar; }
    public void setSolar(boolean solar) { this.solar = solar; }
    public String getDistrictGeocode() { return districtGeocode; }
    public void setDistrictGeocode(String districtGeocode) { this.districtGeocode = districtGeocode; }
    public String getYearMonth() { return yearMonth; }
    public void setYearMonth(String yearMonth) { this.yearMonth = yearMonth; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
