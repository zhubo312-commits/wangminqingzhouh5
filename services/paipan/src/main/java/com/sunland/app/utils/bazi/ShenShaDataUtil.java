package com.sunland.app.utils.bazi;


import cn.hutool.core.io.resource.Resource;
import cn.hutool.core.io.resource.ResourceUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.nlf.calendar.util.LunarUtil;
import com.sunland.app.domain.bazi.ShenShaData;
import com.sunland.common.constant.Constants;
import com.sunland.common.utils.StringUtils;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * @author: xk 神煞
 * @create: 2023-07-05 11:03
 **/
public class ShenShaDataUtil {
    private static final List<ShenShaData> shenShaDataList;

    static {
        shenShaDataList = loadShenShaDataList();
    }

    private static List<ShenShaData> loadShenShaDataList() {
        Resource shenShaResource = ResourceUtil.getResourceObj("classpath:static/shenSha.json");
        String shenShaContent = shenShaResource.readUtf8Str();
        JSONArray shenShaJsonArray = JSON.parseArray(shenShaContent);
        return shenShaJsonArray.toJavaList(ShenShaData.class);
    }

    public static List<ShenShaData> getShenShaList() {
        return shenShaDataList;
    }


    // 依据各柱干支和神煞规则获取神煞
    public static  List<String> getShenshaWithGanzhi(HashMap<String, List<String>> map, String key, String type) {
        ArrayList<String> list = new ArrayList<>();

        for (ShenShaData shenShaData : shenShaDataList) {
            // 2022-7-21:fix:业务需求去掉'太白星'
            if (!shenShaData.getResult().equals("太白星")) {
                String c = checkShenshaRules(shenShaData, map, map.get(key), key);
                if (c != null) {
                    list.add(c);
                }
            }
        }
        // 添加空亡神煞
        String kongwang = addShenshaKongwang(map, key);
        if (StringUtils.isNotEmpty(kongwang)){
            list.add(kongwang);
        }
        //添加童子煞神煞
        String tongZi = addShenshaTongZi(map, key);
        if (StringUtils.isNotEmpty(tongZi)){
            list.add(tongZi);
        }
        // 根据类型删除一些神煞
        List<String> distinct = list.stream()
                .distinct()
                .collect(Collectors.toList());

        return distinct;
    }



    /**
     * 年柱纳音为金或木的，日支或时支见午或卯的。
     * 年柱纳音为水或火的，日支或时支见酉或戌的。
     * 年柱纳音为土命的，日支或时支见辰或巳的
     * @param map
     * @param key
     * @return 算童子煞神煞
     */
    private static String addShenshaTongZi(HashMap<String, List<String>> map, String key) {
        if (Constants.RI.equals(key)|| Constants.SHI.equals(key)){
            List<String> nianGanZhi = map.get(Constants.NIAN);
            String yearNaYin = getYearNaYin(nianGanZhi).substring(2,3);
            String zhi = BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_ZHI.get(map.get(key).get(1));

            List<String> woodMetalYearNaYin = Arrays.asList("金", "木");
            List<String> waterFireYearNaYin = Arrays.asList("水", "火");
            List<String> earthYearNaYin = Collections.singletonList("土");
            List<String> validZhiForWoodMetal = Arrays.asList("午", "卯");
            List<String> validZhiForWaterFire = Arrays.asList("酉", "戌");
            List<String> validZhiForEarth = Arrays.asList("辰", "巳");
            if (woodMetalYearNaYin.contains(yearNaYin) && validZhiForWoodMetal.contains(zhi)) {
                return "童子煞";
            } else if (waterFireYearNaYin.contains(yearNaYin) && validZhiForWaterFire.contains(zhi)) {
                return "童子煞";
            } else if (earthYearNaYin.contains(yearNaYin) && validZhiForEarth.contains(zhi)) {
                return "童子煞";
            }
        }
        return null;
    }

    /**
     * 获取年柱纳音
     *
     * @return 纳音
     */
    public static String getYearNaYin(List<String> ganZhi) {
        String gz = BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_GAN.get(ganZhi.get(0))+ BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_ZHI.get(ganZhi.get(1));
        return LunarUtil.NAYIN.get(gz);
    }

    // 计算空亡神煞
    private static String addShenshaKongwang(HashMap<String, List<String>> map, String key) {
        List<String> nianGanZhi = map.get(Constants.NIAN);
        List<String> riGanZhi = map.get(Constants.RI);

        String nianXunKong = getXunKong(nianGanZhi);//年空亡
        String riXunKong = getXunKong(riGanZhi);//日空亡

        String zhi = BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_ZHI.get(map.get(key).get(1));
        if (nianXunKong.contains(zhi)||riXunKong.contains(zhi)){
            return "空亡";
        }
        return null;
    }

    // 计算干支空亡
    public static String getXunKong(List<String> ganZhi) {
        String gz = BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_GAN.get(ganZhi.get(0))+ BaZiPinYinUtil.PINYIN_CONVERT_CHINESE_ZHI.get(ganZhi.get(1));
        return LunarUtil.getXunKong(gz);
    }

    // 依据神煞数据格式判断是否拥有神煞
    private static String checkShenshaRules(ShenShaData shenShaData, HashMap<String, List<String>> map, List<String> values, String key) {
        // shenShaData:神煞信息 map:四柱信息 values:当前柱的信息 key:四柱类型(年,月,日,时)
        boolean s = true;
        String baseGanOrZhi = shenShaData.getBaseGanOrZhi();
        String baseGanZhiName = shenShaData.getBaseGanZhiName();
        List<String> keyList = Arrays.asList("dayun", "liunian","liuyue","liuri","liushi");

        // 判断神煞对应的四柱干支是否符合条件
        for (String base4zhus : shenShaData.getBase4zhus()) {
            String ganZhiName = map.get(base4zhus).get("tiangan".equals(baseGanOrZhi) ? 0 : 1);
            if (baseGanZhiName.equals(ganZhiName)) {
                s = false;
                break;
            }
        }

        // 不符合返回null
        if (s) {
            return null;
        }

        // 符合条件后判断其他柱的信息是否符合神煞条件
        if ((keyList.contains(key)) && ("all".equals(shenShaData.getCheck4zhus()) || shenShaData.getCheck4zhus().size() == 4)) {
            String c = ("zhu".equals(shenShaData.getCheckGanOrZhi())) ? values.get(0) + values.get(1) :
                    ("tiangan".equals(shenShaData.getCheckGanOrZhi())) ? values.get(0) : values.get(1);
            return shenShaData.getCheckGanZhiNames().contains(c) ? shenShaData.getResult() : null;
        }

        // 符合条件后判断其他柱的信息是否符合神煞条件
        if (!shenShaData.getCheck4zhus().contains("all") && !shenShaData.getCheck4zhus().contains(key)) {
            return null;
        }
        // 为柱时则判断天干加地支,其余情况取checkGanOrZhi的值
        String c = ("zhu".equals(shenShaData.getCheckGanOrZhi())) ? values.get(0) + values.get(1) :
                ("tiangan".equals(shenShaData.getCheckGanOrZhi())) ? values.get(0) : values.get(1);

        // 判断取值是否在checkGanZhiNames内
        return shenShaData.getCheckGanZhiNames().contains(c) ? shenShaData.getResult() : null;
    }

    public static Map<String, List<String>> getShenShaDesc(List<String> yearShenSha, List<String> monthShenSha, List<String> dayShenSha, List<String> timeShenSha) {
        Map<String, List<String>> map = new HashMap<String, List<String>>();
        List<String> shenSha = Stream.of(yearShenSha, monthShenSha, dayShenSha, timeShenSha)
                .flatMap(Collection::stream)
                .collect(Collectors.toList());

        for (String str : shenSha) {
            if (!CollectionUtils.isEmpty(SHEN_SHA_DES.get(str))) {
                StringBuilder sb = new StringBuilder(str).append("在");
                if (yearShenSha.contains(str)) {
                    sb.append("年柱、");
                }
                if (monthShenSha.contains(str)) {
                    sb.append("月柱、");
                }
                if (dayShenSha.contains(str)) {
                    sb.append("日柱、");
                }
                if (timeShenSha.contains(str)) {
                    sb.append("时柱、");
                }
                String s = sb.substring(0, sb.length() - 1);
                map.put(s,SHEN_SHA_DES.get(str));
            }
        }

        return map;
    }

    public static final Map<String, List<String>> SHEN_SHA_DES = new HashMap<String, List<String>>() {
        private static final long serialVersionUID = -1L;
        {
            this.put("天乙贵人", Arrays.asList("查法：以日、年干查四地支", "人命有天乙贵人，遇事有人帮，临难有人解，是化险为夷最有力的贵人之星。", "天乙贵人：人缘、社交缘、异性缘、长辈缘。", "一生少病，人缘佳，易有社会地位，很适合从事公关性质的工作。", "天乙贵人入命：心性聪明，出入近贵。大运流年见天乙贵人：有生官发财之机，最少亦有吉祥庆事加临。天乙贵人坐旺地：身体健康吉祥富贵，福禄加倍。天乙贵人逢合为忌：多见劳苦，劳苦功高。天乙贵人逢刑冲：多劳累，遇事则贵人去。女命天乙贵人入命、日主自坐二德者：可嫁贵夫。", "天乙贵人是八字里面最重要、最吉祥的一颗贵人星，八字带天乙贵人吉星的人，无形之中会散发一种贵气，给人亲切好相处的感觉。还可以转危为安，有很多人发生了意外的危难，受到的伤害却很小，经常都是因为八字里面带有天乙贵人这颗贵人吉星。"));
            this.put("文昌贵人", Arrays.asList("查法：以日、年干查四地支", "文昌多取食神之临官为贵, 为食神建禄之称。文昌入命,主聪明过人,又主化险为夷。气质雅秀,举止温文,男命逢着内涵,女命逢着仪容得体；具有上进心，不与粗俗之辈乱交朋友。", "文昌逢合为喜：富加且贵。文昌逢合为忌：多见忙碌，劳苦功高。文昌坐旺地：身体健康，幸福如意，利考试，贵气十足。文昌逢刑冲：劳累辛苦。", "文昌入命：心性聪明，出入近贵，气质文雅，好学新知，一生可以近贵利官。"));
            this.put("国印", Arrays.asList("查法：以日、年干查四支", "四柱带国印者，主人诚实可靠，严守清规，照章行事，办事公道。为人和悦，礼义仁慈，气质轩昂。如国印逢生旺，有其它吉星相助，不逢冲破克害，不仅可以有掌印之能，可亦为官掌实权。", "亦主一生工作，生活环境多动，若流年岁运逢之即主工作变动或家庭搬迁。"));
            this.put("太极贵人", Arrays.asList("查法：以日、年干查四地支", "命中带有太极贵人的八字，可以事职平顺亨通、福禄兼得，事情能够化险为夷，一生多得贵人相助，晚年可以幸福安逸，太极贵人可以说是一颗非常珍贵的吉星。"));
            this.put("沐浴", Arrays.asList(""));
            this.put("金舆", Arrays.asList("查法：以日年干查四地支", "日坐金舆：能得异性之助；命带金舆：得祖荫。又称金舆禄神，此星入命能得扶助，一生能得富贵。", "女人逢之，幸福安吉、骨肉安泰。", "男人逢之，得贤妻，享妻钱财，荣富显贵。", "古代皇族，多带此星。金舆是贵人乘坐的车子。乃禄命之旌旗，三才之节钺。主人性柔、貌美，举止温顺。"));
            this.put("禄神", Arrays.asList("查法：以日干查四地支", "身旺见禄，喜见财官。身弱喜禄而逢死绝遭刑冲，又逢吉祥救应，家运可能不太顺利，容易影响到置产、家人之间的关系；同时在求财方面也较为困难。", "在年月为“建禄”，四柱天干要见财官，“建禄生是月，财官喜透天”也。透财，富。透官，贵。", "在时为“归禄”，不喜官星，“日禄归时没官星，号曰青云得路。”主少年发达。“建禄”主长辈之荫，主少年时代幸福。若逢卫破，家运可能不太顺利。身（日主）若太旺，不屑于祖辈留有的家产，不愿坐享现成之福，会自己在外乡创事业。若逢偏印，即破禄而无禄。", "在日为“专禄”（甲寅、乙卯、庚申、辛酉四日），主会享受，爱过阔绰的生活。要有羊刃来保护（因禄柔、刃刚），若被合去则无禄。被冲不利丈夫或者妻子的健康和运势。", "八字如果有禄有财：丰盈一生。八字如果有禄无财：祖先庇荫。八字若无禄有财：白手起家。大运流年与禄神冲克：可能有意外危险，难聚财，健康上也要注意。"));
            this.put("垣城", Arrays.asList(""));
            this.put("羊刃", Arrays.asList("查法：以日干查四地支", "羊刃是一种很强硬的气力，但它不一定是凶恶的，必须看八字中的整体组合。", "假如一个人的八字很弱，羊刃可以起到很大的匡助作用，比如你贫穷困难时，羊刃就是一个强有力的兄弟，能帮助和支持你；假如八字比较旺，再来羊刃的话就危险了，缺乏适当制约的话，他会与你争夺，劫财。", "羊刃是五行过旺之气，通常被认为是凶星。刃，即刀，故亦常与手术、杀伤有关。情绪容易激动，易树敌，生涯充满惊涛骇浪。从事机械、技术之研究，成功的人很多。虽然常碰到困难，但若成功时，所缔造的都是丰功伟业。", "羊刃+血刃+驿马同柱：人身意外、多惊多险、交通意外事故。", "时刃者, 岁运并临, 可能会有意外危难。", "年刃者，祖上家运可能不太顺利，影响到置产、钱财储蓄、家人之间的关系。"));
            this.put("天官", Arrays.asList(""));
            this.put("天福", Arrays.asList(""));
            this.put("词馆", Arrays.asList(""));
            this.put("墓煞", Arrays.asList(""));
            this.put("时墓", Arrays.asList(""));
            this.put("天厨", Arrays.asList("查法：以年干、日干查余四支", "丙干见巳，丁干见午|戊干见申，己干见酉|庚干见亥，辛干见子|壬干见寅，癸干见卯", "天厨又名「食神禄」，先贤陆位亦说:「天厨，宜食禀」，食禀是藏食粮的仓库。", "天厨乃食神建禄之宫，食神是人命福星，食神既能得禄，其福必厚，故谓之天厨。", "天厨入命的人，如不逢刑冲克破空亡，一生不愁吃穿，食禄不虞匮乏，可以享降天之禄、得天赐之福，古人谓之“衣食无忧，福禄满堂”。八字带有天厨贵人的命，一生大都能够平安吉顺，遇事可以化险为夷、福禄优游。女命逢天厨贵人，有口福，爱美食，爱做饭，且烹饪技术一流，饭菜之香胜于他人，能迅速拉高一家人的幸福指数，因此有旺夫一说。"));
            this.put("天德贵人", Arrays.asList("查法：以月支查四柱干支", "天月德助，处世无殃。能把遇到凶险转化为吉祥、顺利，随处保护。", "天地德秀之气，其特点是化解危难。命带天德贵人者有福德，其人心地善良，身体健康，人缘好，在生平之中较不会遇到意外等，纵使逢之也能适时得以化解。", "天德和月德，都是贵人吉星的名称。与其它贵人星有一个最大的不同处，就是天月德比较趋向于一个人个性方面的表现，也就是说天月德谈的是性格。一般来说，八字有天月德入命的人，不但具有贵气的特质，行为处事坦白而无私，也有慈悲心或者同情心。人言积善之家必有余庆，所以天月德也具有遇事化险为夷的功能。"));
            this.put("天德合", Arrays.asList("查法：以月支查四柱干支", "天月德助，处世无殃。能把遇到凶险转化为吉祥、顺利，随处保护。", "天地德秀之气，其特点是化解危难。命带天德贵人者有福德，其人心地善良，身体健康，人缘好，在生平之中较不会遇到意外等，纵使逢之也能适时得以化解。", "天德和月德，都是贵人吉星的名称。与其它贵人星有一个最大的不同处，就是天月德比较趋向于一个人个性方面的表现，也就是说天月德谈的是性格。一般来说，八字有天月德入命的人，不但具有贵气的特质，行为处事坦白而无私，也有慈悲心或者同情心。人言积善之家必有余庆，所以天月德也具有遇事化险为夷的功能。"));
            this.put("天医", Arrays.asList("查法：以月支查其他三支", "天医是掌管疾病之事的星神。四柱逢天医,如不旺,又无贵人吉神相扶,不利于身体健康，容易身弱无力。若生旺又有贵人相生助,不仅身体健壮,而且特别适合从事医学、心理学、哲学等。学习力、理解力、观察力、模仿力、好奇心、研究心、直觉观等能力皆强。"));
            this.put("太白星", Arrays.asList(""));
            this.put("隔角", Arrays.asList(""));
            this.put("丧门", Arrays.asList("查法：以年支查余三支", "年支：子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥|丧门：寅 卯 辰 巳 午 未 申 酉 戌 亥 子 丑|吊客：戌 亥 子 丑 寅 卯 辰 巳 午 未 申 酉|披麻：酉 戌 亥 子 丑 寅 卯 辰 巳 午 未 申|","年支前两位为丧门，比如巳年生人，前两位未就是丧门，后两位卯就是吊客，后三位寅就是批麻。/n披麻、吊客、丧门皆为凶星。如大运、流年遇之，多主人身意外，伤病等事出现，也不容易聚财。"));
            this.put("吊客", Arrays.asList("查法：以年支查余三支", "年支：子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥|丧门：寅 卯 辰 巳 午 未 申 酉 戌 亥 子 丑|吊客：戌 亥 子 丑 寅 卯 辰 巳 午 未 申 酉|披麻：酉 戌 亥 子 丑 寅 卯 辰 巳 午 未 申|", "年支前两位为丧门，比如巳年生人，前两位未就是丧门，后两位卯就是吊客，后三位寅就是批麻。", "披麻、吊客、丧门皆为凶星。如大运、流年遇之，多主人身意外，伤病等事出现，也不容易聚财。"));
            this.put("孤辰", Arrays.asList("查法：以年支查余三支", "男命怕孤辰落在财星之地，或日主的死绝之方。女命怕寡宿落在夫星之地，或日主的死绝之方。这现像造成缘份难偕久之憾，难免刑克，内心容易伤感，尤其是孤寡入命又见空亡的八字，一生比较孤单。八字忌孤辰、寡宿同时入命。", "如果命带孤辰或寡宿，八字又有华盖出现，则是一个非常聪明的孤独之人，往往具有特殊才华，很多艺术家、哲学家、五术家，或是修道者、牧师，多是这种命格。", "男命怕孤辰落在财星之地，或日主的死绝之方。女命怕寡宿落在夫星之地，或日主的死绝之方。这现像造成缘份难偕久之憾，难免刑克，内心容易伤感，尤其是孤寡入命又见空亡的八字，一生比较孤单。八字忌孤辰、寡宿同时入命。", "如果命带孤辰或寡宿，八字又有华盖出现，则是一个非常聪明的孤独之人，往往具有特殊才华，很多艺术家、哲学家、五术家，或是修道者、牧师，多是这种命格。"));
            this.put("寡宿", Arrays.asList("查法：以年支查余三支", "男命怕孤辰落在财星之地，或日主的死绝之方。女命怕寡宿落在夫星之地，或日主的死绝之方。这现像造成缘份难偕久之憾，难免刑克，内心容易伤感，尤其是孤寡入命又见空亡的八字，一生比较孤单。八字忌孤辰、寡宿同时入命。", "如果命带孤辰或寡宿，八字又有华盖出现，则是一个非常聪明的孤独之人，往往具有特殊才华，很多艺术家、哲学家、五术家，或是修道者、牧师，多是这种命格。", "男命怕孤辰落在财星之地，或日主的死绝之方。女命怕寡宿落在夫星之地，或日主的死绝之方。这现像造成缘份难偕久之憾，难免刑克，内心容易伤感，尤其是孤寡入命又见空亡的八字，一生比较孤单。八字忌孤辰、寡宿同时入命。", "如果命带孤辰或寡宿，八字又有华盖出现，则是一个非常聪明的孤独之人，往往具有特殊才华，很多艺术家、哲学家、五术家，或是修道者、牧师，多是这种命格。"));
            this.put("月德贵人", Arrays.asList("查法：以月支查四柱干支", "月德贵人同天乙贵人一样，是一颗很好的吉星，命主在命局中逢上带有月德贵人，一生处世无忧，化险为夷，平生很少生病，不犯官刑。但需要注意的是，月德是勤勉敏慧之徳星，虽然命主身带此吉星，也需本身勤勉自助，才能在紧要关头获得帮助。", "天德和月德，都是贵人吉星的名称。与其它贵人星有一个最大的不同处，就是天月德比较趋向于一个人个性方面的表现，也就是说天月德谈的是性格。一般来说，八字有天月德入命的人，不但具有贵气的特质，行为处事坦白而无私，也有慈悲心或者同情心。人言积善之家必有余庆，所以天月德也具有遇事化险为夷的功能。"));
            this.put("月德合", Arrays.asList("查法：以月支查四柱干支", "月德贵人同天乙贵人一样，是一颗很好的吉星，命主在命局中逢上带有月德贵人，一生处世无忧，化险为夷，平生很少生病，不犯官刑。但需要注意的是，月德是勤勉敏慧之徳星，虽然命主身带此吉星，也需本身勤勉自助，才能在紧要关头获得帮助。", "天德和月德，都是贵人吉星的名称。与其它贵人星有一个最大的不同处，就是天月德比较趋向于一个人个性方面的表现，也就是说天月德谈的是性格。一般来说，八字有天月德入命的人，不但具有贵气的特质，行为处事坦白而无私，也有慈悲心或者同情心。人言积善之家必有余庆，所以天月德也具有遇事化险为夷的功能。"));
            this.put("德秀贵人", Arrays.asList("查法：以月令查天干", "德秀贵人的女命：为人仁慈、敏慧、慈善、温顺、修养高，一生有贵人相助，无险无虑，较为神佛帮助。“德”，就是利物救人、改过迁善。性格温和有相夫教子之美，主人仪容娟秀，对工作和家庭都是和和美美。", "德秀贵人的男命：德者，性格秉性；秀者，天地清秀之气，四时当旺之神。德秀贵人乃阴阳解厄之神，天在正气所在，故有自救解灾之能。男命带德秀贵人，且无冲破克压者，其人聪明晓事，温厚和气，文业通达，遇事常人贵人相助，总能化险为夷。带财官，主贵。此外，男命德秀贵人多带正气，所以命主很可能多在公、检、法或事业单位工作。"));
            this.put("华盖", Arrays.asList("查法：以年、日支查余支", "华盖是一颗吉祥之星，有揽护君主威严的职权，所以华盖是权力的象征，也是工作职事变化的代表性，亦是艺术之星。","华盖是八字忌神，虽然聪明好学，但个性比较有孤僻现象，常见血气方刚，不靠六亲。如果是八字喜神，一生可以自立更生，见解超群，才华有过人之处；可谓气宇不凡，是一个有条件、有能力成就事业的人。","双华盖入命：命中多贵人。华盖为八字吉神：一生利官近贵，技艺出众。岁运华盖逢刑冲：事职有动；若岁运不利，小心意外危难。华盖坐空亡、或逢刑冲：工作起伏变动较多。华盖带将星，福气深厚。华盖在空亡、死、绝之地，可修身养性，修习佛理，净化自身。女命，华盖坐日支：形同寡宿。","华盖临生旺地为喜用，此人才华横溢；","华盖临（日干）墓地，在日支和时柱为忌，不利子女的健康或运势；若有气，可能为僧道；","华盖+七杀、桃花，可能成为艺人、巫师；","华盖+桃花+贵人，会为艺人明星。"));
            this.put("将星", Arrays.asList("查法：以年、日支查余支", "将星跟权力地位有关，命带将星的人，给人不可侵犯的感觉，很自然的散发出一种无形、难以言喻的权威感，让人望而生敬。很多做官的人或工商高层主管八字里面大都带有将星，所以也称为将权，八字带有将星，称做将权入命。","将星入命：能文能武，一生有权柄威信，具有组织领导能力，会见掌权之机。将星为真格：须正官、七杀有力，或印星有力。将星入命，岁运为财官：大权在握，利禄亨通。","将星与亡神同现：才智过人，深具谋略，会是栋梁之才。将星无破：财、官运亨通。将星三合为忌神：奔波多劳。将星逢冲克，权利事职有变动。"));
            this.put("驿马", Arrays.asList("查法：以年、日支查余三支", "代表这个人一生走动多、远行、会出远门。一生驿马运重，即使是在一个地方，也经常会忙个不停，这些都是驿马的作用。","驿马坐旺地：利禄亨通。驿马为喜用：心高气爽，动则有喜。四柱财官有力，真好马也。","驿马为喜用，自坐财官地：岁运逢财官星，主升迁。驿马为忌且逢冲：是非波动。吉神坐马：有乔迁之喜或顺动之利。凶神坐马：奔走四方，忙于生计。驿马与财星同柱：为喜则财源广进；为忌则奔走四方。驿马与财官、贵人同柱：才是真马。驿马与正官同柱：为喜者风儒雅士，为忌者性格开放。","驿马坐七杀，带羊刃或劫煞：小心突发事故。驿马逢冲，带羊刃、元辰、空亡：注意人身意外。驿马见合：有牵制之虑。驿马坐死墓绝、羊刃、劫煞：做事有始无终，飘泊无定。驿马自坐绝地：凶，尤岁运再逢冲。驿马自坐死、绝方：做事少成。桃花坐马：为情爱受难。驿马坐劫煞或羊刃：劳碌奔波，心性多冲动；尤岁运再逢。","劫煞坐马：容易有意外危险。马星生财者：有名扬之机。男命，驿马自坐财星：娶他乡富女。女命，驿马与天乙贵人同柱：不利姻缘。女命，驿马坐独官：夫为有用人，儿孙亦同。女命，驿马自同：嫁远乡。","驿马逢冲：心猿意马，奔波，忙碌，乃天涯之客。流年驿马逢冲：此年多奔波，有迁异职动之机，并多见出国或远行。驿马冲动，若带羊刃、血支等神煞，应该小心行事。"));
            this.put("桃花", Arrays.asList("查法：以年、日支查余三支", "命带桃花,其人性巧,有同情心,爱风流,多才艺,能艺术,如果八字出现桃花而且处于生旺之地则主其人姿容俊美,如果是男人,则慷慨好交游,喜美色;如果是女人则风情万种, 漂亮诱人。桃花并主聪明,异性缘佳。","桃花忌见水,见之则生理欲望比较强。如申子辰人逢癸酉或亥子丑水。时支桃花,时干不宜再见伤官,因为伤官本身已伤害官星(夫星),如再坐桃花, 将导致多夫,及婚姻不美满的情形。","几种情况：","桃花在年月：称为『内桃花』，夫妻恩爱。桃花在日时：称为『外桃花』，夫妻多纷争；尤岁运再逢。时上桃花：桃花强，感情丰富。桃花入命，干见杀星：为人多情、欲望强。","桃花与禄神同柱：有异性缘。桃花与羊刃同柱：感情风波，是非多灾。桃花与空亡同柱：人缘有欠缺之忧，一生为情多苦。桃花与元辰同现或桃花逢刑冲：可能会因为钱财女人方面遇到问题。","不易犯桃花者：桃花坐空亡；命不带桃花。男命，桃花合禄：一生多有女贵人，多见帮助。男命，桃花与禄神同柱：能得桃花之助力。女命，流年大运见桃花刑冲：不利姻缘。","桃花喜与正官、正印同柱：表示自己有自制能力，不致于滥。喜与食神同柱：表示将欲求转为文学、艺术的才华。忌与七杀同柱：表示容易为欲望犯罪，女性则被迫，坠入风尘。","与伤官同柱（欲望强）：表示喜新厌旧、容易自恃才貌、追求时髦，对于感情不太在乎。与劫财同柱：敢爱敢恨、横刀夺爱、争风吃醋。与偏印同柱：生理欲望较强，同性。与比肩同柱：孤芳自赏、独身主义。"));
            this.put("劫煞", Arrays.asList("查法：以年、日支查余三支", "劫煞主意外危难、健康、刑法上面的问题。为喜具有竞争心，肯求上进，做事有魄力，敢担当。","劫煞与贵星同柱：谋事有成。劫煞与天乙贵人、或喜用神同柱：有才能和智谋。劫煞与羊刃同柱：小心意外危险。"));
            this.put("亡神", Arrays.asList("查法：以年、日支查余三支", "亡神若为命局中所喜用的地支，并与吉神同柱，则会沉稳干练，谋略深算，严谨有威，好胜心强。如果恰为命局所忌的地支，又与其它凶煞同柱，则性情中存在着虚伪掩饰的成分，家业容易不顺，影响置业和储蓄；夫妻感情一般，多波折；子女的健康或运势也容易出现问题；自己也经常得罪人，严重的话会有法律纠纷出现。","亡神入命为八字凶神的人，做起起事来总感觉无精打采，不利家运，一生难免争纷，严重者可能会惹上法律纠纷，容易涉足酒色场所。不管男命还是女命，夫妻间都容易争吵，子女也会有不省心的情况发生。古人论命特别强调了亡神入命的危害，其实不是没有道理。","亡神入命：城府多深，做事疑虑。","亡神与天乙贵人同现：老谋深算。","亡神为喜：面有威仪、足智多谋、处事严谨、断事如神，是一个真人不露相的人。","最怕亡神是命中凶忌之神：其人心性难定、事难如愿、脾气粗俗。"));
            this.put("灾煞", Arrays.asList("查法：以年、日支查余三支", "灾煞也叫“白虎煞”，其性勇猛，冲破将星，谓之灾煞。","此煞主人身意外，根据所处五行支，在水火，防焚溺，金木，杖刃；土，坠落瘟疫。若与七杀同柱来克身，可能有危难。也主刑律官司。若灾煞是正官、正印的生旺之支，多是武权。"));
            this.put("六厄", Arrays.asList(""));
            this.put("日贵", Arrays.asList(""));
            this.put("魁罡", Arrays.asList("查法：查日柱", "魁罡坐命：心性刚强霸气，聪明果断，攻击性，不服输，临事果断。带双魁罡：秉权，好杀，具领导才能。必须身旺，才能任其霸气；身弱，则容易遭意外事故，凡事不要强出头。","带魁罡的人，人生可能充满惊涛骇浪，命运起伏大，分化较明显，容易碰到不好的事情。若是女性，大多是美人胚子，但是在恋爱和婚姻方面感情较差。法官、教授、艺术家、裁缝、理发业人士，有很多是魁罡日出的。","具有独立自主精神、精明干练、模仿、组织力皆强，性情属于累积性暴发。"));
            this.put("日德", Arrays.asList(""));
            this.put("阴阳煞", Arrays.asList("查法：查日柱", "行事阴阳颠倒，多有事成反败之虞。好变不好，诸事多见在阴错阳差下，或完成、或结束。","阴差阳错，是太过与不及、男女不和的意思。一般带阴差阳错者可能有同母异父或同父异母的兄弟姐妹，在丧期中成婚、谈亲事时发生不愉快之事，妻子与父母相处的不太融洽，和妻舅感情疏远。做事阻碍较大，容易错失良机。"));
            this.put("九丑", Arrays.asList("查法：查日柱", "此煞名“丑”，不是指容貌不好看，相反的，此日生者大多容貌美丽，或很有吸引人的魅力。其所以名“丑”，是指名声方面的风评，因感情的事容易出问题，严重的可能会惹上法律纠纷，名声受损。"));
            this.put("天赦", Arrays.asList("查法：寅卯辰月生戊寅日, 巳午未月生甲午日, 申酉戌月生戊申日, 亥子丑月生甲子日。", "天赦是化险为夷之星，能解人危难。尤其对犯法之人，有宽大处理之可能。纵有过错也可得到宽恕或赦免。"));
            this.put("四废", Arrays.asList("查法：以日柱见之即是", "四废日是在春夏秋冬四个季节中，干支与季节旺气，呈一百八十度的相反的结构。季节为王（朝廷），四废日就像被朝廷刻黜的官吏。以“刻”为“不用”之意引申，四刻日生者，是比较没有个性、事业上面作为不大的人，或者是怀才不遇的人，平凡过其一生。","命局中带“四废”神煞的人，一生之中做事可能会有始无终，需要多注意健康问题。"));
            this.put("天地转煞", Arrays.asList("查法：以月支查日柱", "正所谓“盛极而衰，否极泰来”，事物发展到某种程度就会发生转变。天转地转日为五行能量旺的日子，正处于盛极而衰的状态，会因为能量过盛而带来危险。","比如官位高而显赫，几乎与君主平等，如不急流勇退，可能有意外事故；家财万贯，富裕满盈，还执着于钱财，可能会被政府、坏人盯上，家庭容易遭遇不幸。","生于天转地转日的人，如果格局组合不好，没有它柱干支和纳音克制，很容易出现健康问题，少年体弱等情况。成人以后，一生中也往往是祸福相依，经历磨难。需要命主常怀敬畏，多行好事，方能平安顺遂。此外，天转地转日接受上司派遣出行、经商做买卖、建筑、嫁娶等，容易有意外事情发生。"));
            this.put("金神", Arrays.asList("查法：查日柱或时柱", "金见水则沉,故金神不喜水乡,不利西北：金神喜见财,行财运则发：财运虽美,火乡更妙。", "金神之义是取巳酉丑金属而名，又为杀（破碎）之位。子午卯酉的在巳，辰戌丑未的在丑，寅申巳亥的在酉。的杀是破球之星、加上金的刚性，成为具有较强破坏力的星宿，人命带之性多威猛强烈，胆大、好胜、常使人敬而远之。","刚金要得火炼，因此有金神入火乡，发如猛虎之说。也就是金神命格的人，其命中或岁运逢着丙、丁、巳、午时，能有大发展。"));
            this.put("红艳煞", Arrays.asList("查法：以日干查四地支", "红艳煞是桃花的一种。命见红艳煞不见得有多漂亮，但风流多情，好美色，人命犯之，多数有外遇桃花，男女感情方面他把控的不太好，容易有纠纷。女命见之，难免私情，一谈恋爱可能就会陷入同居生活，如果地支有日干的禄，又带驿马，为欲望较强之人。","女命，红艳与正官或正印同柱：乃良妇也。女命，红艳与七杀同柱：易见外遇，不利姻缘。女命，红艳逢冲：须防身体健康的问题。女命，红艳逢合：桃花不断。女命，红艳坐凶煞：多见桃花灾。"));
            this.put("阴差阳错", Arrays.asList("查法：查日柱", "阴差阳错，是太过与不及、男女不和的意思。","一般带阴差阳错者可能有同母异父或同父异母的兄弟姐妹，在丧期中成婚、谈亲事时发生不愉快之事，妻子与父母相处的不太融洽，和妻舅感情疏远。做事阻碍较大，容易错失良机。"));
            this.put("血刃", Arrays.asList("查法：以月支查四柱干支", "无特别释义，注意身体健康、意外的事故。"));
            this.put("孤鸾煞", Arrays.asList("查法：查日柱", "又名“呻吟煞”。夫妻多纷争。","男命：婚姻中不太懂的相处，和妻子不和睦，可能会出现外遇事件。","女命：夫妻感情多一般，正缘来的晚，多为晚婚，注意健康问题。","女命带孤鸾与子女缘分薄，若四柱中见官杀则不适用此条。孤鸾日生的女子不利姻缘，夫妻感情多波折，两人需要面对的问题较多。"));
            this.put("流霞", Arrays.asList("查法：以日干查四地支", "流霞逢冲：易犯人身意外。男命：酒色。女命：分娩方面的意外。","古人称血煞。轻者可能会有皮肉之伤，健康方面的问题，重者可能会有人身意外。命犯血煞，最怕八字凶神带重，大运流年又走在凶煞冲克之地，可能会因为一些事情而受伤或出现人身意外，如果八字有吉神转化，是可以化险为夷的。","岁运走在流霞、血支、血刃的流年，不论轻重，或多或少可能会受伤。如果是在不利的流年岁月期间，外出、开车多加小心谨慎，防止意外发生的严重性增加。"));
            this.put("天罗", Arrays.asList("查法：以年、日支查余三支", "戌亥为天罗，辰巳为地网；","戌见亥, 亥见戌为天罗；辰见巳, 巳见辰为地网。","男忌天罗, 女忌地网。","天罗地网, 容易惹上法律纠纷, 大运流年遇之,于人不利，若天月二德解救则无忧。","大多命带罗网的人，在人生旅途上所接受的考验、打击较重大，须奋斗挣扎才能出人头地，若命格不高，意志不足就被命运之神俘虏，庸庸碌碌过其一生；有的则甘心落后，误入歧途。"));
            this.put("地网", Arrays.asList("查法：以年、日支查余三支", "戌亥为天罗，辰巳为地网；","戌见亥, 亥见戌为天罗；辰见巳, 巳见辰为地网。","男忌天罗, 女忌地网。","天罗地网, 容易惹上法律纠纷, 大运流年遇之,于人不利，若天月二德解救则无忧。","大多命带罗网的人，在人生旅途上所接受的考验、打击较重大，须奋斗挣扎才能出人头地，若命格不高，意志不足就被命运之神俘虏，庸庸碌碌过其一生；有的则甘心落后，误入歧途。"));
            this.put("童子煞", Arrays.asList("查法：命造生在春季或秋季的（以月令算），日支或时支见寅或子的。命造生在冬季或夏季的（以月令算），日支或时支见卯、未或辰的。","犯童子煞的人一般时运不好事业受阻，容易遇到人格有问题的人，遭到嫉妒和排斥，自己有时已经很努力了，但是结果没有意义。前途一片光明有时自己找不到出路，就像被困在陷阱的动物渴望寻找到出路一样。尤其是婚姻感情方面不顺利，晚婚居多。"));
            this.put("十恶大败", Arrays.asList("查法：查日柱", "十败日所生之人由于生不带禄，多数不太会持家，花钱容易大手大脚，仓库金银化为尘。犹如无源之水、无本之木，没有资本很难成事。","在世袭的古代，表示不能承袭宜、父的官职、产业，在古代这情形多发生于犯罪被搜查并没收家产，所以名为“十恶大败”。十恶，是不赦重罪。大败，表示精光、消减 。在现代可能会表示把父辈辛苦创建留下来的产业，自己给吃喝玩乐掉。","生于十恶大败日的人，在庭生时，家运不顺，可能影响到置产、钱财储蓄。或已走过，当然不能得其福荫。"));
            this.put("披麻", Arrays.asList("查法：以年支查余三支", "年支：子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥|丧门：寅 卯 辰 巳 午 未 申 酉 戌 亥 子 丑|吊客：戌 亥 子 丑 寅 卯 辰 巳 午 未 申 酉|披麻：酉 戌 亥 子 丑 寅 卯 辰 巳 午 未 申","年支前两位为丧门，比如巳年生人，前两位未就是丧门，后两位卯就是吊客，后三位寅就是批麻。","披麻、吊客、丧门皆为凶星。如大运、流年遇之，多主人身意外，伤病等事出现，也不容易聚财。"));

        }
    };


}
