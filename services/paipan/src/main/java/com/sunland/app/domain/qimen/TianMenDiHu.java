package com.sunland.app.domain.qimen;

import com.sunland.app.utils.qimen.QimenPanUtil;
import lombok.Data;

import java.io.Serializable;
import java.util.*;

/**
 * @author: xk
 * @create: 2023-09-26 10:15
 **/
@Data
public class TianMenDiHu implements Serializable {
    private static final long serialVersionUID = 1L;



    /**
     * 地支
     */
    public String diZhi;

    /**
     * 天门
     */
    public String tianMen;

    /**
     * 地户
     */
    public String diHu;

    public TianMenDiHu(String diZhi) {
        this.diZhi = diZhi;
    }

    public static List<TianMenDiHu> initTianMenDiHu() {
        List<TianMenDiHu> TianMenDiHuList = new ArrayList<>(12);
        for (String diZhi: QimenPanUtil.ZHI) {
            TianMenDiHuList.add(new TianMenDiHu(diZhi));
        }
        return TianMenDiHuList;
    }

}
