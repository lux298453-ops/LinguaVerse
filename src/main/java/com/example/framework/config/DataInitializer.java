package com.example.framework.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.framework.entity.User;
import com.example.framework.enums.RoleEnum;
import com.example.framework.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 启动时自动创建默认管理员账号（配置见 app.default-admin）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.username}")
    private String adminUsername;

    @Value("${app.default-admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, adminUsername));
        if (count == 0) {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setNickname("管理员");
            admin.setRole(RoleEnum.ADMIN.name());
            admin.setStatus(1);
            userMapper.insert(admin);
            log.info("已创建默认管理员账号: {} / {}", adminUsername, adminPassword);
        }
    }
}
