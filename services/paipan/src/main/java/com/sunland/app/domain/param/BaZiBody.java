package com.sunland.app.domain.param;

import com.sunland.common.constant.Constants;

import java.util.List;

public class BaZiBody {
    private String userName;
    private String birthDay;
    private String sex;
    private boolean solar;
    private String districtGeocode;
    private String yearMonth;
    private String question;
    private String isKe;
    private Double degrees;
    private List<Double> degreesList;
    private Integer year;
    private String lotusGateFlowDate;
    private Integer juShu;
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
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getIsKe() { return isKe; }
    public void setIsKe(String isKe) { this.isKe = isKe; }
    public Double getDegrees() { return degrees; }
    public void setDegrees(Double degrees) { this.degrees = degrees; }
    public List<Double> getDegreesList() { return degreesList; }
    public void setDegreesList(List<Double> degreesList) { this.degreesList = degreesList; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLotusGateFlowDate() { return lotusGateFlowDate; }
    public void setLotusGateFlowDate(String lotusGateFlowDate) { this.lotusGateFlowDate = lotusGateFlowDate; }
    public Integer getJuShu() { return juShu; }
    public void setJuShu(Integer juShu) { this.juShu = juShu; }
}
