package com.example.framework.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.framework.annotation.RequireRole;
import com.example.framework.common.Result;
import com.example.framework.entity.User;
import com.example.framework.enums.RoleEnum;
import com.example.framework.service.UserService;
import com.example.framework.util.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户接口
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 获取当前登录用户信息（登录后即可访问）
     */
    @GetMapping("/me")
    public Result<Map<String, Object>> me() {
        User user = UserContext.get();
        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("nickname", user.getNickname());
        data.put("role", user.getRole());
        return Result.success(data);
    }

    /**
     * 分页查询用户列表（仅管理员）
     */
    @RequireRole(RoleEnum.ADMIN)
    @GetMapping("/list")
    public Result<IPage<User>> list(@RequestParam(defaultValue = "1") long pageNum,
                                    @RequestParam(defaultValue = "10") long pageSize,
                                    @RequestParam(required = false) String keyword) {
        IPage<User> page = userService.pageUsers(pageNum, pageSize, keyword);
        page.getRecords().forEach(u -> u.setPassword(null));
        return Result.success(page);
    }

    /**
     * 修改用户角色（仅管理员）
     */
    @RequireRole(RoleEnum.ADMIN)
    @PutMapping("/{id}/role")
    public Result<Void> updateRole(@PathVariable Long id, @RequestParam String role) {
        userService.updateRole(id, role);
        return Result.success();
    }

    /**
     * 启用/禁用用户（仅管理员）
     */
    @RequireRole(RoleEnum.ADMIN)
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        userService.updateStatus(id, status);
        return Result.success();
    }
}
