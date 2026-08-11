package com.sunland.app.utils.qimen;

import com.nlf.calendar.EightChar;
import com.nlf.calendar.Lunar;
import com.nlf.calendar.Solar;
import com.sunland.app.domain.TitleContent;
import com.sunland.app.domain.qimen.QiMenGong;
import com.sunland.app.domain.qimen.QiMenZao;
import com.sunland.app.domain.qimen.SiHai;
import com.sunland.app.domain.qimen.TianMenDiHu;
import com.sunland.app.enums.BaMen;
import com.sunland.common.utils.DateUtils;
import com.sunland.common.utils.StringUtils;
import com.sunland.common.utils.bean.BeanUtils;

import java.util.*;

/**
 * @author: xk
 * @create: 2023-09-22 14:37
 **/
public class QimenPanUtil {

    //  地盘排序
    private static final List<String> diPanList = Arrays.asList("戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙");
    // 九宫顺排序
    private static final List<Integer> gongShunList = Arrays.asList(1, 8, 3, 4, 9, 2, 7, 6);
    // 九宫逆排序
    private static final  List<Integer> gongNiList = Arrays.asList(1, 6, 7, 2, 9, 4, 3, 8);
    // 八神
    private static final List<String> baShenList = Arrays.asList("值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天");
    // 八星
    private static final List<String> baXingList = Arrays.asList("天蓬", "天任", "天冲", "天辅", "天英", "天芮", "天柱", "天心");
    // 八门
    private static final List<String> baMenList = Arrays.asList("休", "生", "伤", "杜", "景", "死","惊","开");
    public static final List<Integer> ascendingOrderList = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9);
    private static final Map<String, Integer> baMenMap = new HashMap<String, Integer>(){
        private static final long serialVersionUID = -1L;
        {
            this.put("休", 1);
            this.put("生", 8);
            this.put("伤", 3);
            this.put("杜", 4);
            this.put("景", 9);
            this.put("死", 2);
            this.put("惊", 7);
            this.put("开", 6);
        }
    };
    // 天干
    public static final List<String> GAN = Arrays.asList("甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸");
    // 地支
    public static final List<String> ZHI = Arrays.asList("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥");
    // 月将
    public static final Map<String, String> YUE_JIANG = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            put("亥", "登明");
            put("戌", "河魁");
            put("酉", "从魁");
            put("申", "传送");
            put("未", "小吉");
            put("午", "胜光");
            put("巳", "太乙");
            put("辰", "天罡");
            put("卯", "太冲");
            put("寅", "功曹");
            put("丑", "大吉");
            put("子", "神后");
        }
    };
    // 地户
    public static final  List<String> WORDS = Arrays.asList("建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭");

    // 旬首落宫
    public static  QiMenGong xunShouGong = new QiMenGong();
    //地盘时干落宫
    public static  QiMenGong hourGanGong = new QiMenGong();
    //值使落宫
    public static  QiMenGong zhiShiGong = new QiMenGong();

    public static final Map<String, List<String>> TIANGAN_CSGW_MAP = new HashMap<String, List<String>>(){
        private static final long serialVersionUID = -1L;
        {
            this.put("甲", Arrays.asList("亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌"));
            this.put("乙", Arrays.asList("午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌", "酉", "申", "未"));
            this.put("丙", Arrays.asList("寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"));
            this.put("丁", Arrays.asList("酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌"));
            this.put("戊", Arrays.asList("寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"));
            this.put("己", Arrays.asList("酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌"));
            this.put("庚", Arrays.asList("巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"));
            this.put("辛", Arrays.asList("子", "亥", "戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑"));
            this.put("壬", Arrays.asList("申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未"));
            this.put("癸", Arrays.asList("卯", "寅", "丑", "子", "亥", "戌", "酉", "申", "未", "午", "巳", "辰"));
        }
    };

    public static final  List<String> shierStar = Arrays.asList("长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养");

    public static final List<List<String>> JIUGONG_DIZHI = Arrays.asList(
            Arrays.asList("子"),
            Arrays.asList("未","申"),
            Arrays.asList("卯"),
            Arrays.asList("辰","巳"),
            Arrays.asList(),
            Arrays.asList("戌","亥"),
            Arrays.asList("酉"),
            Arrays.asList("丑","寅"),
            Arrays.asList("午")
    );
    // 山向奇门72局速查表
    public static final List<List<String>> MOUNTAIN_TABLE = Arrays.asList(
            Arrays.asList("癸", "0", "4", "阴", "7"),
            Arrays.asList("癸", "5", "9", "阴", "1"),
            Arrays.asList("癸", "10", "14", "阴", "4"),
            Arrays.asList("丑", "15", "19", "阴", "2"),
            Arrays.asList("丑", "20", "24", "阴", "5"),
            Arrays.asList("丑", "25", "29", "阴", "8"),
            Arrays.asList("艮", "30", "34", "阴", "1"),
            Arrays.asList("艮", "35", "39", "阴", "4"),
            Arrays.asList("艮", "40", "44", "阴", "7"),
            Arrays.asList("寅", "45", "49", "阴", "9"),
            Arrays.asList("寅", "50", "54", "阴", "3"),
            Arrays.asList("寅", "55", "59", "阴", "6"),
            Arrays.asList("甲", "60", "64", "阴", "7"),
            Arrays.asList("甲", "65", "69", "阴", "1"),
            Arrays.asList("甲", "70", "74", "阴", "4"),
            Arrays.asList("卯", "75", "79", "阴", "6"),
            Arrays.asList("卯", "80", "84", "阴", "9"),
            Arrays.asList("卯", "85", "89", "阴", "3"),
            Arrays.asList("乙", "90", "94", "阴", "5"),
            Arrays.asList("乙", "95", "99", "阴", "8"),
            Arrays.asList("乙", "100", "104", "阴", "2"),
            Arrays.asList("辰", "105", "109", "阴", "6"),
            Arrays.asList("辰", "110", "114", "阴", "9"),
            Arrays.asList("辰", "115", "119", "阴", "3"),
            Arrays.asList("巽", "120", "124", "阴", "5"),
            Arrays.asList("巽", "125", "129", "阴", "8"),
            Arrays.asList("巽", "130", "134", "阴", "2"),
            Arrays.asList("巳", "135", "139", "阳", "4"),
            Arrays.asList("巳", "140", "144", "阳", "1"),
            Arrays.asList("巳", "145", "149", "阳", "7"),
            Arrays.asList("丙", "150", "154", "阳", "1"),
            Arrays.asList("丙", "155", "159", "阳", "7"),
            Arrays.asList("丙", "160", "164", "阳", "4"),
            Arrays.asList("午", "165", "169", "阳", "2"),
            Arrays.asList("午", "170", "174", "阳", "8"),
            Arrays.asList("午", "175", "179", "阳", "5"),
            Arrays.asList("丁", "180", "184", "阳", "3"),
            Arrays.asList("丁", "185", "189", "阳", "9"),
            Arrays.asList("丁", "190", "194", "阳", "6"),
            Arrays.asList("未", "195", "199", "阳", "8"),
            Arrays.asList("未", "200", "204", "阳", "5"),
            Arrays.asList("未", "205", "209", "阳", "2"),
            Arrays.asList("坤", "210", "214", "阳", "9"),
            Arrays.asList("坤", "215", "219", "阳", "6"),
            Arrays.asList("坤", "220", "224", "阳", "3"),
            Arrays.asList("申", "225", "229", "阳", "1"),
            Arrays.asList("申", "230", "234", "阳", "7"),
            Arrays.asList("申", "235", "239", "阳", "4"),
            Arrays.asList("庚", "240", "244", "阳", "3"),
            Arrays.asList("庚", "245", "249", "阳", "9"),
            Arrays.asList("庚", "250", "254", "阳", "6"),
            Arrays.asList("酉", "255", "259", "阳", "4"),
            Arrays.asList("酉", "260", "264", "阳", "1"),
            Arrays.asList("酉", "265", "269", "阳", "7"),
            Arrays.asList("辛", "270", "274", "阳", "5"),
            Arrays.asList("辛", "275", "279", "阳", "2"),
            Arrays.asList("辛", "280", "284", "阳", "8"),
            Arrays.asList("戌", "285", "289", "阳", "4"),
            Arrays.asList("戌", "290", "294", "阳", "1"),
            Arrays.asList("戌", "295", "299", "阳", "7"),
            Arrays.asList("乾", "300", "304", "阳", "5"),
            Arrays.asList("乾", "305", "309", "阳", "2"),
            Arrays.asList("乾", "310", "314", "阳", "8"),
            Arrays.asList("亥", "315", "319", "阴", "6"),
            Arrays.asList("亥", "320", "324", "阴", "9"),
            Arrays.asList("亥", "325", "329", "阴", "3"),
            Arrays.asList("壬", "330", "334", "阴", "9"),
            Arrays.asList("壬", "335", "339", "阴", "3"),
            Arrays.asList("壬", "340", "344", "阴", "6"),
            Arrays.asList("子", "345", "349", "阴", "8"),
            Arrays.asList("子", "350", "354", "阴", "2"),
            Arrays.asList("子", "355", "359", "阴", "5")
    );

    //山向对应
    public static final Map<String, String> SHAN_XIANG = new HashMap<String, String>(){
        private static final long serialVersionUID = -1L;
        {
            put("子", "午");
            put("丑", "未");
            put("寅", "申");
            put("卯", "酉");
            put("辰", "戌");
            put("巳", "亥");
            put("午", "子");
            put("未", "丑");
            put("申", "寅");
            put("酉", "卯");
            put("戌", "辰");
            put("亥", "巳");
            put("甲", "庚");
            put("乙", "辛");
            put("丙", "壬");
            put("丁", "癸");
            put("庚", "甲");
            put("辛", "乙");
            put("壬", "丙");
            put("癸", "丁");
            put("乾", "巽");
            put("坤", "艮");
            put("艮", "坤");
            put("巽", "乾");
        }
    };

    //山向黄泉八煞对应
    public static final Map<String, String> MOUNTAIN_DIRECTION_TO_HUANGQUAN_MAP = new HashMap<String, String>(){
        private static final long serialVersionUID = -1L;
        {
            put("癸", "黄泉辰");
            put("子", "黄泉辰");
            put("壬", "黄泉辰");
            put("寅", "黄泉寅");
            put("艮", "黄泉寅");
            put("丑", "黄泉寅");
            put("乙", "黄泉申");
            put("卯", "黄泉申");
            put("甲", "黄泉申");
            put("巳", "黄泉酉");
            put("巽", "黄泉酉");
            put("辰", "黄泉酉");
            put("丁", "黄泉亥");
            put("午", "黄泉亥");
            put("丙", "黄泉亥");
            put("申", "黄泉卯");
            put("坤", "黄泉卯");
            put("未", "黄泉卯");
            put("辛", "黄泉巳");
            put("酉", "黄泉巳");
            put("庚", "黄泉巳");
            put("亥", "黄泉午");
            put("乾", "黄泉午");
            put("戌", "黄泉午");
        }
    };


    // 二十四山
    public static final List<String> allMountains = Arrays.asList("壬", "子", "癸","丑", "艮", "寅","甲", "卯", "乙","辰", "巽", "巳","丙", "午", "丁","未", "坤", "申","庚", "酉", "辛","戌", "乾", "亥");

    //六甲换六仪
    public static final Map<String, String> LIUYI_MAP = new HashMap<String, String>(){
        private static final long serialVersionUID = -1L;
        {
            put("甲子", "戊");
            put("甲戌", "己");
            put("甲申", "庚");
            put("甲午", "辛");
            put("甲辰", "壬");
            put("甲寅", "癸");
        }
    };

    //对宫
    public static final Map<Integer, Integer> DUI_GONG = new HashMap<Integer, Integer>(){
        private static final long serialVersionUID = -1L;
        {
            put(1, 9);
            put(2, 4);
            put(3, 7);
            put(4, 2);
            put(6, 8);
            put(7, 3);
            put(8, 6);
            put(9, 1);
        }
    };

    // 定义天盘干和地盘支对应的阴阳关系
    private static final Map<String, String> TIAN_PAN_GAN_YIN_YANG = new HashMap<String, String>(){
        private static final long serialVersionUID = -1L;
        {
            this.put("甲", "阳");
            this.put("乙", "阴");
            this.put("丙", "阳");
            this.put("丁", "阴");
            this.put("戊", "阳");
            this.put("己", "阴");
            this.put("庚", "阳");
            this.put("辛", "阴");
            this.put("壬", "阳");
            this.put("癸", "阴");
        }
    };
    // 定义地盘支对应的阴阳关系
    private static final Map<String, String> DI_PAN_ZHI_YIN_YANG = new HashMap<String, String>(){
        private static final long serialVersionUID = -1L;
        {
            this.put("丑", "阴");
            this.put("寅", "阳");
            this.put("辰", "阳");
            this.put("巳", "阴");
            this.put("未", "阴");
            this.put("申", "阳");
            this.put("戌", "阳");
            this.put("亥", "阴");
        }
    };

    /**
     * 求出下一个山
     * @param currentMountain
     * @return
     */
    public static String getNextMountain(String currentMountain) {
        int currentIndex = allMountains.indexOf(currentMountain);
        int nextIndex = (currentIndex + 1) % allMountains.size();
        return allMountains.get(nextIndex);
    }

    /**
     * 日上起时
     * 甲己还生甲，乙庚丙作初
     * 丙辛从戊起，丁壬庚子居
     * 戊癸何方发，壬子是真途
     * @param yearGan
     * @param xiang
     * @return
     */
    public static String getHourGanZhi(String yearGan,String xiang){
        int st = 0;
        // 计算出时辰是第几位
        int x = ZHI.indexOf(xiang);
        if (!ZHI.contains(xiang)) {
            xiang = getNextMountain(xiang);
            x = ZHI.indexOf(xiang);
        }

        if (yearGan.equals("甲") || yearGan.equals("己")) {
            st = 1; //"甲";
        } else if (yearGan.equals("乙") || yearGan.equals("庚")) {
            st = 3; //"丙";
        } else if (yearGan.equals("丙") || yearGan.equals("辛")) {
            st = 5; //"戊";
        } else if (yearGan.equals("丁") || yearGan.equals("壬")) {
            st = 7; //"庚";
        } else if (yearGan.equals("戊") || yearGan.equals("癸")) {
            st = 9; //"壬";
        }
        return GAN.get((x + st - 1) % 10)+xiang;
    }

        /**
         * 计算奇门地盘
         * @param qimenGong 奇门宫位列表
         * @param qiMenZao 奇门造局信息
         */
    public static void calculateQiMenDipan(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        String yinOrYangDun = qiMenZao.getYinOrYangDun();
        Integer juShu = qiMenZao.getJuShu();
        // 以局数为起点,阳顺阴逆,戊己庚辛壬癸丁丙乙写入对应位置
        for (int i = 0; i < 9; i++) {
            int shift = yinOrYangDun.equals("阴") ? -i : i;
            Integer shiftedA = circularShift(juShu, ascendingOrderList, shift);
            String shiftedB = circularShift(diPanList.get(0), diPanList, i);
            qimenGong.get(shiftedA-1).setDiPan(shiftedB);
        }

        //旬首落宫,旬首中5宫移动到坤二宫
        xunShouGong = qimenGong.stream().filter(t -> t.getDiPan().equals(qiMenZao.getXunShou().substring(2)))
                .findFirst().get();
        if (xunShouGong.getIndex().equals(5)){
            xunShouGong=qimenGong.stream().filter(t -> t.getIndex().equals(2)).findFirst().get();
        }
        //时干落宫如果是甲的，就跟旬首一致
        String hourGan = qiMenZao.getHourGan();
        if ("甲".equals(hourGan)) {
            hourGanGong = xunShouGong;
        }else {
            hourGanGong = qimenGong.stream().filter(t -> t.getDiPan().equals(qiMenZao.getHourGan())).findFirst().get();
        }
        if (hourGanGong.getIndex().equals(5)){
            hourGanGong=qimenGong.stream().filter(t -> t.getIndex().equals(2)).findFirst().get();
        }
        //值使落宫
        zhiShiGong = qimenGong.stream().filter(t -> t.getDiPan().equals(qiMenZao.getXunShou().substring(2)))
                .findFirst().get();
        // 中五宫寄坤二宫
        placeInKunErGong(qimenGong);
    }

    /**
     * 中五宫寄坤二宫
     * @param qimenGong 奇门宫位列表
     */
    public static void placeInKunErGong(List<QiMenGong> qimenGong) {
        QiMenGong kunErGong = qimenGong.stream().filter(gong -> gong.getIndex().equals(2)).findFirst().get();
        QiMenGong zhongWuGong = qimenGong.stream().filter(gong -> gong.getIndex().equals(5)).findFirst().get();
        kunErGong.setDiPan(kunErGong.getDiPan() + zhongWuGong.getDiPan());
    }

    /**
     * 根据旬首定值符、值使来设置值符和值使
     * 甲子-戊；甲寅-癸；甲辰-壬
     * 甲午-辛；甲申-庚；甲戌-己
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao 奇门造命对象
     */
    public static void setZhiFuAndZhiShi(List<QiMenGong> qimenGong,QiMenZao qiMenZao) {
        //旬首天干对应宫地支所在宫位
        qiMenZao.setZhiFu(xunShouGong.getJiuXing().toString());
        qiMenZao.setZhiFuIndex(hourGanGong.getIndex());
        qiMenZao.setZhiShi(xunShouGong.getBaMen().toString());
        // -------找到旬首对应地盘干的宫位,5不移动到2
        Integer index = zhiShiGong.getIndex();
        boolean isYangDun = qiMenZao.getYinOrYangDun().equals("阳");
        List<Integer> gongOrder = generateGongOrder(index, isYangDun);
        // 将十天干依次写出，配对宫位数
        Map<String, Integer> ganToGongMap = new HashMap<>();
        for (int i = 0; i < GAN.size(); i++) {
            ganToGongMap.put(GAN.get(i), gongOrder.get(i));
        }
        // 找到时干对应地盘干的宫位,时干对应的数字便是值使门落宫
        String hourGan = qiMenZao.getHourGan();
        Integer valueShiMen = ganToGongMap.get(hourGan);
        //--------------
        qiMenZao.setZhiShiIndex(valueShiMen);

    }

    /**
     * 计算奇门天盘干，根据传入的地盘宫位和旬首对应的天干。
     *
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao  奇门造命对象
     */
    public static void calculateQiMenTianpan(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        //时干对应宫位
        Integer indexB = hourGanGong.getIndex();
        //旬首对应宫位
        Integer indexA = xunShouGong.getIndex();
        // 遍历奇门宫位列表并旋转地盘宫位
        for (int i = 0; i < gongShunList.size(); i++) {
            int shiftedA = circularShift(indexA, gongShunList, i);
            int shiftedB = circularShift(indexB, gongShunList, i);
            QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
            QiMenGong shiftedBGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedB)).findFirst().get();
            shiftedBGong.setTianPan(shiftedAGong.getDiPan());
            shiftedBGong.setIsSelect(0);
            shiftedBGong.setDayGan(qiMenZao.getDayGan());
            if(StringUtils.isNotEmpty(qiMenZao.getDayGan()) && StringUtils.isNotEmpty(shiftedBGong.getTianPan())
                    && shiftedBGong.getTianPan().contains(qiMenZao.getDayGan())){
                shiftedBGong.setIsSelect(1);
                //shiftedBGong.setDayGan(qiMenZao.getDayGan());
            }
        }
        // 天盘中5空报错解决
        QiMenGong qiMenGong = qimenGong.stream().filter(t -> t.getIndex().equals(5)).findFirst().get();
        qiMenGong.setTianPan(BaMen.UNKNOWN.toString());
        qiMenGong.setIsSelect(0);
        qiMenGong.setDayGan("");
    }

    /**
     * 执行循环移位操作，根据指定的偏移量。
     *
     * @param value     初始值
     * @param list      列表
     * @param positions 偏移量（正数表示向前平移，负数表示向后平移）
     * @return 移位后的值
     */
    public static int circularShift(int value, List<Integer> list, int positions) {
        int index = list.indexOf(value);
        if (index != -1) {
            int nextIndex = (index + positions) % list.size();
            if (nextIndex < 0) {
                nextIndex += list.size();
            }
            return list.get(nextIndex);
        }
        return -1;
    }

    /**
     * 根据传入的值和平移顺序向后平移
     * @param value 要平移的值
     * @param list 平移顺序列表
     * @param positions 平移的位置数（向后平移的位数）
     * @return 平移后的值
     */
    public static String circularShift(String value, List<String> list, int positions) {
        int index = list.indexOf(value);
        if (index != -1) {
            int nextIndex = (index + positions) % list.size();
            if (nextIndex < 0) {
                nextIndex += list.size(); // 处理负数索引
            }
            return list.get(nextIndex);
        }
        return null; // 传入值不在列表中，返回 null 或其他适当的值
    }



    /**
     * 计算八神，根据地盘宫位和阴阳。
     * 将八神中的”符“落在，时干对应地支的宫位，然后按阳遁顺行，阴遁逆行的原则，将八神排列出来，顺序为：符蛇阴六白玄地天
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao 奇门造命对象
     */
    public static void calculateBaShen(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        // 时干对应宫位
        Integer index = hourGanGong.getIndex();
        List<Integer> gongOrder = qiMenZao.getYinOrYangDun().equals("阳") ? gongShunList : gongNiList;
        for (int i = 0; i < gongOrder.size(); i++) {
            int shiftedA = circularShift(index, gongOrder, i);
            QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
            shiftedAGong.setBaShen(baShenList.get(i));
        }
    }


    /**
     * 计算八星，根据地盘宫位和不考虑阴阳。
     * 将值符星落在，时干对应地支的宫位，然后按照芮、柱、心、蓬、任、冲、辅、英的顺序排列九星
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao 奇门造命对象
     * @return 八星
     */
    public static void calculateBaXing(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        // 值符星
        String zhifu = qiMenZao.getZhiFu().substring(0,2);
        // 时干所在宫位
        Integer index = hourGanGong.getIndex();
        for (int i = 0; i < gongShunList.size(); i++) {
            int shiftedA = circularShift(index, gongShunList, i);
            QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
            shiftedAGong.setBaXing(circularShift(zhifu,baXingList,i));
        }
    }


    /**
     * 根据旬首和时辰计算并设置八门的位置 休生伤杜景死惊开
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao 奇门造命对象
     */
    public static void calculateBaMen(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        Integer indexA = qiMenZao.getZhiShiIndex();
        indexA = (indexA.equals(5)) ? 2 : indexA;
        // 值使门,八门的原始顺序顺时针排序
        String zhiShi = qiMenZao.getZhiShi();
        for (int i = 0; i < gongShunList.size(); i++) {
            int shiftedA = circularShift(indexA, gongShunList, i);
            QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
            shiftedAGong.setNewBaMen(circularShift(zhiShi,baMenList,i));
        }

    }


    /**
     * 根据宫位数生成阳顺或阴逆排列的宫位列表
     *
     * @param index     宫位起始数
     * @param isPositive 是否为阳顺
     * @return 宫位列表
     */
    public static List<Integer> generateGongOrder(int index, boolean isPositive) {
        if (isPositive) {
            return printPositiveLoop(index);
        } else {
            return printReverseLoop(index);
        }
    }

    /**
     * 生成阳顺排列的宫位列表
     *
     * @param index 宫位起始数
     * @return 宫位列表
     */
    public static List<Integer> printPositiveLoop(int index) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < GAN.size(); i++) {
            result.add(circularShift(index,ascendingOrderList,i));
        }
        return result;
    }

    /**
     * 生成阴逆排列的宫位列表
     *
     * @param index 宫位起始数
     * @return 宫位列表
     */
    public static List<Integer> printReverseLoop(int index) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < GAN.size(); i++) {
            result.add(circularShift(index,ascendingOrderList,-i));
        }
        return result;
    }

    /**
     * 排隐干
     * 时干加在值使门上，按照天盘干顺序顺时针填写
     * 如果遇到伏吟局，时干放入中宫，阳顺阴逆去排列
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao 奇门造命对象
     */
    public static void calculateYinGan(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        // 值使所在奇门宫位
        Integer indexA = qiMenZao.getZhiShiIndex();
        indexA = (indexA.equals(5)) ? 2 : indexA;
        Integer indexB = hourGanGong.getIndex();
        // 遍历奇门宫位列表并旋转地盘宫位;时干加在值使门上，按照天盘干顺序顺时针填写
        for (int i = 0; i < gongShunList.size(); i++) {
            int shiftedA = circularShift(indexA, gongShunList, i);
            int shiftedB = circularShift(indexB, gongShunList, i);
            QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
            QiMenGong shiftedBGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedB)).findFirst().get();
            shiftedAGong.setYinGan(shiftedBGong.getDiPan());
        }


        //伏吟局
//        QiMenGong onegong = qimenGong.get(0);
//        if (onegong.getYinGan()==onegong.getTianPan()&&onegong.getYinGan()==onegong.getDiPan()){
//            //如果旬首是落入中五宫的，那么取坤二宫中原有的六仪入中五宫，然后阳遁顺跳，阴遁逆跳。顺序还是戊己庚辛壬癸丁丙乙。
//            //如果旬首没有落入中五宫，就像本例一样，那么取旬首入中五宫，然后阳遁顺跳，阴遁逆跳。
//            String xunShou = qiMenZao.getXunShou().substring(2);
//            // 将2宫的干，放在中宫来排盘。
//            String erGan1 = qimenGong.get(1).getYinGan().substring(0, 1);
//            String erGan2 = qimenGong.get(1).getYinGan().substring(1, 2);
//
//            if (erGan2.equals(xunShou)) {
//
//                for (int i = 0; i < 9; i++) {
//                    int shift = qiMenZao.getYinOrYangDun().equals("阴") ? -i : i;
//                    Integer shiftedA = circularShift(5, ascendingOrderList, shift);
//                    String shiftedB = circularShift(erGan1, diPanList, i);
//                    QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
//                    shiftedAGong.setYinGan(shiftedB);
//                }
//
//            }else {
//                for (int i = 0; i < 9; i++) {
//                    int shift = qiMenZao.getYinOrYangDun().equals("阴") ? -i : i;
//                    Integer shiftedA = circularShift(5, ascendingOrderList, shift);
//                    String shiftedB = circularShift(xunShou, diPanList, i);
//                    QiMenGong shiftedAGong = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().get();
//                    shiftedAGong.setYinGan(shiftedB);
//                }
//
//            }
//            // 中五宫移动到坤二宫
//            QiMenGong kunErGong = qimenGong.stream().filter(gong -> gong.getIndex().equals(2)).findFirst().get();
//            QiMenGong zhongWuGong = qimenGong.stream().filter(gong -> gong.getIndex().equals(5)).findFirst().get();
//            kunErGong.setYinGan(kunErGong.getYinGan() + zhongWuGong.getYinGan());
//        }



    }

    /**
     * 计算并处理空亡情况，将结果设置到奇门宫位列表中。
     *
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao  奇门造命对象
     */
    public static void calculateKongWang(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        String xunKongGong = qiMenZao.getXunKongGong();
        for (QiMenGong gong : qimenGong) {
            gong.setXunKong(xunKongGong.contains(gong.getBaGua().toString()));
        }
    }

    /**
     * 计算并处理马星情况，将结果设置到奇门宫位列表中。
     *
     * @param qimenGong 奇门宫位列表
     * @param qiMenZao  奇门造命对象
     */
    public static void calculateMaXing(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        String maXing = qiMenZao.getMaXing();
        for (QiMenGong gong : qimenGong) {
            gong.setMaXing(maXing.contains(gong.getBaGua().toString()));
        }
    }

    /**
     * 四害
     * @param qimenGong
     */
    public static void calculateSiHai(List<QiMenGong> qimenGong) {
        Map<Integer, String> xing = new HashMap<>();
        xing.put(4, "甲辰壬寅癸");
        xing.put(9, "甲午辛");
        xing.put(8, "甲申庚");
        xing.put(2, "甲戌己");
        xing.put(3, "甲子戊");

        Map<Integer, String> pao = new HashMap<>();
        pao.put(1, "生死");
        pao.put(8, "伤杜");
        pao.put(3, "惊开");
        pao.put(4, "惊开");
        pao.put(9, "休");
        pao.put(2, "伤杜");
        pao.put(7, "景");
        pao.put(6, "景");

        Map<Integer, String> mu = new HashMap<>();
        mu.put(8, "丁己庚");
        mu.put(4, "辛壬");
        mu.put(2, "甲癸");
        mu.put(6, "乙丙戊");

        processMap(qimenGong, xing, "刑");
        processMap(qimenGong, pao, "迫");
        processMap(qimenGong, mu, "墓");
    }

    public static void processMap(List<QiMenGong> qimenGong, Map<Integer, String> map, String condition) {
        for (Map.Entry<Integer, String> entry : map.entrySet()) {
            Integer index = entry.getKey();
            String input = entry.getValue();

            QiMenGong qiMenGong = qimenGong.stream().filter(t -> t.getIndex().equals(index)).findFirst().get();
            List<SiHai> list = qiMenGong.getSiHai();
            if (list == null) {
                list = new ArrayList<>();
                qiMenGong.setSiHai(list);
            }

            String diPanValue = qiMenGong.getDiPan();
            String tianPanValue = qiMenGong.getTianPan();
            String baMen = qiMenGong.getNewBaMen();

            // 地盘四害
            char[] diPanCharacters = diPanValue.toCharArray();
            for (char diPanCharacter : diPanCharacters) {
                if (input.contains(String.valueOf(diPanCharacter))) {
                    list.add(new SiHai(String.valueOf(diPanCharacter), condition));
                }
            }
            // 天盘四害
            char[] tianPanCharacters = tianPanValue.toCharArray();
            for (char tianPanCharacter : tianPanCharacters) {
                if (input.contains(String.valueOf(tianPanCharacter))) {
                    list.add(new SiHai(String.valueOf(tianPanCharacter), condition));
                }
            }

            // 八门四害
            if (input.contains(baMen)) {
                list.add(new SiHai(baMen, condition));
            }

        }
    }

    /**
     * 十二长生
     * @param qimenGong
     */
    public static void calculateShierChangSheng(List<QiMenGong> qimenGong) {

        for (QiMenGong qiMenGong : qimenGong) {
            // 天干长生
            if (!"UNKNOWN".equals(qiMenGong.getTianPan())) {
                qiMenGong.setTianGanChangSheng(processPan(qiMenGong,qiMenGong.getTianPan()));
            }

            // 地支长生
            if (!"UNKNOWN".equals(qiMenGong.getDiPan())) {
                qiMenGong.setDiZhiChangSheng(processPan(qiMenGong,qiMenGong.getDiPan()));
            }
        }


    }

    private static List<TitleContent> processPan(QiMenGong gong,String pan) {
        List<TitleContent> tianPanInfo = new ArrayList<>();
        // 宫位对应地支位置
        List<String> jqZhi = JIUGONG_DIZHI.get(gong.getIndex() - 1);
        for (char charGan : pan.toCharArray()) {
            for (String dz : jqZhi) {
                int i2 = TIANGAN_CSGW_MAP.get(String.valueOf(charGan)).indexOf(dz);
                if (i2 != -1) {
                    tianPanInfo.add(new TitleContent(dz, shierStar.get(i2)));
                }
            }
        }
        return tianPanInfo;
    }




    /*------------------------天门地户----------------------------*/

    /**
     * 计算天门:将月将加在时支(九宫的十二地支位置) 上，顺时针转一周排列。
     *
     * @param tianMenDiHuList 包含天门地户信息的列表
     * @param qiMenZao  奇门造命对象
     */
    public static void calculateTianMen(List<TianMenDiHu> tianMenDiHuList, QiMenZao qiMenZao) {
        // 月将
        String yueJiang = qiMenZao.getYueJiang();
        // 时支
        String hourZhi = qiMenZao.getHourZhi();

        for (int i = 0; i < ZHI.size(); i++) {
            String shiftedA = circularShift(yueJiang, ZHI, i);
            String shiftedB = circularShift(hourZhi, ZHI, i);
            TianMenDiHu hourZhiTianMenDiHu = tianMenDiHuList.stream().filter(t -> t.getDiZhi().equals(shiftedB)).findFirst().get();
            hourZhiTianMenDiHu.setTianMen(YUE_JIANG.get(shiftedA)+""+shiftedA);
        }
    }

    /**
     * 排地户
     * @param tianMenDiHuList 包含天门地户信息的列表
     * @param qiMenZao  奇门造命对象
     */
    public static void calculateDiHu(List<TianMenDiHu> tianMenDiHuList, QiMenZao qiMenZao) {
        // 时支
        String hourZhi = qiMenZao.getHourZhi();
        for (int i = 0; i < ZHI.size(); i++) {
            String shiftedB = circularShift(hourZhi, ZHI, i);
            TianMenDiHu hourZhiTianMenDiHu = tianMenDiHuList.stream().filter(t -> t.getDiZhi().equals(shiftedB)).findFirst().get();
            hourZhiTianMenDiHu.setDiHu(WORDS.get(i));
        }
    }


    /**
     * 终生局的流年盘
     * 第一步，找上面第一个盘四柱八字日元天盘干所落的宫位，这个宫位是3岁，是转圈的起点；
     * 第二步，确认流年年份和流年的天干；
     * 第三步，开始转圈，转圈的顺序为男：阳顺阴逆；女：阳逆阴顺；
     * 第四步，一直转到流年的年份停，然后把该宫位的天盘干换成流年的天盘干
     *
     * 特殊情况：1.只看实岁；当前年月日如果没满周岁的话，用去年的流年天干替换
     * 2如果转到空亡位置了，需要转宫，规则如下：上三宫转值符 中三宫转六合 下三宫转戊
     * @param qimenGong
     * @param qiMenZao
     */
    public static QiMenGong calculateLifeAnnualPan(List<QiMenGong> qimenGong, QiMenZao qiMenZao) {
        // 默认使用当天日期
        String yearGongLi = qiMenZao.getYearGongLi();
        String lotusGateFlowDate = StringUtils.isEmpty(qiMenZao.getLotusGateFlowDate())? DateUtils.DateAddByYear(yearGongLi,3): qiMenZao.getLotusGateFlowDate();
        // 计算年份差
        int year = DateUtils.calculateYearsDifference(yearGongLi, lotusGateFlowDate);

        // 转圈的起点
        String dayGan = "甲".equals(qiMenZao.getDayGanZhi().substring(0, 1)) ? LIUYI_MAP.get(qiMenZao.getDayGanZhi()) : qiMenZao.getDayGanZhi().substring(0, 1);
        QiMenGong initialGong = qimenGong.stream().filter(t -> t.getTianPan().contains(dayGan)).findFirst().orElse(null);
        // 获取对面宫
        int index = DUI_GONG.get(initialGong.getIndex());
        List<Integer> gongOrder = "男".equals(qiMenZao.getSex()) ? gongShunList : gongNiList;
        int shiftedA = circularShift(index, gongOrder, year-3);

        // 流年天干 前年月日如果没满周岁的话，用去年的流年天干替换
        if (DateUtils.compareFlowDate(yearGongLi,lotusGateFlowDate)) {
            lotusGateFlowDate = DateUtils.getPreviousYear(lotusGateFlowDate);
        }
        Date date = DateUtils.strToDate(lotusGateFlowDate, DateUtils.YYYY_MM_DD);
        Solar sdate = Solar.fromDate(date);
        Lunar lunar = sdate.getLunar();
        EightChar eightChar = lunar.getEightChar();
        eightChar.setSect(1);
        String yearGan = "甲".equals(eightChar.getYearGan()) ? LIUYI_MAP.get(eightChar.getYear()) : eightChar.getYearGan();

        // 替换流年天干
        QiMenGong qg = qimenGong.stream().filter(t -> t.getIndex().equals(shiftedA)).findFirst().orElse(null);
        QiMenGong liuNianGong = new QiMenGong();
        BeanUtils.copyBeanProp(liuNianGong,qg);
        liuNianGong.setTianPan(yearGan);

        // 处理空亡位置
        if (liuNianGong.isXunKong()) {
            handleXunKongPosition(qimenGong, liuNianGong);
        }

        return liuNianGong;
    }

    /**
     * 如果转到空亡位置了，需要转宫，规则如下：上三宫转值符 中三宫转六合 下三宫转戊
     * @param qimenGong
     * @param liuNianGong
     */
    private static void handleXunKongPosition(List<QiMenGong> qimenGong, QiMenGong liuNianGong) {
        List<String> shang = Arrays.asList("4", "9", "2");
        List<String> zhong = Arrays.asList("3", "5", "7");
        List<String> xia = Arrays.asList("8", "1", "6");

        if (shang.contains(liuNianGong.getIndex())) {
            int zhiFuIndex = qimenGong.stream().filter(QiMenGong::isZhiFu).findFirst().map(QiMenGong::getIndex).orElse(0);
            liuNianGong.setIndex(zhiFuIndex);
        }

        if (zhong.contains(liuNianGong.getIndex())) {
            int liuIndex = qimenGong.stream().filter(t -> "六".equals(t.getBaShen())).findFirst().map(QiMenGong::getIndex).orElse(0);
            liuNianGong.setIndex(liuIndex);
        }

        if (xia.contains(liuNianGong.getIndex())) {
            int wuIndex = qimenGong.stream().filter(t -> t.getTianPan().contains("戊")).findFirst().map(QiMenGong::getIndex).orElse(0);
            liuNianGong.setIndex(wuIndex);
        }
    }

    /**
     * 排暗干
     * 隐于所在的地盘干的天盘干
     * @param qimenGong
     */
    public static void calculateAnGan(List<QiMenGong> qimenGong) {
        for (QiMenGong qg:qimenGong) {
            qg.setAnGan(qg.getTianPan());
        }
    }

    /**
     * 计算天干十二长生
     * 1.先判断天盘干的阴阳阳干(甲丙戊庚壬)阴干(乙丁己辛癸)
     * 2.再结合四个角的阴阳阳支:辰，寅，戌，申阴支:巳，丑，亥，未
     * 3.然后阴配阴，阳配阳，选对应的值，放到13步-3里去计算值
     * @param qimenGong
     */
    public static void calculateTianGanShierChangSheng(List<QiMenGong> qimenGong) {

        for (QiMenGong qiMenGong : qimenGong) {
            // 天干长生
            if (!"UNKNOWN".equals(qiMenGong.getTianPan())) {
                qiMenGong.setLianHuaTianGanChangSheng(processPanLianHua(qiMenGong,qiMenGong.getTianPan()));
            }

        }

    }
    private static List<TitleContent> processPanLianHua(QiMenGong gong, String pan) {
        List<TitleContent> tianPanInfo = new ArrayList<>();
        // 宫位对应地支位置
        List<String> jqZhi = JIUGONG_DIZHI.get(gong.getIndex() - 1);
        // 遍历天盘干
        for (char charGan : pan.toCharArray()) {
            String tianPanGanYinYangValue = TIAN_PAN_GAN_YIN_YANG.get(String.valueOf(charGan));
            // 遍历地盘支
            for (String dz : jqZhi) {
                int i2 = TIANGAN_CSGW_MAP.get(String.valueOf(charGan)).indexOf(dz);
                String diPanZhiYinYangValue = DI_PAN_ZHI_YIN_YANG.get(dz);
                if (tianPanGanYinYangValue.equals(diPanZhiYinYangValue)||jqZhi.size()==1) {
                    tianPanInfo.add(new TitleContent(dz, shierStar.get(i2)));
                }
            }
        }
        return tianPanInfo;
    }
}
