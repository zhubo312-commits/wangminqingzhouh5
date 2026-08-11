package com.sunland.app.domain.bazi;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.util.LunarUtil;
import com.sunland.app.utils.bazi.*;
import com.sunland.common.constant.Constants;
import com.sunland.common.utils.StringUtils;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * @author: xk
 * @create: 2023-08-11 10:13
 **/
public class CustomDaYun implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int startYear;
    @JsonIgnore
    private final int endYear;
    private final int startAge;
    @JsonIgnore
    private final int endAge;
    @JsonIgnore
    private final int index;
    @JsonIgnore
    private final CustomYun yun;
    @JsonIgnore
    private final Lunar lunar;
    @JsonIgnore
    private final EightChar eightChar;
    @JsonIgnore
    private final String dayGan;
    @JsonIgnore
    private final String gan;
    @JsonIgnore
    private final String zhi;
    private final String ganZhi;
    private final List<String> tianGanAttention;
    private final List<String> diZhiAttention;
    private final List<String> shiShen;
    private final String diShi;
    private final String cangGan;
    private final List<String> cangGanShiShen;
    private final boolean wealthStrong;
    private final List<String> shenSha;
    private String type;


    public CustomDaYun(CustomYun yun, int index) {
        this.type = yun.getType();
        this.yun = yun;
        this.lunar = yun.getLunar();
        this.eightChar =this.lunar.getEightChar();
        this.index = index;
        int birthYear = this.lunar.getSolar().getYear();
        int year = yun.getStartSolar().getYear();
        if (index < 1) {
            this.startYear = birthYear;
            this.startAge = 1;
            this.endYear = year - 1;
            this.endAge = year - birthYear;
        } else {
            int add = (index - 1) * 10;
            this.startYear = year + add;
            this.startAge = this.startYear - birthYear + 1;
            this.endYear = this.startYear + 9;
            this.endAge = this.startAge + 9;
        }
        this.dayGan = this.lunar.getEightChar().getDayGan();
        this.ganZhi = this.getGanZhi();
        this.gan = !ganZhi.isEmpty() ? ganZhi.substring(0, 1) : "";
        this.zhi = !ganZhi.isEmpty() ? ganZhi.substring(1) : "";
        this.tianGanAttention = AttentionUtil.getTianGanAttention(this.eightChar.getYearGan(), this.eightChar.getMonthGan(), this.eightChar.getDayGan(), this.eightChar.getTimeGan(), this.gan);
        this.diZhiAttention = AttentionUtil.getDiZhiAttention(this.eightChar.getYearZhi(), this.eightChar.getMonthZhi(), this.eightChar.getDayZhi(), this.eightChar.getTimeZhi(), this.zhi);
        this.shiShen = this.getShiShen();
        this.diShi = this.getDiShi();
        this.cangGan = this.getCangGan();
        this.cangGanShiShen = this.getCangGanShiShen();
        this.wealthStrong = this.getWealthStrong();
        this.shenSha = this.getShenSha();
    }

    public List<String> getShenSha() {
        if (StringUtils.isNotEmpty(this.ganZhi)) {
            return ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(this.lunar.getEightChar(), this.getGanZhi()), Constants.DAYUN, type);
        }
        return null;
    }

    public boolean getWealthStrong() {
        return this.shiShen.contains("正财") || this.shiShen.contains("偏财") || InnateWealthUtil.DAY_GAN_CAIKU.get(this.dayGan).equals(this.zhi);
    }

    public int getStartYear() {
        return this.startYear;
    }

    public int getEndYear() {
        return this.endYear;
    }

    public int getStartAge() {
        return this.startAge;
    }

    public int getEndAge() {
        return this.endAge;
    }

    public int getIndex() {
        return this.index;
    }

    @JsonIgnore
    public Lunar getLunar() {
        return this.lunar;
    }

    @JsonIgnore
    public EightChar getEightChar() {
        return eightChar;
    }

    public String getGanZhi() {
        if (this.index < 1) {
            return "";
        } else {
            int offset = LunarUtil.getJiaZiIndex(this.lunar.getMonthInGanZhiExact());
            offset += this.yun.isForward() ? this.index : -this.index;
            int size = LunarUtil.JIA_ZI.length;
            if (offset >= size) {
                offset -= size;
            }

            if (offset < 0) {
                offset += size;
            }

            return LunarUtil.JIA_ZI[offset];
        }
    }

    @JsonIgnore
    public String getXun() {
        return LunarUtil.getXun(this.getGanZhi());
    }

    public String getXunKong() {
        return LunarUtil.getXunKong(this.getGanZhi());
    }

    public CustomLiuNian[] getCustomLiuNian() {
        return this.getCustomLiuNian(10);
    }

    public CustomLiuNian[] getCustomLiuNian(int n) {
        if (this.index < 1) {
            n = this.endYear - this.startYear + 1;
        }

        CustomLiuNian[] l = new CustomLiuNian[n];

        for (int i = 0; i < n; ++i) {
            l[i] = new CustomLiuNian(this, i);
        }

        return l;
    }

    /**
     * 获取10轮小运
     *
     * @return 小运
     */
    public CustomXiaoYun[] getCustomXiaoYun() {
        return getCustomXiaoYun(10);
    }

    /**
     * 获取小运
     * @param n 轮数
     * @return 小运
     */
    public CustomXiaoYun[] getCustomXiaoYun(int n) {
        if (index < 1) {
            n = endYear-startYear+1;
        }
        CustomXiaoYun[] l = new CustomXiaoYun[n];
        for (int i = 0; i < n; i++) {
            l[i] = new CustomXiaoYun(this, i, yun.isForward());
        }
        return l;
    }

    public String getGan() {
        return gan;
    }

    public String getZhi() {
        return zhi;
    }

    public List<String> getTianGanAttention() {
        return tianGanAttention;
    }

    public List<String> getDiZhiAttention() {
        return diZhiAttention;
    }

    public List<String> getShiShen() {
        List<String> yshishen = new ArrayList<>(2);
        yshishen.add(LunarUtil.SHI_SHEN.get(this.dayGan + this.gan));
        List<String> zhiShiShenList = getShiShenZhi(this.dayGan, this.zhi);
        if (!zhiShiShenList.isEmpty()) {
            yshishen.add(zhiShiShenList.get(0));
        }

        return yshishen;
    }

    public List<String> getShiShenZhi(String dayGan, String zhi) {
        List<String> result = new ArrayList<>();
        if (StringUtils.isEmpty(zhi)) {
            return result;
        }
        // 区分九龙和普通八字
        List<String> hideGan = LunarUtil.ZHI_HIDE_GAN.get(zhi);
        if (Constants.JIULONG.equals(type)){
            hideGan = Arrays.asList(BaZiUtil.CANG_GAN.get(zhi).split(","));
        }
        for (String gan : hideGan) {
            String shiShenZhi = LunarUtil.SHI_SHEN.get(dayGan + gan);
            result.add(shiShenZhi);
        }

        return result;
    }

    public String getDiShi() {
        return BzPersonInfo.getDishiWithDizhi(this.dayGan, this.zhi);
    }

    public String getCangGan() {
        return BaZiUtil.CANG_GAN.get(this.zhi);
    }

    public List<String> getCangGanShiShen() {
        return getShiShenZhi(this.dayGan, this.zhi);
    }

    public CustomYun getYun() {
        return yun;
    }

    public String getDayGan() {
        return dayGan;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }


}
