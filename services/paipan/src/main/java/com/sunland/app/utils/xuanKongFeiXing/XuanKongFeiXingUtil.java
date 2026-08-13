package com.sunland.app.utils.xuanKongFeiXing;

import com.nlf.calendar.*;
import com.sunland.app.domain.vo.FeiXingVo;
import com.sunland.app.domain.xuankongfeixing.XuanKongFeiXingGong;
import com.sunland.app.enums.BaGua;
import com.sunland.common.utils.DateUtils;


import java.util.*;
import java.util.stream.Collectors;

/**
 * @author: xk
 * @create: 2024-01-09 17:29
 **/
public class XuanKongFeiXingUtil {

    /**
     * 24山向
     */
    public static final List<String> shanXiang24 = Arrays.asList(
            "壬山丙向",
            "子山午向", "癸山丁向", "丑山未向", "艮山坤向", "寅山申向", "甲山庚向", "卯山酉向",
            "乙山辛向", "辰山戌向", "巽山乾向", "巳山亥向", "丙山壬向", "午山子向", "丁山癸向",
            "未山丑向", "坤山艮向", "申山寅向", "庚山甲向", "酉山卯向", "辛山乙向", "戌山辰向",
            "乾山巽向", "亥山巳向"
    );

    /**
     * 24山方位
     */
    public static final Map<String, List<String>> mountainMap = new HashMap<String, List<String>>(){
        private static final long serialVersionUID = -1L;
        {
            put("子山午向", Arrays.asList("子山", "艮", "震", "巽", "午向", "坤", "兑", "乾"));
            put("癸山丁向", Arrays.asList("癸山", "艮", "震", "巽", "丁向", "坤", "兑", "乾"));
            put("丑山未向", Arrays.asList("壬", "丑山", "甲", "辰", "丙", "未向", "庚", "戌"));
            put("艮山坤向", Arrays.asList("子", "艮山", "卯", "巽", "午", "坤向", "酉", "乾"));
            put("寅山申向", Arrays.asList("子", "寅山", "卯", "巽", "午", "申向", "酉", "乾"));
            put("甲山庚向", Arrays.asList("壬", "丑", "甲山", "辰", "丙", "未", "庚向", "戌"));
            put("卯山酉向", Arrays.asList("子", "艮", "卯山", "巽", "午", "坤", "酉向", "乾"));
            put("乙山辛向", Arrays.asList("子", "艮", "乙山", "巽", "午", "坤", "辛向", "乾"));
            put("辰山戌向", Arrays.asList("壬", "丑", "甲", "辰山", "丙", "未", "庚", "戌向"));
            put("巽山乾向", Arrays.asList("子", "艮", "卯", "巽山", "午", "坤", "酉", "乾向"));
            put("巳山亥向", Arrays.asList("子", "艮", "卯", "巳山", "午", "坤", "酉", "亥向"));
            put("丙山壬向", Arrays.asList("壬向", "丑", "甲", "辰", "丙山", "未", "庚", "戌"));
            put("午山子向", Arrays.asList("子向", "艮", "卯", "巽", "午山", "坤", "酉", "乾"));
            put("丁山癸向", Arrays.asList("癸向", "艮", "卯", "巽", "丁山", "坤", "酉", "乾"));
            put("未山丑向", Arrays.asList("壬", "丑向", "甲", "辰", "丙", "未山", "庚", "戌"));
            put("坤山艮向", Arrays.asList("子", "艮向", "卯", "巽", "午", "坤山", "酉", "乾"));
            put("申山寅向", Arrays.asList("子", "寅向", "卯", "巽", "午", "申山", "酉", "乾"));
            put("庚山甲向", Arrays.asList("壬", "丑", "甲向", "辰", "丙", "未", "庚山", "戌"));
            put("酉山卯向", Arrays.asList("子", "艮", "卯向", "巽", "午", "坤", "酉山", "乾"));
            put("辛山乙向", Arrays.asList("子", "艮", "乙向", "巽", "午", "坤", "辛山", "乾"));
            put("戌山辰向", Arrays.asList("壬", "丑", "甲", "辰向", "丙", "未", "庚", "戌山"));
            put("乾山巽向", Arrays.asList("子", "艮", "卯", "巽向", "午", "坤", "酉", "乾山"));
            put("亥山巳向", Arrays.asList("子", "艮", "卯", "巳向", "午", "坤", "酉", "亥山"));
            put("壬山丙向", Arrays.asList("壬山", "丑", "甲", "辰", "丙向", "未", "庚", "戌"));
        }
    };


    /**
     * 24 山向对应八卦
     */
    public static Map<List<String>, BaGua> guaMap = new HashMap<List<String>, BaGua>() {
        private static final long serialVersionUID = -1L;

        {
            this.put(Arrays.asList("壬", "子", "癸"), BaGua.坎);
            this.put(Arrays.asList("丑", "艮", "寅"), BaGua.艮);
            this.put(Arrays.asList("甲", "卯", "乙"), BaGua.震);
            this.put(Arrays.asList("辰", "巽", "巳"), BaGua.巽);
            this.put(Arrays.asList("丙", "午", "丁"), BaGua.离);
            this.put(Arrays.asList("未", "坤", "申"), BaGua.坤);
            this.put(Arrays.asList("庚", "酉", "辛"), BaGua.兑);
            this.put(Arrays.asList("戌", "乾", "亥"), BaGua.乾);
        }
    };
    /**
     * 判断阴阳 阳为true 阴为false
     * 阳：甲 寅 艮 巳 巽 丙 申 坤 庚 亥 乾 壬
     * 阴：癸 子 丑 乙 卯 辰 丁 午 未 辛 酉 戌
     */
    public static Map<String, Boolean> yinYang = new HashMap<String, Boolean>() {
        private static final long serialVersionUID = -1L;

        {
            put("甲", true);
            put("寅", true);
            put("艮", true);
            put("巳", true);
            put("巽", true);
            put("丙", true);
            put("申", true);
            put("坤", true);
            put("庚", true);
            put("亥", true);
            put("乾", true);
            put("壬", true);

            put("癸", false);
            put("子", false);
            put("丑", false);
            put("乙", false);
            put("卯", false);
            put("辰", false);
            put("丁", false);
            put("午", false);
            put("未", false);
            put("辛", false);
            put("酉", false);
            put("戌", false);
        }
    };


    /**
     * 大写 运
     */
    private static final List<String> daxieArray = Arrays.asList("一", "二", "三", "四", "五", "六", "七", "八", "九");

    /**
     * 60甲子日列表
     */
    private static List<String> JIA_ZHI_DAY = Arrays.asList(
            "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
            "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
            "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
            "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
            "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
            "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
    );


    /**
     * 地支
     */
    public static final List<String> ZHI = Arrays.asList("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥");

    public static Map<String, String> dataMap = new HashMap<String, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put("1+1", "有桃花，紫白诀云:一白为官星之应，主宰文章，主读书聪明,利文职。玄空秘旨云:坎宫高塞而耳聋，漏道在坎宫，遗精泄血。玄机赋亦云:坎宫缺陷而堕胎，水在坎宫流，失志。");
            this.put("1+2", "男性易患肠胃病、肾疾、耳疾，女性易患肠胃病或妇科病。玄机赋云:坎流坤位，买卖常遭妇贱之羞。竹节赋云:坤艮动见坎，中男绝灭不还乡，一加二五，伤及壮丁。玄空秘旨云:腹多水而膨胀。");
            this.put("1+3", "争执、吵闹、官非、劫盗、破财。但玄髓经云:木入坡宫，风池身贵。");
            this.put("1+4", "出门有利,升职加薪。坐于该位，读书有成、有名。紫白诀云:四一同宫，准发科名之显。飞星赋云:四荡一淫。摇鞭赋云:水财旺妇女贵。");
            this.put("1+5", "秘本玄:一加二五伤及壮丁，犯肾病、耳疾，伤中男。");
            this.put("1+6", "武贵、如意、吉利、文喜，但亦犯淫乱。");
            this.put("1+7", "桃花，出门有利,失运伤灾或是非。玄空秘旨云:金水多情，贪花恋酒。");
            this.put("1+8", "土克水,犯耳疾、狗伤、伤中男、中男外出不还乡、不利小儿。");
            this.put("1+9", "水火不容，易犯性疾、皮肤病、男小产、眼疾、精神病。但天玉经云:坎离火中天过，龙池移帝座。竹节赋云:中男合就离家火，夫妇先吉而后有伤。");
            this.put("2+2", "二黑是病符。疾病，人医院。女性妇科病、怀孕。男性肠胃病、内脏病、当运主富。");
            this.put("2+3", "名为斗牛煞,官非、是非、口舌、生灾、伤母、产伤。");
            this.put("2+4", "婆媳不和、防猫咬、犬伤、蛇咬、伤母、风疾。");
            this.put("2+5", "二五交加必损主、孤寡、母多病、伤病。紫白诀云:二主宅母多病，黑逢黄至出鳏夫。");
            this.put("2+6", "有进田庄之喜，主人进财，买地买楼、但吝啬。紫白诀云:二黑飞干，逢八白而财源大进。");
            this.put("2+7", "当运主进财喜事，但易犯桃花。失运是非口舌、劫盗，但对九紫命有利。");
            this.put("2+8", "合十主吉、有进田庄之喜，利迁移、子孙劳。玄空秘旨云:丑未换局面出僧尼。");
            this.put("2+9", "火土相生多产女、易犯桃花、母体欠安得令主文喜。失令不育出愚人。摇鞭赋云:入户逢灾损少娘。");
            this.put("3+3", "失令易犯官非、是非、争斗。紫白诀云:嗤尤碧色，好勇斗狠之神，盗贼。当令主富贵。");
            this.put("3+4", "失运易犯桃花、劫贼、大女犯疾。当令，主文上有喜贵人助，有名声。");
            this.put("3+5", "视五黄而定。多主不吉、伤脾胃、主人不安、温病、长男不安。但当令主田庄。");
            this.put("3+6", "官非、手脚易伤、不利长男、多病伤、老翁不吉、当令有权威、文喜");
            this.put("3+7", "易破财、官非、劫盗。当令有进财之喜，但易生疾病，伤长男。");
            this.put("3+8", "不利少男、多疾、多伤、残废、破财、绝后。");
            this.put("3+9", "人聪明、但吝啬、喜庆、进财、多生贵命。");
            this.put("4+4", "当令文喜、利名声、贵人多助。失令易犯桃花、外出不归。");
            this.put("4+5", "当令多进田庄。失令家人多犯病伤、损财、因财生灾。");
            this.put("4+6", "烦恼事先合后散、劳碌、难产。秘旨云:巽宫水路缠干。主有悬梁之厄，不利长女。");
            this.put("4+7", "得令财色佳美。失令姑媳不和、易犯刀伤、不利文、吐血、伤长妇、犯劫盗。");
            this.put("4+8", "有进田庄之喜、利田产、利横财。失令损财、伤少男、残废、生风疾、风湿病、小产、不正常桃花。");
            this.put("4+9", "木火通明，主出聪明人士、进财、但多出寡妇、不正常桃花。");
            this.put("5+5", "");
            this.put("5+6", "六白金星化五黄、大吉、免病少灾,但父难安。");
            this.put("5+7", "土金相生，当令大进财富、喜事临门。失令、易犯喉疾、病灾、劫盗。");
            this.put("5+8", "吉，八白当令多进横财。失令则筋骨有损，不利少男小口。");
            this.put("5+9", "凶,飞星断云:青楼染疾，只因七弼同黄。难产、伤亡。");
            this.put("6+6", "吉。当令官显、权威、出科名、利文。失令长子痴迷、不利父、犯官刑。");
            this.put("6+7", "大凶，名交剑杀，官非、不和、口舌分争、部属造反、皮肤病、手脚受伤、多生女、犯劫盗。但七运当令，进财有喜。");
            this.put("6+8", "大吉。当令大进财喜、地产、官显、身荣、利名气。");
            this.put("6+9", "火烧天门家生不听教之儿。犯牙病、脑病、劳苦、肺病、血病、火灾、伤老翁、不利父。");
            this.put("7+7", "当令主喜庆、进田庄、财源旺、多生女。失令则是非、口舌、劫盗窃案、肃杀。");
            this.put("7+8", "大吉,进横财、利求名、男女多情、大旺少房。");
            this.put("7+9", "名为回禄之灾,易犯心脏病、聪明刻薄、少女多伤灾。");
            this.put("8+8", "大吉。八运大旺地产、旺横财、利少男、多生男。失运，少男易伤亡。");
            this.put("8+9", "火土相生、丁财两旺、婚喜。");
            this.put("9+9", "目疾、精神病、当令喜乐、文喜。");
            this.put("9+8", "当运，多进田产、婚喜、但家人易犯气燥、易犯眼疾、吐血。");
            this.put("9+7", "九七穿途，常招回禄之灾、心脏病、财难聚、多破财、不利少女、官非口舌常临。");
            this.put("9+6", "火烧天而张牙相关，家生骂父之儿、易犯脑病、吐血、伤长男、父早亡、多犯官刑。");
            this.put("9+5", "不吉,火见土出顽夫、家人多犯病、残疾、犯火灾。");
            this.put("9+4", "易犯不正常桃花、耗财。当令主出人聪明、财旺，但子孙稀少。");
            this.put("9+3", "官非、瘟病。当令，出聪明人士、人孝顺。");
            this.put("9+2", "火土相生、人口多不安、易犯病、眼疾、妇科病、火见土而出愚钝顽夫、难生育、贫穷。得令出秀士、旺丁、但空快乐。");
            this.put("9+1", "水火既济、性病、犯桃花、利文、有名望。");
            this.put("8+7", "当令大进财利、大利少男少女。摇鞭赋云:山泽进财人生旺。");
            this.put("8+6", "土金相生，大吉、大利财帛、利武职、文士、得令多生贵子。");
            this.put("8+5", "家人犯病不安、筋伤骨折、伤少男、不利小口。");
            this.put("8+4", "姑娘难出嫁、难生子、腰痛、自杀、吊颈、风疾、狗咬、蛇毒、伤少男。");
            this.put("8+3", "不利小口，离婚、多生女难育子、腰痛、自杀、吊颈、出嫁无期、少男多亡。");
            this.put("8+2", "失令疾病。易犯肠胃病、母体不安、少年多劳。秘旨云:天市合丙坤，富堪敌国。八运当令，大进财源。");
            this.put("8+1", "土克水易犯耳病、肾病、膀胱病、中男外出不归家、伤中男。");
            this.put("7+6", "名交剑杀，大凶、是非、争斗、官刑、多生女。");
            this.put("7+5", "视五黄而定。飞星断:青楼染疾，只因七弼同黄，紫黄毒药，邻宫兑口莫尝，主多犯病不安。");
            this.put("7+4", "桃花、出门、刀伤、不利长女、损文、颠疾疯狂、伤女人。");
            this.put("7+3", "大凶。打劫、官非、破财、刀伤、争斗、盲一眼、伤长男。秘旨云:木金相反，背义忘恩。吐血、刻薄。");
            this.put("7+2", "二七合先天火。利二黑、五黄、八白命。七运当令主进财、富贵、桃花盛。失运主口舌、是非、疾病。");
            this.put("7+1", "主出远门，金水多情、贪花恋酒、易犯桃花,摇鞭赋云:白虎投江六畜伤。");
            this.put("6+5", "星运当令,财进之喜。玄空秘旨云:富并陶朱，断是坚金遇土。失令则易犯病伤、不利长子、精神病、父消极。");
            this.put("6+4", "先合后散、女性多病、刀伤、不利文、因财伤亡、长女要当心。");
            this.put("6+3", "手脚易犯刀伤、钉伤、损长子、或长子不安。");
            this.put("6+2", "当令有财。失令易犯病、肠疾、妇科病。");
            this.put("6+1", "当令文上有喜、有权、官显。失运主桃花、淫乱、小产。");
            this.put("5+4", "木克土、主破财、田园废尽、大凶、人口不安、犯病。");
            this.put("5+3", "破财伤身、穷途困病再遭殃。肠胃病，长男不安。");
            this.put("5+2", "肠病、手脚易伤、出寡妇、孕妇多灾、家人多病难安。");
            this.put("5+1", "伤壮丁，不利中男、多犯病、尿道病、精神不佳、肾病。");
            this.put("4+3", "淫乱、盗贼、少女精神病。");
            this.put("4+2", "婆媳不和、脾胃病、母有伤不安、多病、母亡。");
            this.put("4+1", "有利读书、外出、远走他方、有名声、贵显。但失令易犯桃花、淫乱、不守规则。");
            this.put("3+2", "名斗牛煞、是非、官非、争斗、破财、母伤、肠胃病。");
            this.put("3+1", "易犯官非、是非、口舌、争斗、破财。但得令时,玄髓经云:木入坎宫、风池身贵。");
            this.put("2+1", "女性妇科病、肠胃病、男性肠胃病、耳病、伤中男、少男外出不回家、肾疾。");

        }
    };


    // 创建一个 HashMap
    public static Map<Integer, String> elementMap = new HashMap<Integer, String>() {
        private static final long serialVersionUID = -1L;

        {
            this.put(1,
                    "一白水星\n" +
                    "五行：水\n" +
                    "人物：中男、江湖之人、舟中之人、盗贼、匪。\n" +
                    "人事：险陷卑下、外云以柔、内序以利、飘泊不成，随波逐流。\n" +
                    "身体：耳、血、肾。\n" +
                    "疾病：耳痛、心疾、感染、胃冷、水泻、涸冷之病、血病。\n" +
                    "物品：门窗、台灯、矮、珍珠、蓝宝石、冰箱、鱼缸、水龙头以及有海景、瀑布和河流照片或图片以及雕刻鸭、鹅、猪、弓箭造型品。\n" +
                    "外形特征：如数峰连绵而成水波状，且没有突出的主峰。\n" +
                    "色彩：黑色、白色、银色可转换气氛，振作精神，海蓝色、橄榄绿可恢复平和悠闲的心情。\n" +
                    "作用：开发潜力，增强思考力，发明创作的才能，加强意志，并且对久婚不孕者有增强怀孕的机会。");

            this.put(2,
                    "二黑土星\n" +
                    "五行：土\n" +
                    "人物：老母、后母、农夫、乡人、众人、老妇人、大腹人。\n" +
                    "人事：吝啬、柔顺、懦弱、众多、小人。\n" +
                    "身体：腹、脾、肉、胃。\n" +
                    "疾病：腹疾、脾胃之病、饮食停滞、谷食不化。\n" +
                    "物品：方形桌椅、寝具、静物、容器、地毯、垫布、拖鞋、手提袋、陶瓷器。\n" +
                    "外形特征：平坦、方形者、方高者如顿笏、如屏风低者如牙梳、如木橱。\n" +
                    "色彩：土黄色、棕色、褐色、咖啡色、紫色可加强工作的干劲。白色、金黄色、白金色可松驰情绪。\n" +
                    "作用：使浪费者变为节俭，并且增进爱心，涵养，收敛改善消化功能。");
            this.put(3,
                    "三碧木星\n" +
                    "五行：木\n" +
                    "人物：长男\n" +
                    "人事：起动、怒、虚惊、鼓动躁、多动少静。\n" +
                    "身体：足、肝、头发、声音。\n" +
                    "疾病：足疾、肝之病、惊恐不安。\n" +
                    "物品：木制家具、竹木雕刻品或者龙或鹿的造形物，植物、萧笛、花树。\n" +
                    "色彩：绿色、黄绿、草绿、翠绿、青绿皆是。深蓝色、青色可启发潜能。\n" +
                    "作用：激发积极进取，改善急躁，培养信心使人拥有青春活力，早日出人头地。");

            this.put(4,
                    "四绿木星\n" +
                    "五行：木\n" +
                    "人物：长女、秀士、寡妇之人、山林仙道之人、僧道。\n" +
                    "人事：柔和、不定、鼓、利市三倍、进退不果。\n" +
                    "身体：肱、股气、风疾。\n" +
                    "疾病：股肱之疾、风疾、肠病、中风、塞邪气疾。\n" +
                    "物品：盆栽植物，如小的梅花、观章竹、茶花、含羞草、毛笔、书纸。\n" +
                    "色彩：素色、白色、绿色。\n" +
                    "作用：增强名誉，理财能力，同时有利外迁，创作的灵感。");

            this.put(5,
                    "五黄土星\n" +
                    "五行：土\n" +
                    "疾病：内藏五脏、防毒物伤害和肿瘤、癌症等。\n" +
                    "凶煞：横死、精神分裂。\n" +
                    "物品：古董，如传家之宝，罗盘、扫帚，以及一些怪异的物品，这些物品必须来自古屋古墓、古寺等，因为这些物品的怪异，因此选用时必谨慎考虑。\n" +
                    "色彩：黄色、土黄色、满色、茶色、棕色。\n" +
                    "作用：增加个人的权威，领导能力，并且有逢凶化吉的妙用。");

            this.put(6,
                    "六白金星\n" +
                    "五行：金\n" +
                    "人物：君、父、大人、老人、长者、宫吏、名人、公务员。\n" +
                    "人事：刚健武勇、果决、多动少静。\n" +
                    "身体：首、骨、肺。\n" +
                    "疾病：头之疾、肺疾、盘骨疾、上焦（三焦之一）疾。\n" +
                    "物品：六白金星的物品相对来说比较豪华尊贵，与一般人的用品不同，如宝石、黄金、钟表、真水晶等，一般人也可选择圆镜、水晶制品、玻璃杯、车辆模型、神像以及天文仪器。\n" +
                    "色彩：金黄色、银色、素白色。\n" +
                    "作用：培养尊贵的气质，发挥潜在的能力。");

            this.put(7,
                    "七赤金星\n" +
                    "五行：金\n" +
                    "人物：幼女、妾、歌伎、伶人、巫师、奴仆、婢。\n" +
                    "人事：喜悦、口舌、谤、饮食。\n" +
                    "身体：舌、口、喉、肺、痰、涎。\n" +
                    "疾病：口舌、咽喉之疾、气逆喘疾、饮食不佳。\n" +
                    "物品：玩偶、明星照片、少女图片、象棋、葫芦、艺术刀、香水瓶，以及五金制品。\n" +
                    "色彩：白色、金色、银色。\n" +
                    "作用：有利发挥口才，增强决断力，同时未婚者能增强恋爱的机会。");

            this.put(8,
                    "八白土星\n" +
                    "五行：土\n" +
                    "人物：少男、闲人、山中人、童子。\n" +
                    "人事：阴隔、宁静、进退、不决、以前线、止住、不见。\n" +
                    "身体：手指、骨、鼻、背。\n" +
                    "疾病：手指之病、脾之疾。\n" +
                    "物品：雅石、桌椅、沙发、珠宝盒、印石、砚、陶器、水壶、花瓶。\n" +
                    "色彩：茶色、褐色、咖啡色、土黄色、砖红色。\n" +
                    "作用：稳定的意义。");

            this.put(9,
                    "九紫火星\n" +
                    "五行：火\n" +
                    "人物：中女、文人、大腹、目疾人、军人。\n" +
                    "人事：文化之所、聪明才学、相见虑心、美丽。\n" +
                    "身体：眼睛、心、上焦（三焦之一）。\n" +
                    "疾病：目疾、心疾、上焦病、流行病。\n" +
                    "物品：镜子、水晶灯、太阳镜、彩画玻璃、人造花、电冰箱、微波灶、电灯、电烫、手电筒、罗盘、化妆品、以及飞机、枪炮、火军模型物品。\n" +
                    "色彩：洋红、朱红、紫红、红紫。\n" +
                    "作用：培养敏锐的观察力，光明磊落花流水的心性，女可养蕴容智，成熟的魅力。");


        }
    };


    /**
     * 九宫
     */
    private static final List<Integer> jiu = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9);

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
     * 布运盘
     * 文本框输入几运，中宫就是几，然后按飞星顺序
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingDaYun(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        Integer daYun = feiXingVo.getDaYun();
        // 从5开始顺排序
        for (int i = 0; i < 9; i++) {
            Integer shiftedA = circularShift(daYun, jiu, i);
            Integer shiftedB = circularShift(5, jiu, i);
            xuanKongFeiXingGongs.get(shiftedB - 1).setDaYun(daxieArray.get(shiftedA - 1));
        }

    }


    /**
     * 布山盘
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingShan(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        Integer type = feiXingVo.getType();// 挨星下卦0挨星替卦1
        String shanXiang = feiXingVo.getShanXiang();
        String shan = shanXiang.substring(0, 1);

        // 判断山的值属于哪个【卦】
        BaGua bagua = guaMap.entrySet()
                .stream()
                .filter(kvEntry -> kvEntry.getKey().contains(shan))
                .map(Map.Entry::getValue).findFirst().get();

        XuanKongFeiXingGong xuanKongFeiXingGong = xuanKongFeiXingGongs.stream().filter(t -> t.getBaGua().equals(bagua)).findFirst().get();
        // 山开始位置
        xuanKongFeiXingGong.setXiangPostion(shan);
        int shanYun = daxieArray.indexOf(xuanKongFeiXingGong.getDaYun()) + 1;
        xuanKongFeiXingGongs.get(4).setShan(shanYun);

        // 判断阴阳，按阳顺飞阴逆飞，把剩余排完
        boolean orderx = true;
        int yuanLong = shanXiang24.indexOf(shanXiang) % 3; //获得所在元龙

        // 山运开始对应的宫
        int finalShanYun = shanYun;
        XuanKongFeiXingGong shanYunFeiXingGong = (shanYun == 5) ? xuanKongFeiXingGong :
                xuanKongFeiXingGongs.stream()
                        .filter(t -> t.getIndex().equals(finalShanYun))
                        .findFirst().get();
        // 对应的八卦
        List<String> jizhi = guaMap.entrySet()
                .stream()
                .filter(kvEntry -> kvEntry.getValue().equals(shanYunFeiXingGong.getBaGua()))
                .map(Map.Entry::getKey).findFirst().get();
        String sx = jizhi.get(yuanLong);
        // 八卦对应24山阴阳
        orderx = yinYang.get(sx);

        // 添加替卦
        if (type.equals(1)) {
            shanYun = getTiGuaStart(sx, shanYun);
            xuanKongFeiXingGongs.get(4).setShan(shanYun);
        }


        if (orderx) {
            for (int i = 1; i <= 9; i++) {
                int newShanYun = (i + shanYun - 1) % 9 + 1;
                int index = (4 + i) % 9;
                xuanKongFeiXingGongs.get(index).setShan(newShanYun);
            }
        } else {
            for (int i = 9; i >= 1; i--) {
                int newShanYun = (i + shanYun - 1) % 9 + 1;
                int index = (4 - i + 9) % 9;
                xuanKongFeiXingGongs.get(index).setShan(newShanYun);
            }
        }

    }



    /**
     * 获取替挂开始值
     * @param xiangVal
     * @return
     */
    private static int getTiGuaStart(String xiangVal,Integer shanYun) {
        Map<List<String>, Integer> elementMap = new HashMap<>();
        elementMap.put(Arrays.asList("子", "癸", "甲", "申"), 1);
        elementMap.put(Arrays.asList("坤", "壬", "乙", "卯", "未"), 2);
        elementMap.put(Arrays.asList("戌", "乾", "亥", "辰", "巽", "巳"), 6);
        elementMap.put(Arrays.asList("艮", "丙", "辛", "酉", "丑"), 7);
        elementMap.put(Arrays.asList("寅", "午", "庚", "丁"), 9);
        return elementMap.entrySet().stream()
                .filter(entry -> entry.getKey().contains(xiangVal))
                .findFirst()
                .map(Map.Entry::getValue)
                .orElse(shanYun);
    }



    /**
     * 布向盘
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingXiang(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        Integer type = feiXingVo.getType();// 挨星下卦0挨星替卦1
        String shanXiang = feiXingVo.getShanXiang();
        String xiang = shanXiang.substring(2, 3);
        //判断向的值属于哪个【卦】（依据基础概念3）
        BaGua bagua = guaMap.entrySet()
                .stream()
                .filter(kvEntry -> kvEntry.getKey().contains(xiang))
                .map(Map.Entry::getValue).findFirst().get();
        //查【卦】对应的宫位的【元旦盘的值】，即为向星飞星的值，写入中间宫
        XuanKongFeiXingGong xuanKongFeiXingGong = xuanKongFeiXingGongs.stream().filter(t -> t.getBaGua().equals(bagua)).findFirst().get();
        // 向开始位置
        xuanKongFeiXingGong.setXiangPostion(xiang);
        int xiangYun = daxieArray.indexOf(xuanKongFeiXingGong.getDaYun()) + 1;
        xuanKongFeiXingGongs.get(4).setXiang(xiangYun);
        // 判断阴阳，按阳顺飞阴逆飞，把剩余排完
        boolean orderx = true;
        int yuanLong = shanXiang24.indexOf(shanXiang) % 3; //获得所在元龙

        // 山运开始对应的宫
        int finalXiangYun = xiangYun;
        XuanKongFeiXingGong xiangYunFeiXingGong = (xiangYun == 5) ? xuanKongFeiXingGong :
                xuanKongFeiXingGongs.stream()
                        .filter(t -> t.getIndex().equals(finalXiangYun))
                        .findFirst().get();


        // 对应的八卦
        List<String> jizhi = guaMap.entrySet()
                .stream()
                .filter(kvEntry -> kvEntry.getValue().equals(xiangYunFeiXingGong.getBaGua()))
                .map(Map.Entry::getKey).findFirst().get();

        String sx = jizhi.get(yuanLong);
        // 八卦对应24山阴阳
        orderx = yinYang.get(sx);

        // 添加替卦
        if (type.equals(1)) {
            xiangYun = getTiGuaStart(sx, xiangYun);
            xuanKongFeiXingGongs.get(4).setXiang(xiangYun);
        }

        if (orderx) {
            for (int i = 1; i <= 9; i++) {
                int newShanYun = (i + xiangYun - 1) % 9 + 1;
                int index = (4 + i) % 9;
                xuanKongFeiXingGongs.get(index).setXiang(newShanYun);
            }
        } else {
            for (int i = 9; i >= 1; i--) {
                int newShanYun = (i + xiangYun - 1) % 9 + 1;
                int index = (4 - i + 9) % 9;
                xuanKongFeiXingGongs.get(index).setXiang(newShanYun);
            }
        }
    }


    /**
     * 年飞星依干支年
     * 上元第一年为1（一白星入中宫）、第二年为9、第三年为8，以此类推。
     * 中元第一年为4（四绿星入中宫）、第二年为3、第三年为2，以此类推。
     * 下元第一年为7（七赤星入中宫）、第二年为6、第三年为5，以此类推。
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingYear(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        String paipanTime = feiXingVo.getPaipanTime();
        Date paipanTimeDate = DateUtils.strToDate(paipanTime, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(paipanTimeDate);// 阳历

        String lichun = sdate.getLunar().getJieQiTable().get("立春").toYmdHms();// 立春分界线
        Date liChunDate = DateUtils.strToDate(lichun, DateUtils.YYYY_MM_DD_HH_MM_SS);

        int year = sdate.getYear();
        if (paipanTimeDate.before(liChunDate)) {
            year = year - 1;
        }

        String yuanyun = calculateYuanyun(year);

        if (!yuanyun.isEmpty()) {
            String sanyuan = yuanyun.substring(0, 1);
            int jiuxingIdx = calculateJiuxingIdx(year, sanyuan);
            // 顺排序年飞星
            for (int i = 1; i <= 9; i++) {
                int newShanYun = (i + jiuxingIdx - 1) % 9 + 1;
                int index = (4 + i) % 9;
                xuanKongFeiXingGongs.get(index).setYearFlyingStar(newShanYun);
            }
        }


    }

    /**
     * 计算元运
     *
     * @param year
     * @return
     */
    private static String calculateYuanyun(int year) {
        if (1864 <= year && year <= 1883) {
            return "上元坎运";
        } else if (1884 <= year && year <= 1903) {
            return "上元坤运";
        } else if (1904 <= year && year <= 1923) {
            return "上元震运";
        } else if (1924 <= year && year <= 1943) {
            return "中元巽运";
        } else if (1944 <= year && year <= 1963) {
            return "中元中运";
        } else if (1964 <= year && year <= 1983) {
            return "中元乾运";
        } else if (1984 <= year && year <= 2003) {
            return "下元兑运";
        } else if (2004 <= year && year <= 2023) {
            return "下元艮运";
        } else if (2024 <= year && year <= 2043) {
            return "下元离运";
        } else {
            return "";
        }
    }

    /**
     * 计算开始时间
     *
     * @param year
     * @param sanyuan
     * @return
     */
    private static int calculateJiuxingIdx(int year, String sanyuan) {
        int yearOffset;
        int jiuxingIdx;

        switch (sanyuan) {
            case "上":
                yearOffset = year - 1864;
                jiuxingIdx = 1;
                break;
            case "中":
                yearOffset = year - 1924;
                jiuxingIdx = 4;
                break;
            case "下":
                yearOffset = year - 1984;
                jiuxingIdx = 7;
                break;
            default:
                return 0;
        }

        while (yearOffset > 0) {
            jiuxingIdx--;
            if (jiuxingIdx < 1) {
                jiuxingIdx += 9;
            }
            yearOffset--;
        }

        return jiuxingIdx;
    }

    /**
     * 月飞星依农历月
     * 四孟年寅申巳亥年的正月为2（二黑星入中宫）、二月为1、三月为9，以此类推。
     * 四仲年子午卯酉年的正月为8（八白星入中宫）、二月为7、三月为6，以此类推。
     * 四季年辰戌丑未年的正月为5（五黄星入中宫）、二月为4、三月为3，以此类推。
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */

    public static void calculateFeiXingYue(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        String paipanTime = feiXingVo.getPaipanTime();
        Date paipanTimeDate = DateUtils.strToDate(paipanTime, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(paipanTimeDate);// 阳历
        Lunar lunar = sdate.getLunar();

        int jiuxingIdx = calculateJiuxingIdx(lunar);

        // 顺排序月飞星
        for (int i = 1; i <= 9; i++) {
            int newShanYun = (i + jiuxingIdx - 1) % 9 + 1;
            int index = (4 + i) % 9;
            xuanKongFeiXingGongs.get(index).setMonthFlyingStar(newShanYun);
        }
    }

    /**
     * 月开始值
     *
     * @param lunar
     * @return
     */
    private static int calculateJiuxingIdx(Lunar lunar) {
        int lunarMonthIndex = getMonthByJie(lunar);
        String nianzhi = lunar.getEightChar().getYearZhi();
        int jiuxingIdx = 0;

        if ("寅申巳亥".contains(String.valueOf(nianzhi))) {
            jiuxingIdx = 2;
        } else if ("子午卯酉".contains(String.valueOf(nianzhi))) {
            jiuxingIdx = 8;
        } else if ("辰戌丑未".contains(String.valueOf(nianzhi))) {
            jiuxingIdx = 5;
        }

        jiuxingIdx -= lunarMonthIndex;
        if (jiuxingIdx < 1) {
            jiuxingIdx += 9;
        }
        return jiuxingIdx;
    }

    /**
     * 通过节气划分月份
     * @param lunar
     * @return
     */
    public  static Integer getMonthByJie(Lunar lunar) {
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
        String prevJie = lunar.getPrevJie().getName();
        List<String> nameList = jielist.stream().map(JieQi::getName).collect(Collectors.toList());
        return nameList.indexOf(prevJie);
    }

    /**
     * 日飞星依节气
     * （有争议，一说交气后起于甲子，一说交气后起于当日）此处用起于甲子
     * 冬至，雨水、谷雨后自交气日起，分别自九宫飞星的一四七开始顺排，即：
     * 冬至当日为一白、第二日为二黑、第三日为三碧，以此类推。
     * 雨水当日为七赤、第二日为八白、第三日为九紫，以此类推。
     * 谷雨当日为四碧、第二日为五黄、第三日为六白，以此类推。
     * 夏至、处暑、霜降后自交气日起，分别自九宫飞星的九三六开始逆排，即：
     * 夏至当日为九紫、第二日为八白，第三日为七赤，以此类推。
     * 处暑当日为三碧、第二日为二黑，第三日为一白，以此类推。
     * 霜降当日为六白、第二日为五黄，第三日为四绿，以此类推。
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingDay(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        // 获取排盘时间
        String paipanTime = feiXingVo.getPaipanTime();
        Date paipanTimeDate = DateUtils.strToDate(paipanTime, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(paipanTimeDate);// 阳历
        Lunar lunar = sdate.getLunar();
        EightChar eightChar = lunar.getEightChar();
        eightChar.setSect(1);
        String day = eightChar.getDay();


        Map<String, Solar> jieQiTable = lunar.getJieQiTable();

        // 获取冬至的日期和时间
        String dongzhi = jieQiTable.get("冬至").toYmdHms();
        Date dongzhiDate = DateUtils.strToDate(dongzhi, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 获取雨水的日期和时间
        String yushui = jieQiTable.get("雨水").toYmdHms();
        Date yushuiDate = DateUtils.strToDate(yushui, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 获取谷雨的日期和时间
        String guyu = jieQiTable.get("谷雨").toYmdHms();
        Date guyuDate = DateUtils.strToDate(guyu, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 获取夏至的日期和时间
        String xiazhi = jieQiTable.get("夏至").toYmdHms();
        Date xiazhiDate = DateUtils.strToDate(xiazhi, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 获取处暑的日期和时间
        String chushu = jieQiTable.get("处暑").toYmdHms();
        Date chushuDate = DateUtils.strToDate(chushu, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 获取霜降的日期和时间
        String shuangjiang = jieQiTable.get("霜降").toYmdHms();
        Date shuangjiangDate = DateUtils.strToDate(shuangjiang, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 下一年冬至的日期和时间
        String nextdongzhi = jieQiTable.get("DONG_ZHI").toYmdHms();
        Date nextdongzhiDate = DateUtils.strToDate(nextdongzhi, DateUtils.YYYY_MM_DD_HH_MM_SS);

        int dayIdx =  calculateDaysJiaZhiDifference(day);
        int offset = 0;
        boolean shunxing = false;

        if (paipanTimeDate.after(dongzhiDate) && paipanTimeDate.before(yushuiDate)) {// 冬至 雨水
            offset = 1;
            shunxing = true;
        } else if (paipanTimeDate.after(yushuiDate) && paipanTimeDate.before(guyuDate)) {// 雨水 谷雨
            offset = 7;
            shunxing = true;
        } else if (paipanTimeDate.after(guyuDate) && paipanTimeDate.before(xiazhiDate)) {// 谷雨 夏至
            offset = 4;
            shunxing = true;
        } else if (paipanTimeDate.after(xiazhiDate) && paipanTimeDate.before(chushuDate)) {// 夏至 处暑
            offset = 9;
            shunxing = false;
        } else if (paipanTimeDate.after(chushuDate) && paipanTimeDate.before(shuangjiangDate)) {// 处暑 霜降
            offset = 3;
            shunxing = false;
        } else if (paipanTimeDate.after(shuangjiangDate) && paipanTimeDate.before(nextdongzhiDate)) {// 霜降 冬至
            offset = 6;
            shunxing = false;
        } else if (paipanTimeDate.after(nextdongzhiDate)) {//  冬至后
            offset = 1;
            shunxing = true;
        }

        int jiuxingIdx = 0;
        if (shunxing) {
            jiuxingIdx = offset + dayIdx;
            while (jiuxingIdx > 9) {
                jiuxingIdx -= 9;
            }
        } else {
            jiuxingIdx = offset - dayIdx;
            while (jiuxingIdx < 1) {
                jiuxingIdx += 9;
            }
        }

        //冬至后顺夏至后逆
        if (shunxing) {
            for (int i = 1; i <= 9; i++) {
                int newShanYun = (i + jiuxingIdx - 1) % 9 + 1;
                int index = (4 + i) % 9;
                xuanKongFeiXingGongs.get(index).setDayFlyingStar(newShanYun);
            }
        } else {
            for (int i = 9; i >= 1; i--) {
                int newShanYun = (i + jiuxingIdx - 1) % 9 + 1;
                int index = (4 - i + 9) % 9;
                xuanKongFeiXingGongs.get(index).setDayFlyingStar(newShanYun);
            }
        }
    }

    /**
     * 计算和甲子相差
     * @param day
     * @return
     */
    public static int calculateDaysJiaZhiDifference(String day) {
        int index1 = JIA_ZHI_DAY.indexOf("甲子");
        int index2 = JIA_ZHI_DAY.indexOf(day);

        if (index1 != -1 && index2 != -1) {
            int difference = Math.abs(index2 - index1);
            return difference;
        } else {
            return -1; // 无效的甲子日
        }
    }

    /**
     * 时飞星依干支日和节气
     * 冬至后：
     * 寅申巳亥日，甲子时七赤，乙丑时八白，丙寅时九紫，以此类推。
     * 子午卯酉日，甲子时一白，乙丑时二黑，丙寅时三碧，以此类推。
     * 辰戌丑未日，甲子时四绿，乙丑时五黄，丙寅时六白，以此类推。
     * 夏至后：
     * 寅申巳亥日，甲子时起三碧，乙丑时二黑，丙寅时一白，以此类推。
     * 子午卯酉日，甲子时起九紫，乙丑时八白，丙寅时七赤，以此类推。
     * 辰戌丑未日，甲子时起六白，乙丑时五黄，丙寅时四绿，以此类推。
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingHour(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {
        // 获取排盘时间
        String paipanTime = feiXingVo.getPaipanTime();
        Date paipanTimeDate = DateUtils.strToDate(paipanTime, DateUtils.YYYY_MM_DD_HH_MM);
        Solar sdate = Solar.fromDate(paipanTimeDate);// 阳历
        Lunar lunar = sdate.getLunar();
        EightChar eightChar = lunar.getEightChar();
        eightChar.setSect(1);
        String dayZhi = eightChar.getDayZhi();
        String timeZhi = eightChar.getTimeZhi();


        List<String> rizhiList = Arrays.asList("寅", "申", "巳", "亥");
        List<String> ziwuList = Arrays.asList("子", "午", "卯", "酉");
        List<String> chenxuList = Arrays.asList("辰", "戌", "丑", "未");

        Map<String, Solar> jieQiTable = sdate.getLunar().getJieQiTable();

        // 获取冬至的日期和时间
        String dongzhi = jieQiTable.get("冬至").toYmdHms();
        Date dongzhiDate = DateUtils.strToDate(dongzhi, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 获取夏至的日期和时间
        String xiazhi = jieQiTable.get("夏至").toYmdHms();
        Date xiazhiDate = DateUtils.strToDate(xiazhi, DateUtils.YYYY_MM_DD_HH_MM_SS);

        // 下一年冬至的日期和时间
        String nextdongzhi = jieQiTable.get("DONG_ZHI").toYmdHms();
        Date nextdongzhiDate = DateUtils.strToDate(nextdongzhi, DateUtils.YYYY_MM_DD_HH_MM_SS);

        boolean shunxing = true;
        int offset = 0;
        if (paipanTimeDate.after(dongzhiDate) && paipanTimeDate.before(xiazhiDate)) {// 冬至 夏至
            shunxing = true;
            if (rizhiList.contains(dayZhi)) {
                offset = 7;
            } else if (ziwuList.contains(dayZhi)) {
                offset = 1;
            } else if (chenxuList.contains(dayZhi)) {
                offset = 4;
            }

        } else if (paipanTimeDate.after(xiazhiDate) && paipanTimeDate.before(nextdongzhiDate)) {// 夏至 冬至
            shunxing = false;
            if (rizhiList.contains(dayZhi)) {
                offset = 3;
            } else if (ziwuList.contains(dayZhi)) {
                offset = 9;
            } else if (chenxuList.contains(dayZhi)) {
                offset = 6;
            }
        }

        int hourIdx = ZHI.indexOf(timeZhi);

        int jiuxingIdx;
        if (shunxing) {
            jiuxingIdx = offset + hourIdx;
            while (jiuxingIdx > 9) {
                jiuxingIdx -= 9;
            }
        } else {
            jiuxingIdx = offset - hourIdx;
            while (jiuxingIdx < 1) {
                jiuxingIdx += 9;
            }
        }

        //冬至后顺夏至后逆
        if (shunxing) {
            for (int i = 1; i <= 9; i++) {
                int newShanYun = (i + jiuxingIdx - 1) % 9 + 1;
                int index = (4 + i) % 9;
                xuanKongFeiXingGongs.get(index).setHourFlyingStar(newShanYun);
            }
        } else {
            for (int i = 9; i >= 1; i--) {
                int newShanYun = (i + jiuxingIdx - 1) % 9 + 1;
                int index = (4 - i + 9) % 9;
                xuanKongFeiXingGongs.get(index).setHourFlyingStar(newShanYun);
            }
        }


    }

    /**
     * 解释
     *
     * @param feiXingVo
     * @param xuanKongFeiXingGongs
     */
    public static void calculateFeiXingExplain(FeiXingVo feiXingVo, List<XuanKongFeiXingGong> xuanKongFeiXingGongs) {

        for (XuanKongFeiXingGong xkfx : xuanKongFeiXingGongs) {

            xkfx.setShanAndXiangExplain(dataMap.get(xkfx.getShan() + "+" + xkfx.getXiang()));
            xkfx.setDaYunExplain(elementMap.get(daxieArray.indexOf(xkfx.getDaYun()) + 1));
            xkfx.setShanExplain(elementMap.get(xkfx.getShan()));
            xkfx.setXiangExplain(elementMap.get(xkfx.getXiang()));
            xkfx.setYearFlyingStarExplain(elementMap.get(xkfx.getYearFlyingStar()));

        }
    }

    /**
     * 计算方向
     * @param feiXingVo
     * @return
     */
    public static List<String> calculateFeiXingDirection(FeiXingVo feiXingVo) {
        return mountainMap.get( feiXingVo.getShanXiang());
    }
}
