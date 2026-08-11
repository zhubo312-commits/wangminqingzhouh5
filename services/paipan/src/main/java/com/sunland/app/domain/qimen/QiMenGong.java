package com.sunland.app.domain.qimen;

import com.sunland.app.domain.TitleContent;
import com.sunland.app.enums.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@Data
public class QiMenGong implements Serializable {
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
     * 八门
     */
    public BaMen baMen;

    /**
     * 八神
     */
    public String baShen;

    /**
     * 八星
     */
    public String baXing;

    /**
     * 五行
     */
    public WuXing wuXing;

    /**
     * 方位
     */
    public FangWei fangWei;

    /**
     * 地盘
     */
    public String diPan;

    /**
     * 天盘
     */
    public String tianPan;

    /**
     * 九星
     */
    public JiuXing jiuXing;

    /**
     * 空亡
     */
    public boolean isXunKong;

    /**
     * 值符
     */
    public boolean isZhiFu;

    /**
     * 值使
     */
    public boolean isZhiShi;

    /**
     * 马星
     */
    public boolean isMaXing;

    /**
     * 新八门
     */
    public String newBaMen;

    /**
     * 隐干
     */
    public String YinGan;

    /**
     * 刑墓迫【刑墓】
     */
    public List<SiHai> siHai;

    /**
     * 天干长生
     */
    public List<TitleContent> tianGanChangSheng;

    /**
     * 地支长生
     */
    public List<TitleContent> diZhiChangSheng;

    /**
     * 暗干
     */
    public String anGan;

    private Integer isSelect;
    private String dayGan;

    /**
     * 莲花天干长生
     */
    public List<TitleContent> lianHuaTianGanChangSheng;

    public QiMenGong(Integer index, BaGua baGua, BaMen baMen, WuXing wuXing, FangWei fangWei, JiuXing jiuXing) {
        this.index = index;
        this.baGua = baGua;
        this.baMen = baMen;
        this.wuXing = wuXing;
        this.fangWei = fangWei;
        this.jiuXing = jiuXing;
    }

    public static List<QiMenGong> initGong() {
        List<QiMenGong> qimenGong = new ArrayList<>(9);
        qimenGong.add(new QiMenGong(1, BaGua.坎, BaMen.休, WuXing.水, FangWei.北方, JiuXing.天蓬星));
        qimenGong.add(new QiMenGong(2, BaGua.坤, BaMen.死, WuXing.土, FangWei.西南, JiuXing.天芮星));
        qimenGong.add(new QiMenGong(3, BaGua.震, BaMen.伤, WuXing.木, FangWei.东方, JiuXing.天冲星));
        qimenGong.add(new QiMenGong(4, BaGua.巽, BaMen.杜, WuXing.木, FangWei.东南, JiuXing.天辅星));
        qimenGong.add(new QiMenGong(5, BaGua.中, BaMen.死, WuXing.土, FangWei.中央, JiuXing.天禽星));
        qimenGong.add(new QiMenGong(6, BaGua.乾, BaMen.开, WuXing.金, FangWei.西北, JiuXing.天心星));
        qimenGong.add(new QiMenGong(7, BaGua.兑, BaMen.惊, WuXing.金, FangWei.西方, JiuXing.天柱星));
        qimenGong.add(new QiMenGong(8, BaGua.艮, BaMen.生, WuXing.土, FangWei.东北, JiuXing.天任星));
        qimenGong.add(new QiMenGong(9, BaGua.离, BaMen.景, WuXing.火, FangWei.南方, JiuXing.天英星));
        return qimenGong;
    }
}
