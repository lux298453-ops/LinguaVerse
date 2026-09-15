package com.example.framework.dto;

import lombok.Data;

/**
 * 个人资料更新请求
 */
@Data
public class UpdateProfileDTO {

    private String nickname;

    private String avatar;
}