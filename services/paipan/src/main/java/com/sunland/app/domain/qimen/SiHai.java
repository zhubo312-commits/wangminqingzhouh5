package com.sunland.app.domain.qimen;

import java.io.Serializable;

/**
 * @author: xk
 * @create: 2023-09-26 17:21
 **/
public class SiHai implements Serializable {

    /**
     * 字
     */
    public String word;

    /**
     * 四害
     */
    public String siHai;

    public SiHai(String word, String siHai) {
        this.word = word;
        this.siHai = siHai;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getSiHai() {
        return siHai;
    }

    public void setSiHai(String siHai) {
        this.siHai = siHai;
    }
}
