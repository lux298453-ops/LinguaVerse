package com.example.framework.interceptor;

import com.example.framework.annotation.Public;
import com.example.framework.annotation.RequireRole;
import com.example.framework.common.BusinessException;
import com.example.framework.common.ResultCode;
import com.example.framework.enums.RoleEnum;
import com.example.framework.entity.User;
import com.example.framework.service.UserService;
import com.example.framework.util.JwtUtil;
import com.example.framework.util.UserContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

/**
 * 登录认证 + 角色权限校验拦截器
 * 规则：
 * 1. 标注 @Public 的接口无需登录
 * 2. 其余 /api/** 接口默认需要登录
 * 3. 标注 @RequireRole 的接口需要指定角色（默认仅 ADMIN）
 */
@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {

    /** 所有角色均可访问 */
    private static final RoleEnum[] ALL_ROLES = {RoleEnum.ADMIN, RoleEnum.USER};

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Value("${jwt.header}")
    private String header;

    @Value("${jwt.prefix}")
    private String prefix;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }
        if (handlerMethod.getMethodAnnotation(Public.class) != null) {
            return true;
        }

        // 校验登录
        String token = resolveToken(request);
        if (!StringUtils.hasText(token)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        Claims claims = jwtUtil.parseToken(token);
        User user = userService.getById(Long.valueOf(claims.getSubject()));
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        UserContext.set(user);

        // 校验角色
        RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
        RoleEnum[] allowedRoles = requireRole != null ? requireRole.value() : ALL_ROLES;
        boolean allowed = Arrays.stream(allowedRoles)
                .anyMatch(role -> role.name().equals(user.getRole()));
        if (!allowed) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }

    private String resolveToken(HttpServletRequest request) {
        String token = request.getHeader(header);
        if (StringUtils.hasText(token) && StringUtils.hasText(prefix) && token.startsWith(prefix)) {
            return token.substring(prefix.length());
        }
        return token;
    }
}
