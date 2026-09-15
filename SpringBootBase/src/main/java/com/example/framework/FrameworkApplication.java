package com.example.framework;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example")
@MapperScan({"com.example.framework.mapper", "com.example.linguaverse.mapper"})
public class FrameworkApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrameworkApplication.class, args);
    }
}
