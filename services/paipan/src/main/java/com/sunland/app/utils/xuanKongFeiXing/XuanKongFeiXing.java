package com.sunland.app.utils.xuanKongFeiXing;

import com.alibaba.fastjson.JSONObject;
import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.app.domain.vo.FeiXingVo;
import com.sunland.app.domain.xuankongfeixing.XuanKongFeiXingGong;
import com.sunland.common.utils.DateUtils;

import java.util.Date;
import java.util.List;

/**
 * @author: xk
 * @create: 2024-01-09 17:29
 **/
public class XuanKongFeiXing {
    public static JSONObject getXuanKongFeiXing(FeiXingVo feiXingVo) {
        String birthDay = feiXingVo.getPaipanTime();
        Date date = DateUtils.strToDate(birthDay, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(date);// 阳历
        Lunar ldate = sdate.getHour() >= 23 ? sdate.getLunar().next(1) : sdate.getLunar();//23点算下一天

        EightChar eightChar = ldate.getEightChar();

        feiXingVo.setYearNongLi(eightChar.getYear() + "年" + eightChar.getMonth() + "月" + eightChar.getDay() + "日" + ldate.getTimeZhi() + "时");


        // 获取玄空飞星基本盘
        List<XuanKongFeiXingGong> xuanKongFeiXingGongs = XuanKongFeiXingGong.initGong();
        //布运盘（以建造年份的运星入中顺排）
        XuanKongFeiXingUtil.calculateFeiXingDaYun(feiXingVo, xuanKongFeiXingGongs);
        //布山盘（阳顺阴逆，由三元大卦的阴阳决定）
        XuanKongFeiXingUtil.calculateFeiXingShan(feiXingVo, xuanKongFeiXingGongs);
        //布向盘（阳顺阴逆，由三元大卦的阴阳决定）
        XuanKongFeiXingUtil.calculateFeiXingXiang(feiXingVo, xuanKongFeiXingGongs);
        //年飞星
        XuanKongFeiXingUtil.calculateFeiXingYear(feiXingVo, xuanKongFeiXingGongs);
        // 月飞星
        XuanKongFeiXingUtil.calculateFeiXingYue(feiXingVo, xuanKongFeiXingGongs);
        // 日飞星
        XuanKongFeiXingUtil.calculateFeiXingDay(feiXingVo, xuanKongFeiXingGongs);
        // 时飞星
        XuanKongFeiXingUtil.calculateFeiXingHour(feiXingVo, xuanKongFeiXingGongs);
        // 解释
        XuanKongFeiXingUtil.calculateFeiXingExplain(feiXingVo, xuanKongFeiXingGongs);
        // 计算方向
        List<String> direction= XuanKongFeiXingUtil.calculateFeiXingDirection(feiXingVo);


        JSONObject entries = new JSONObject();
        entries.put("xuanKongFeiXingGong", xuanKongFeiXingGongs);
        entries.put("feiXingVo", feiXingVo);
        entries.put("direction", direction);
        return entries;
    }

    public static void main(String[] args) {
//        for (String i : XuanKongFeiXingUtil.shanXiang24) {
//            for (int j = 1; j <= 9; j++) {
//                FeiXingVo feiXingVo = new FeiXingVo();
//                feiXingVo.setPaipanTime("2024-02-06 14:53");
//                feiXingVo.setDaYun(j);
//                feiXingVo.setRemark("备注");
//                feiXingVo.setShanXiang(i);
//                feiXingVo.setType(1);
////                getXuanKongFeiXing(feiXingVo);
//                System.out.println(getXuanKongFeiXing(feiXingVo));
//            }
//        }

        FeiXingVo feiXingVo = new FeiXingVo();
        feiXingVo.setPaipanTime("2023-12-08 11:24");
        feiXingVo.setDaYun(2);
        feiXingVo.setRemark("备注");
        feiXingVo.setShanXiang("乙山辛向");
        feiXingVo.setType(1);
//                getXuanKongFeiXing(feiXingVo);
        System.out.println(getXuanKongFeiXing(feiXingVo));
    }
}
