package com.example.framework.dto;

import com.example.framework.entity.User;
import lombok.Data;

/**
 * 登录成功返回结果
 */
@Data
public class LoginResultVO {

    private String token;

    private Long id;

    private String username;

    private String nickname;

    private String avatar;

    private String role;

    public static LoginResultVO of(User user, String token) {
        LoginResultVO vo = new LoginResultVO();
        vo.setToken(token);
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setAvatar(user.getAvatar());
        vo.setRole(user.getRole());
        return vo;
    }
}
