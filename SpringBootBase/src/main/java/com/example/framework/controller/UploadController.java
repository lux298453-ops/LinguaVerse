package com.example.framework.controller;

import com.example.framework.common.Result;
import com.example.framework.common.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 文件上传接口
 */
@Slf4j
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final String UPLOAD_DIR = "uploads/avatars";

    @PostMapping("/image")
    public Result<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "上传图片不能为空");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        if (!ext.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            throw new BusinessException(400, "仅支持 jpg、jpeg、png、gif、webp 格式图片");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BusinessException(400, "图片大小不能超过 5MB");
        }

        String newFilename = UUID.randomUUID().toString().replace("-", "") + ext;
        try {
            Path targetDir = Paths.get(UPLOAD_DIR).toAbsolutePath();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            Path targetFile = targetDir.resolve(newFilename);
            file.transferTo(targetFile.toFile());

            String relativeUrl = "/uploads/avatars/" + newFilename;
            Map<String, Object> data = new HashMap<>();
            data.put("url", relativeUrl);
            data.put("filename", newFilename);
            return Result.success(data);
        } catch (IOException e) {
            log.error("保存上传文件失败", e);
            throw new BusinessException(500, "保存图片失败: " + e.getMessage());
        }
    }
}