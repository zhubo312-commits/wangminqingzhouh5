package com.sunland.app.domain.bazi;

import java.io.Serializable;
import java.util.List;

/**
 * @author: xk
 * @create: 2023-07-05 11:18
 **/
public class ShenShaData implements Serializable {
    private static final long serialVersionUID = 1L;
    private List<String> base4zhus;
    private String baseGanOrZhi;
    private String baseGanZhiName;
    private List<String> check4zhus;
    private String checkGanOrZhi;
    private List<String> checkGanZhiNames;
    private String result;

    public List<String> getBase4zhus() {
        return base4zhus;
    }

    public void setBase4zhus(List<String> base4zhus) {
        this.base4zhus = base4zhus;
    }

    public String getBaseGanOrZhi() {
        return baseGanOrZhi;
    }

    public void setBaseGanOrZhi(String baseGanOrZhi) {
        this.baseGanOrZhi = baseGanOrZhi;
    }

    public String getBaseGanZhiName() {
        return baseGanZhiName;
    }

    public void setBaseGanZhiName(String baseGanZhiName) {
        this.baseGanZhiName = baseGanZhiName;
    }

    public List<String> getCheck4zhus() {
        return check4zhus;
    }

    public void setCheck4zhus(List<String> check4zhus) {
        this.check4zhus = check4zhus;
    }

    public String getCheckGanOrZhi() {
        return checkGanOrZhi;
    }

    public void setCheckGanOrZhi(String checkGanOrZhi) {
        this.checkGanOrZhi = checkGanOrZhi;
    }

    public List<String> getCheckGanZhiNames() {
        return checkGanZhiNames;
    }

    public void setCheckGanZhiNames(List<String> checkGanZhiNames) {
        this.checkGanZhiNames = checkGanZhiNames;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    @Override
    public String toString() {
        return "ShenShaData{" +
                "base4zhus=" + base4zhus +
                ", baseGanOrZhi='" + baseGanOrZhi + '\'' +
                ", baseGanZhiName='" + baseGanZhiName + '\'' +
                ", check4zhus=" + check4zhus +
                ", checkGanOrZhi='" + checkGanOrZhi + '\'' +
                ", checkGanZhiNames=" + checkGanZhiNames +
                ", result='" + result + '\'' +
                '}';
    }
}
