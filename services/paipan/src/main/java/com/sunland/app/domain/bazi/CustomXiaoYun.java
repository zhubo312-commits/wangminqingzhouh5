package com.sunland.app.domain.bazi;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.eightchar.DaYun;
import com.nlf.calendar.util.LunarUtil;
import com.sunland.app.utils.bazi.BaZiUtil;
import com.sunland.common.utils.StringUtils;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author: xk
 * @create: 2023-12-19 14:41
 **/
public class CustomXiaoYun implements Serializable {

    /**
     * 序数，0-9
     */
    private final int index;

    /**
     * 大运
     */
    private final CustomDaYun daYun;

    /**
     * 年
     */
    private final int year;

    /**
     * 年龄
     */
    private final int age;

    /**
     * 是否顺推
     */
    private final boolean forward;

    private final Lunar lunar;
    @JsonIgnore
    private final String dayGan;
    @JsonIgnore
    private final String gan;
    @JsonIgnore
    private final String zhi;
    private final String ganZhi;
    private final List<String> shiShen;
    private final String cangGan;
    private final List<String> cangGanShiShen;

    public CustomXiaoYun(CustomDaYun daYun, int index, boolean forward) {
        this.daYun = daYun;
        this.lunar = daYun.getLunar();
        this.index = index;
        this.year = daYun.getStartYear() + index;
        this.age = daYun.getStartAge() + index;
        this.forward = forward;
        this.dayGan = this.lunar.getEightChar().getDayGan();
        this.ganZhi = this.getGanZhi();
        this.gan = ganZhi.substring(0, 1);
        this.zhi = ganZhi.substring(1);
        this.shiShen = this.getShiShen();
        this.cangGan = this.getCangGan();
        this.cangGanShiShen = this.getCangGanShiShen();
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
        List<String> hideGan = LunarUtil.ZHI_HIDE_GAN.get(zhi);
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

    public int getIndex() {
        return index;
    }

    public int getYear() {
        return year;
    }

    public int getAge() {
        return age;
    }

    /**
     * 获取干支
     *
     * @return 干支
     */
    public String getGanZhi() {
        int offset = LunarUtil.getJiaZiIndex(lunar.getTimeInGanZhi());
        int add = this.index + 1;
        if (daYun.getIndex() > 0) {
            add += daYun.getStartAge() - 1;
        }
        offset += forward ? add : -add;
        int size = LunarUtil.JIA_ZI.length;
        while (offset < 0) {
            offset += size;
        }
        offset %= size;
        return LunarUtil.JIA_ZI[offset];
    }

    /**
     * 获取所在旬
     * @return 旬
     */
    public String getXun(){
        return LunarUtil.getXun(getGanZhi());
    }

    /**
     * 获取旬空(空亡)
     * @return 旬空(空亡)
     */
    public String getXunKong(){
        return LunarUtil.getXunKong(getGanZhi());
    }

}
