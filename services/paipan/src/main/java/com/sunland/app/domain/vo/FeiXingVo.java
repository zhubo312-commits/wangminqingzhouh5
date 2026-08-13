package com.sunland.app.domain.vo;

import lombok.Data;

import java.io.Serializable;

@Data
public class FeiXingVo implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userName;
    private Integer daYun;
    private String shanXiang;
    private String paipanTime;
    private Integer type;
    private String remark;
    private String yearNongLi;
}
