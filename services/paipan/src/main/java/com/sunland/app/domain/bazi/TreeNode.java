package com.sunland.app.domain.bazi;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.List;

/**
 * @author: xk
 * @create: 2023-07-12 11:25
 **/
@Getter
@Setter
public class TreeNode implements Serializable {
    private String text;
    private String value;
    private List<TreeNode> children;

    public TreeNode(String text, String value, List<TreeNode> children) {
        this.text = text;
        this.value = value;
        this.children = children;
    }

    public TreeNode(String text, String value) {
        this.text = text;
        this.value = value;
    }
}
