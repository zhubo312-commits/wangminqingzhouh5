package com.sunland.app.domain.xuankongfeixing;

import com.sunland.app.enums.*;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author: xk
 * @create: 2024-01-09 16:08
 **/
@Data
public class XuanKongFeiXingGong implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 宫位
     */
    public Integer index;

    /**
     * 八卦
     */
    public BaGua baGua;

    /**
     * 方位
     */
    public FangWei fangWei;

    /**
     * 五行
     * 一水，二土，三木，四木，五土，六金，七金，八土，九火
     */
    public WuXing wuXing;

    /**
     * 宫位颜色
     * 一白、二黑、三碧、四绿、五黄、六白、七赤、八白,九紫
     */
    public GongColor gongColor;

    /**
     * 飞星
     * 一白贪狼星, 二黑巨门星, 三碧禄存星, 四绿文曲星, 五黄廉贞星, 六白武曲星, 七赤破军星, 八白左辅星, 九紫右弼星
     */
    public XuanKongFeiXingStar xuanKongFeiXingStar;

    /**
     * 大运
     */
    public String daYun;

    /**
     * 山
     */
    public Integer shan;

    /**
     * 向
     */
    public Integer xiang;

    /**
     * 年飞星
     */
    public Integer yearFlyingStar;

    /**
     * 月飞星
     */
    public Integer monthFlyingStar;

    /**
     * 日飞星
     */
    public Integer dayFlyingStar;

    /**
     * 时飞星
     */
    public Integer hourFlyingStar;

    /**
     * 山位置
     */
    public String shanPostion;

    /**
     * 向位置
     */
    public String xiangPostion;

    /**
     * 山+向解释
     */
    public String shanAndXiangExplain;

    /**
     * 运解释
     */
    public String daYunExplain;

    /**
     * 山解释
     */
    public String shanExplain;

    /**
     * 向解释
     */
    public String xiangExplain;

    /**
     * 年飞星解释
     */
    public String yearFlyingStarExplain;




    public XuanKongFeiXingGong(Integer index, BaGua baGua, FangWei fangWei, WuXing wuXing, GongColor gongColor, XuanKongFeiXingStar xuanKongFeiXingStar) {
        this.index = index;
        this.baGua = baGua;
        this.fangWei = fangWei;
        this.wuXing = wuXing;
        this.gongColor = gongColor;
        this.xuanKongFeiXingStar = xuanKongFeiXingStar;
    }

    public static List<XuanKongFeiXingGong> initGong() {
        List<XuanKongFeiXingGong> xuanKongFeiXingGong = new ArrayList<>(9);
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(1, BaGua.坎, FangWei.北方, WuXing.水, GongColor.white, XuanKongFeiXingStar.贪狼星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(2, BaGua.坤, FangWei.西南, WuXing.土, GongColor.black, XuanKongFeiXingStar.巨门星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(3, BaGua.震, FangWei.东方, WuXing.木, GongColor.green, XuanKongFeiXingStar.禄存星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(4, BaGua.巽, FangWei.东南, WuXing.木, GongColor.darkGreen, XuanKongFeiXingStar.文曲星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(5, BaGua.中, FangWei.中央, WuXing.土, GongColor.yellow, XuanKongFeiXingStar.廉贞星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(6, BaGua.乾, FangWei.西北, WuXing.金, GongColor.white, XuanKongFeiXingStar.武曲星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(7, BaGua.兑, FangWei.西方, WuXing.金, GongColor.red, XuanKongFeiXingStar.破军星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(8, BaGua.艮, FangWei.东北, WuXing.土, GongColor.white, XuanKongFeiXingStar.左辅星));
        xuanKongFeiXingGong.add(new XuanKongFeiXingGong(9, BaGua.离, FangWei.南方, WuXing.火, GongColor.purple, XuanKongFeiXingStar.右弼星));
        return xuanKongFeiXingGong;
    }
}
