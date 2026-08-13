package com.sunland.app.domain.shenshu;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author: xk
 * @create: 2023-11-02 11:27
 **/
@Data
public class ShuDes implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 数字组合
     */
    private String numericalArray;
    /**
     * 特殊数组
     */
    private String specialArray;
    /**
     * 出现位置
     */
    private String occurrencePositions;
    /**
     * 结果解读
     */
    private String resultDescription;


    public ShuDes(String numericalArray, String specialArray, String occurrencePositions, String resultDescription) {
        this.numericalArray = numericalArray;
        this.specialArray = specialArray;
        this.occurrencePositions = occurrencePositions;
        this.resultDescription = resultDescription;
    }



    public static final Map<String, ShuDes> DES_LIST = new HashMap<String, ShuDes>() {
        private static final long serialVersionUID = -1L;

            {
                put("3-5年月", new ShuDes("3-5/5-3", "年月", "阴绝阳数组", "可能会与父亲缘分浅，年月5-3，属龙的3月出生，或者属虎的5月出生，都代表小时候灾难都比较多，特别是虎年5月出生的人，这种人压运到25岁，还容易犯脑梗，脑中风，脑溢血等甚至脑癌"));
                put("3-5月日", new ShuDes("3-5/5-3", "月日", "阴绝阳数组", "如果在月日上占到5-3，夫妻关系不和，甚至伤丈夫，这是绝数5-3，3-5的象意，只要出现在数组里，先后天都算，大家一定要注意"));
                put("3-5日时", new ShuDes("3-5/5-3", "日时", "阴绝阳数组", "5-3在日时很多人家里生女儿就没有男孩子，出现在日时上还容易发生车灾，东北3位发车到东南5位发生车祸，5-3在日时也容易有糖尿病"));
                put("2-6年月", new ShuDes("2-6/6-2", "年月", "阳绝阴数组", "会影响运势，压运到22岁，出现在月日影响到感情和身体"));
                put("2-6月日", new ShuDes("2-6/6-2", "月日", "阳绝阴数组", "往往夫妻之间容易吵架，容易两个人厮杀的比较厉害，女方受伤，有的甚至可能会中毒"));
                put("2-6日时", new ShuDes("2-6/6-2", "日时", "阳绝阴数组", "出现在日时上身体会容易浮肿和影响生育能力"));
                put("1-6年月", new ShuDes("1-6/6-1", "年月", "阳绝阴数组", "会影响运势，压运到22岁，出现在月日影响到感情和身体"));
                put("1-6月日", new ShuDes("1-6/6-1", "月日", "阳绝阴数组", "往往夫妻之间容易吵架，容易两个人厮杀的比较厉害，女方受伤，有的甚至可能会中毒"));
                put("1-6日时", new ShuDes("1-6/6-1", "日时", "阳绝阴数组", "出现在日时上身体会容易浮肿和影响生育能力"));
                put("7-11年月", new ShuDes("7-11/11-7", "年月", "阴绝阳数组", "克父，克丈夫，破财，口舌，官非，牢狱，车灾，还易患神经疾病"));
                put("7-11月日", new ShuDes("7-11/11-7", "月日", "阴绝阳数组", "易腰疼，易犯因果病"));
                put("7-11日时", new ShuDes("7-11/11-7", "日时", "阴绝阳数组", "容易患肺部相关疾病"));
                put("7-12年月", new ShuDes("7-12/12-7", "年月", "阳绝阴数组", "代表伤母亲"));
                put("7-12月日", new ShuDes("7-12/12-7", "月日", "阳绝阳数组", "容易伤妻子"));
                put("7-12日时", new ShuDes("7-12/12-7", "日时", "阳绝阳数组", "容易伤家里的女儿，也容易出现开车伤人，打架伤人，外灾伤人等"));

//                put("8-1年月", new ShuDes("8-1", "年月", "阴绝阳数组", "代表克父母，特别是克自己的父亲"));
//                put("8-1月日", new ShuDes("8-1", "月日", "阴绝阳数组", "容易和老公关系不好，瞧不起自己的老公，甚至克自己的丈夫"));
//                put("8-1日时", new ShuDes("8-1", "日时", "阴绝阳数组", "影响男性方面的疾病，造成生活不和谐等"));

                put("1-8年月", new ShuDes("1-8/8-1", "年月", "阴绝阳数组", "在年月上易形成脑供血不足，没精神，头疼、头晕、脑瘤、脑出血等"));
                put("1-8月日", new ShuDes("1-8/8-1", "月日", "阴绝阳数组", "在月日上易形成心脏病、没精神、乳腺炎(癌）、睡觉多梦、梦到死过的人等"));
                put("1-8日时", new ShuDes("1-8/8-1", "日时", "阴绝阳数组", "在日时上易能形成妇科病，半身不遂、阳痿，下身瘫痪、麻痹症等"));
                put("1-9年月", new ShuDes("1-9/9-1", "年月", "阴绝阳数组", "年月上易形成视力下降、头疼、头晕、邪病、大脑供血不足、脑瘤、脑血管硬化等"));
                put("1-9月日", new ShuDes("1-9/9-1", "月日", "阴绝阳数组", "月日上易形成心脏病、心脏供血不足等"));
                put("1-9日时", new ShuDes("1-9/9-1", "日时", "阴绝阳数组", "易能形成精神病、糖尿病、妇科病、阳痿、子宫下垂、肠炎、结石、难产、腰疼、腿疼等"));

                put("1-7年月", new ShuDes("1-7/7-1", "年月", "绝冲数组", "一、从小背乡离家，外出求学、创业，不在家。20岁前就离家 二、晚婚，24岁以上 三、一生多次搬家"));
                put("1-7月日", new ShuDes("1-7/7-1", "月日", "绝冲数组", "婚姻不好"));
                put("1-7日时", new ShuDes("1-7/7-1", "日时", "绝冲数组", "孩子晚年指望不上"));

                put("2-8年月", new ShuDes("2-8/8-2", "年月", "绝冲数组", "一、从小背乡离家，外出求学、创业，不在家。20岁前就离家 二、晚婚，24岁以上 三、一生多次搬家"));
                put("2-8月日", new ShuDes("2-8/8-2", "月日", "绝冲数组", "婚姻不好"));
                put("2-8日时", new ShuDes("2-8/8-2", "日时", "绝冲数组", "孩子晚年指望不上"));

                put("3-9年月", new ShuDes("3-9/9-3", "年月", "绝冲数组", "一、从小背乡离家，外出求学、创业，不在家。20岁前就离家 二、晚婚，24岁以上 三、一生多次搬家"));
                put("3-9月日", new ShuDes("3-9/9-3", "月日", "绝冲数组", "婚姻不好"));
                put("3-9日时", new ShuDes("3-9/9-3", "日时", "绝冲数组", "孩子晚年指望不上"));

                put("4-10年月", new ShuDes("4-10/10-4", "年月", "绝冲数组", "一、从小背乡离家，外出求学、创业，不在家。20岁前就离家 二、晚婚，24岁以上 三、一生多次搬家 四、能出现血管硬化、脑溢血、脑血栓、肝病、舌癌、脑癌"));
                put("4-10月日", new ShuDes("4-10/10-4", "月日", "绝冲数组", "婚姻不好，能出现肝大、胆结石、气管炎、肺结核、上部骨折"));
                put("4-10日时", new ShuDes("4-10/10-4", "日时", "绝冲数组", "孩子晚年指望不上,能出现四肢麻木、恶性关节炎、截肢、车祸外伤、伤腿、半身不遂"));

                put("5-11年月", new ShuDes("5-11/11-5", "年月", "绝冲数组", "一、从小背乡离家，外出求学、创业，不在家。20岁前就离家 二、晚婚，24岁以上 三、一生多次搬家"));
                put("5-11月日", new ShuDes("5-11/11-5", "月日", "绝冲数组", "婚姻不好"));
                put("5-11日时", new ShuDes("5-11/11-5", "日时", "绝冲数组", "孩子晚年指望不上"));

                put("6-12年月", new ShuDes("6-12/12-6", "年月", "绝冲数组", "一、从小背乡离家，外出求学、创业，不在家。20岁前就离家 二、晚婚，24岁以上 三、一生多次搬家"));
                put("6-12月日", new ShuDes("6-12/12-6", "月日", "绝冲数组", "婚姻不好"));
                put("6-12日时", new ShuDes("6-12/12-6", "日时", "绝冲数组", "孩子晚年指望不上"));

            }

    };

    public static List<ShuDes> getShuDesList(ShuResult prev, ShuResult next) {
        List<ShuDes> preList = getlist(prev);
        List<ShuDes> nextList = getlist(next);

        List<ShuDes> mergedList = new ArrayList<>();
        mergedList.addAll(preList);
        mergedList.addAll(nextList);

        return mergedList.stream()
                .filter(shuDes -> shuDes != null)
                .collect(Collectors.toList());
    }

    private static List<ShuDes> getlist(ShuResult shuResult) {
        List<ShuDes> ShuDesList = new ArrayList<>();
        Integer year = shuResult.getYear();
        Integer month = shuResult.getMonth();
        List<Integer> days = shuResult.getDay();
        Integer day= days.size() > 1 ? 999 : days.get(0);
        Integer hour = shuResult.getHour();

        // 封装键的格式
        String yearMonthKey = year + "-" + month + "年月";
        String monthDayKey = month + "-" + day + "月日";
        String dayHourKey = day + "-" + hour + "日时";

        // 从DES_LIST中获取对应的ShuDes对象，并添加到ShuDesList中
        ShuDesList.add(DES_LIST.get(yearMonthKey));
        ShuDesList.add(DES_LIST.get(monthDayKey));
        ShuDesList.add(DES_LIST.get(dayHourKey));

        // 封装其他可能的键的格式
        String monthYearKey = month + "-" + year + "年月";
        String dayMonthKey = day + "-" + month + "月日";
        String hourDayKey = hour + "-" + day + "日时";

        // 从DES_LIST中获取对应的ShuDes对象，并添加到ShuDesList中
        ShuDesList.add(DES_LIST.get(monthYearKey));
        ShuDesList.add(DES_LIST.get(dayMonthKey));
        ShuDesList.add(DES_LIST.get(hourDayKey));

        return ShuDesList;
    }
}
