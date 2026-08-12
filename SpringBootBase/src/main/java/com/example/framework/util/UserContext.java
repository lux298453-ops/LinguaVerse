package com.example.framework.util;

import com.example.framework.entity.User;

/**
 * 当前登录用户上下文（ThreadLocal）
 */
public class UserContext {

    private static final ThreadLocal<User> HOLDER = new ThreadLocal<>();

    public static void set(User user) {
        HOLDER.set(user);
    }

    public static User get() {
        return HOLDER.get();
    }

    public static Long getUserId() {
        User user = HOLDER.get();
        return user != null ? user.getId() : null;
    }

    public static String getRole() {
        User user = HOLDER.get();
        return user != null ? user.getRole() : null;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
