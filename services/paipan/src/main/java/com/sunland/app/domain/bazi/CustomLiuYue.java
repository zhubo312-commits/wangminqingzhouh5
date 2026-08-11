package com.sunland.app.domain.bazi;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nlf.calendar.*;
import com.nlf.calendar.util.LunarUtil;
import com.sunland.app.utils.bazi.AttentionUtil;
import com.sunland.app.utils.bazi.BaZiPinYinUtil;
import com.sunland.app.utils.bazi.BaZiUtil;
import com.sunland.app.utils.bazi.ShenShaDataUtil;
import com.sunland.common.constant.Constants;
import com.sunland.common.utils.StringUtils;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * @author: xk
 * @create: 2023-08-11 10:16
 **/
public class CustomLiuYue  implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int index;
    @JsonIgnore
    private final CustomLiuNian liuNian;
    @JsonIgnore
    private final String dayGan;
    @JsonIgnore
    private final String gan;
    @JsonIgnore
    private final String zhi;
    private final String ganZhi;
    @JsonIgnore
    private final Lunar lunar;
    @JsonIgnore
    private final EightChar eightChar;
    private final List<String> tianGanAttention;
    private final List<String> diZhiAttention;
    private final List<String> shiShen;
    private final String cangGan;
    private final List<String> cangGanShiShen;
    private final String jieSolar;
    private final String jieName;
    private final List<String> shenSha;
    private String type;


    public CustomLiuYue(CustomLiuNian liuNian, int index) {
        this.type = liuNian.getType();
        this.liuNian = liuNian;
        this.index = index;
        this.lunar = liuNian.getLunar();
        this.eightChar = liuNian.getEightChar();
        this.dayGan = this.lunar.getEightChar().getDayGan();
        this.ganZhi = this.getGanZhi();
        this.gan = ganZhi.substring(0, 1);
        this.zhi = ganZhi.substring(1);
        this.tianGanAttention = AttentionUtil.getTianGanAttention(this.eightChar.getYearGan(),this.eightChar.getMonthGan(),this.eightChar.getDayGan(),this.eightChar.getTimeGan(),this.liuNian.getDaYun().getGan(),this.liuNian.getGan(),this.gan);
        this.diZhiAttention = AttentionUtil.getDiZhiAttention(this.eightChar.getYearZhi(),this.eightChar.getMonthZhi(),this.eightChar.getDayZhi(),this.eightChar.getTimeZhi(),this.liuNian.getDaYun().getZhi(),this.liuNian.getZhi(),this.zhi);
        this.shiShen = this.getShiShen();
        this.cangGan = this.getCangGan();
        this.cangGanShiShen = this.getCangGanShiShen();
        this.jieName =this.getMonthJie().getName();
        this.jieSolar=this.getMonthJie().getSolar().toYmdHms();
        this.shenSha=getShenSha();
    }

    public List<String> getShenSha() {
        if (StringUtils.isNotEmpty(this.liuNian.getDaYun().getGanZhi())) {
            return ShenShaDataUtil.getShenshaWithGanzhi(BaZiPinYinUtil.getBaZiPinYin(this.lunar.getEightChar(),this.liuNian.getDaYun().getGanZhi(),this.liuNian.getGanZhi(), this.getGanZhi()), Constants.LIUYUE, type);
        }
        return null;
    }

    public int getIndex() {
        return this.index;
    }

    public String getMonthInChinese() {
        return LunarUtil.MONTH[this.index + 1];
    }

    @JsonIgnore
    public  JieQi getMonthJie() {
        // 创建一个农历实例，表示当前年份，从该年的第一天开始
        Lunar lunar = Lunar.fromYmd(this.liuNian.getYear(), 1, 1);
        // 获取该年的节气表
        Map<String, Solar> jieQiTable = lunar.getJieQiTable();
        // 获取“立春”节气的阳历日期
        Solar solar = jieQiTable.get("立春");
        // 创建一个列表，用于存储节气事件
        ArrayList<JieQi> jielist = new ArrayList<>(12);
        // 计算“立春”之后的下一个节气事件
        JieQi nextJie = solar.getLunar().next(1).getNextJie();
        // 将当前节气事件（立春）添加到列表中
        jielist.add(solar.getLunar().getCurrentJie());
        // 计算并添加接下来的11个节气事件到列表中
        for (int i = 0; i < 11; i++) {
            jielist.add(nextJie);
            nextJie = nextJie.getSolar().getLunar().next(1).getNextJie();
        }
        // 返回指定索引处的节气事件
        return jielist.get(this.index);

    }


    public String getGanZhi() {
        int offset = 0;
        String yearGan = this.liuNian.getGanZhi().substring(0, 1);
        if (!"甲".equals(yearGan) && !"己".equals(yearGan)) {
            if (!"乙".equals(yearGan) && !"庚".equals(yearGan)) {
                if (!"丙".equals(yearGan) && !"辛".equals(yearGan)) {
                    if ("丁".equals(yearGan) || "壬".equals(yearGan)) {
                        offset = 8;
                    }
                } else {
                    offset = 6;
                }
            } else {
                offset = 4;
            }
        } else {
            offset = 2;
        }

        String gan = LunarUtil.GAN[(this.index + offset) % 10 + 1];
        String zhi = LunarUtil.ZHI[(this.index + 2) % 12 + 1];
        return gan + zhi;
    }

    @JsonIgnore
    public String getXun() {
        return LunarUtil.getXun(this.getGanZhi());
    }

    public String getXunKong() {
        return LunarUtil.getXunKong(this.getGanZhi());
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

    public String getCangGan() {
        return BaZiUtil.CANG_GAN.get(this.zhi);
    }

    public List<String> getCangGanShiShen() {
        return getShiShenZhi(this.dayGan, this.zhi);
    }

    public CustomLiuNian getLiuNian() {
        return liuNian;
    }

    public String getDayGan() {
        return dayGan;
    }

    @JsonIgnore
    public Lunar getLunar() {
        return lunar;
    }
    @JsonIgnore
    public EightChar getEightChar() {
        return eightChar;
    }

    public String getJieSolar() {
        return jieSolar;
    }

    public String getJieName() {
        return jieName;
    }


    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    @Override
    public String toString() {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            return objectMapper.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            e.printStackTrace(); // 处理异常
            return null;
        }
    }
}
