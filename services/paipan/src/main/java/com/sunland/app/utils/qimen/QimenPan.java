package com.sunland.app.utils.qimen;

import com.alibaba.fastjson.JSONObject;
import com.sunland.app.domain.qimen.QiMenGong;
import com.sunland.app.domain.qimen.QiMenZao;
import com.sunland.app.domain.qimen.TianMenDiHu;


import java.util.List;

/**
 * @author: xk
 * @create: 2023-09-22 14:38
 **/
public class QimenPan {
    public static JSONObject getQimenPan(QiMenZao qiMenZao) {
        // 获取奇门基本盘
        List<QiMenGong> qimenGong = QiMenGong.initGong();

        // 排地盘干
        QimenPanUtil.calculateQiMenDipan(qimenGong,qiMenZao);
        // 值符、值使
        QimenPanUtil.setZhiFuAndZhiShi(qimenGong,qiMenZao);
        // 定天盘干
        QimenPanUtil.calculateQiMenTianpan(qimenGong,qiMenZao);
        // 排八神
        QimenPanUtil.calculateBaShen(qimenGong,qiMenZao);
        // 排八星
        QimenPanUtil.calculateBaXing(qimenGong,qiMenZao);
        // 定八门
        QimenPanUtil.calculateBaMen(qimenGong,qiMenZao);
        // 排隐干
        QimenPanUtil.calculateYinGan(qimenGong,qiMenZao);
        // 空亡
        QimenPanUtil.calculateKongWang(qimenGong,qiMenZao);
        // 马星
        QimenPanUtil.calculateMaXing(qimenGong,qiMenZao);
        // 四害
        QimenPanUtil.calculateSiHai(qimenGong);
        // 十二长生
        QimenPanUtil.calculateShierChangSheng(qimenGong);

        /*----------------------天门地户----------------------------------*/
        List<TianMenDiHu> tianMenDiHuList = TianMenDiHu.initTianMenDiHu();
        // 排天门
        QimenPanUtil.calculateTianMen(tianMenDiHuList,qiMenZao);
        // 排地户
        QimenPanUtil.calculateDiHu(tianMenDiHuList,qiMenZao);



        JSONObject entries = new JSONObject();
        entries.put("qiMenZao", qiMenZao);
        entries.put("qimenGong", qimenGong);
        entries.put("tianMenDiHuList", tianMenDiHuList);
        if ("3".equals(qiMenZao.getQimenType())) {
            // 排暗干
            QimenPanUtil.calculateAnGan(qimenGong);
            // 计算天干十二长生
            QimenPanUtil.calculateTianGanShierChangSheng(qimenGong);
            // 终生局的流年盘
            QiMenGong liuNianGong = QimenPanUtil.calculateLifeAnnualPan(qimenGong, qiMenZao);
            entries.put("liuNianGong", JSONObject.toJSON(liuNianGong));
        }
        return entries;
    }
}
