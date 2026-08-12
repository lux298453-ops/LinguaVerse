package com.example.framework.annotation;

import com.example.framework.enums.RoleEnum;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 接口权限注解，标注在 Controller 方法上
 * 示例: @RequireRole(RoleEnum.ADMIN)
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {

    /**
     * 允许访问的角色，默认仅管理员
     */
    RoleEnum[] value() default {RoleEnum.ADMIN};
}
