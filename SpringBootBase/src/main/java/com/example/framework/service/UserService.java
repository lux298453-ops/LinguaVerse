package com.example.framework.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.framework.dto.LoginResultVO;
import com.example.framework.dto.RegisterDTO;
import com.example.framework.entity.User;

import java.util.Collection;
import java.util.List;

/**
 * 用户服务
 */
public interface UserService {

    /**
     * 注册（默认普通用户角色）
     */
    User register(RegisterDTO dto);

    /**
     * 登录，成功返回 token 及用户信息
     */
    LoginResultVO login(String username, String password);

    /**
     * 分页查询用户（管理员）
     */
    IPage<User> pageUsers(long pageNum, long pageSize, String keyword);

    /**
     * 修改用户角色（管理员）
     */
    void updateRole(Long userId, String role);

    /**
     * 启用/禁用用户（管理员）
     */
    void updateStatus(Long userId, Integer status);

    User getById(Long id);

    List<User> listByIds(Collection<Long> ids);

    /**
     * 更新当前用户资料（昵称、头像）
     */
    User updateProfile(Long userId, String nickname, String avatar);

    /**
     * 全部启用用户
     */
    List<User> listAll();
}
