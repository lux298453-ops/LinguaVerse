package com.example.framework.controller;

import com.example.framework.annotation.Public;
import com.example.framework.common.Result;
import com.example.framework.dto.LoginDTO;
import com.example.framework.dto.LoginResultVO;
import com.example.framework.dto.RegisterDTO;
import com.example.framework.entity.User;
import com.example.framework.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口（注册 / 登录）
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Public
    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterDTO dto) {
        userService.register(dto);
        return Result.success();
    }

    @Public
    @PostMapping("/login")
    public Result<LoginResultVO> login(@Valid @RequestBody LoginDTO dto) {
        return Result.success(userService.login(dto.getUsername(), dto.getPassword()));
    }
}
