package com.sunland.app.domain;

import java.io.Serializable;

/**
 * @author: xk
 * @create: 2023-06-27 09:57
 **/
public class TitleContent implements Serializable {




    /**
     * 标题
     */
    private String title;

    /**
     * 内容
     */
    private String content;


    /**
     * 描述
     */
    private String description;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TitleContent(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public TitleContent(String title, String content, String description) {
        this.title = title;
        this.content = content;
        this.description = description;
    }

    @Override
    public String toString() {
        return "TitleContent{" +
                "title='" + title + '\'' +
                ", content='" + content + '\'' +
                '}';
    }
}
