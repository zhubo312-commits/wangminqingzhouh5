package cn.bavor.guoxue.paipan.engine;

import com.alibaba.fastjson.JSONObject;
import com.sunland.app.domain.param.BaZiBody;
import com.sunland.app.domain.qimen.QiMenZao;
import com.sunland.app.utils.qimen.QimenPan;
import org.springframework.stereotype.Component;

@Component
public class DunjiaEngine {
    /**
     * The frozen legacy implementation stores three intermediate palaces in static fields.
     * Serializing calls keeps each calculation isolated without changing its algorithm.
     */
    public synchronized JSONObject chart(String chartDateTime) {
        BaZiBody input = new BaZiBody();
        input.setBirthDay(chartDateTime);
        input.setQuestion("");
        input.setIsKe("4");
        return QimenPan.getQimenPan(QiMenZao.getXingHeQimenH5(input));
    }
}
