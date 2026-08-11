package com.sunland.app.domain.bazi;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
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
 * @create: 2023-08-11 10:15
 **/
public class CustomLiuNian implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonIgnore
    private final int index;
    @JsonIgnore
    private final CustomDaYun daYun;
    private final int year;
    private final int age;
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
    private final String cangGan;
    private final List<String> cangGanShiShen;
    private final boolean  wealthStrong;
    private final List<String> shenSha;
    private String type;

    public CustomLiuNian(CustomDaYun daYun, int index) {
        this.type = daYun.getType();
        this.daYun = daYun;
        this.lunar = daYun.getLunar();
        this.eightChar =daYun.getEightChar();
        this.index = index;
        this.year = daYun.getStartYear() + index;
        this.age = daYun.getStartAge() + index;
        this.dayGan = this.lunar.getEightChar().getDayGan();
        this.ganZhi = this.getGanZhi();
        this.gan = ganZhi.substring(0, 1);
        this.zhi = ganZhi.substring(1);
        this.tianGanAttention = AttentionUtil.getTianGanAttention(this.eightChar.getYearGan(),this.eightChar.getMonthGan(),this.eightChar.getDayGan(),this.eightChar.getTimeGan(),this.daYun.getGan(),this.gan);
        this.diZhiAttention = AttentionUtil.getDiZhiAttention(this.eightChar.getYearZhi(),this.eightChar.getMonthZhi(),this.eightChar.getDayZhi(),this.eightChar.getTimeZhi(),this.daYun.getZhi(),this.zhi);
        this.shiShen = this.getShiShen();
        this.cangGan = this.getCangGan();
        this.cangGanShiShen = this.getCangGanShiShen();
        this.wealthStrong = this.getWealthStrong();
        this.shenSha = this.getShenSha();
    }
    public List<String> getShenSha() {
        if (StringUtils.isNotEmpty(this.daYun.getGanZhi())) {
            return ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(this.lunar.getEightChar(),this.daYun.getGanZhi(), this.getGanZhi()), Constants.LIUNIAN, type);
        }
        return null;
    }
    public boolean getWealthStrong() {
        return this.shiShen.contains("正财") || this.shiShen.contains("偏财") || InnateWealthUtil.DAY_GAN_CAIKU.get(this.dayGan).equals(this.zhi);
    }
    public int getIndex() {
        return this.index;
    }

    public int getYear() {
        return this.year;
    }

    public int getAge() {
        return this.age;
    }

    public String getGanZhi() {
        int offset = LunarUtil.getJiaZiIndex(((Solar) this.lunar.getJieQiTable().get("立春")).getLunar().getYearInGanZhiExact()) + this.index;
        if (this.daYun.getIndex() > 0) {
            offset += this.daYun.getStartAge() - 1;
        }

        offset %= LunarUtil.JIA_ZI.length;
        return LunarUtil.JIA_ZI[offset];
    }

    @JsonIgnore
    public String getXun() {
        return LunarUtil.getXun(this.getGanZhi());
    }

    public String getXunKong() {
        return LunarUtil.getXunKong(this.getGanZhi());
    }

    public List<CustomLiuYue>  getCustomLiuYue() {
        ArrayList<CustomLiuYue> l = new ArrayList<>();
        int n = 12;

        for (int i = 0; i < n; ++i) {
            l.add(new CustomLiuYue(this, i)) ;
        }

        return l;
    }

    @JsonIgnore
    public Lunar getLunar() {
        return this.lunar;
    }

    @JsonIgnore
    public EightChar getEightChar() {
        return eightChar;
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

    public CustomDaYun getDaYun() {
        return daYun;
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

    public String getCangGan() {
        return BaZiUtil.CANG_GAN.get(this.zhi);
    }

    public List<String> getCangGanShiShen() {
        return getShiShenZhi(this.dayGan, this.zhi);
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

    @Override
    public String toString() {
        return "CustomLiuNian{" +
                "index=" + index +
                ", daYun=" + daYun +
                ", year=" + year +
                ", age=" + age +
                ", lunar=" + lunar +
                ", dayGan='" + dayGan + '\'' +
                ", gan='" + gan + '\'' +
                ", zhi='" + zhi + '\'' +
                ", ganZhi='" + ganZhi + '\'' +
                ", tianGanAttention=" + tianGanAttention +
                ", diZhiAttention=" + diZhiAttention +
                ", shiShen=" + shiShen +
                ", cangGan='" + cangGan + '\'' +
                ", cangGanShiShen=" + cangGanShiShen +
                ", wealthStrong=" + wealthStrong +
                ", shenSha=" + shenSha +
                '}';
    }
}
