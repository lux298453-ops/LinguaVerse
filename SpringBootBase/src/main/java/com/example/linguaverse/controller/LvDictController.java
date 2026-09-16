package com.example.linguaverse.controller;

import com.example.framework.annotation.Public;
import com.example.framework.common.Result;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/linguaverse/dict")
@RequiredArgsConstructor
public class LvDictController {

    private final ObjectMapper objectMapper;
    private static final Map<String, Map<String, Object>> CACHE = new ConcurrentHashMap<>();
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();
    private static final Pattern POS_PATTERN = Pattern.compile("^([a-z\\.\\/]+)\\s+(.+)$", Pattern.CASE_INSENSITIVE);

    @Public
    @GetMapping("/lookup")
    public Result<Map<String, Object>> lookupWord(@RequestParam("word") String word) {
        if (word == null || word.isBlank()) {
            return Result.error(400, "Word cannot be empty");
        }
        String clean = word.toLowerCase().trim();
        if (CACHE.containsKey(clean)) {
            return Result.success(CACHE.get(clean));
        }

        try {
            String url = "https://dict.youdao.com/suggest?num=1&ver=3.0&doctype=json&cache=false&le=en&q="
                    + URLEncoder.encode(clean, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode entries = root.path("data").path("entries");
                if (entries.isArray() && !entries.isEmpty()) {
                    JsonNode first = entries.get(0);
                    String explain = first.path("explain").asText("");
                    if (!explain.isBlank()) {
                        String pos = "word";
                        String trans = explain;
                        Matcher matcher = POS_PATTERN.matcher(explain);
                        if (matcher.find()) {
                            pos = matcher.group(1);
                            trans = matcher.group(2);
                        }
                        Map<String, Object> entry = Map.of(
                                "word", clean,
                                "pos", pos,
                                "trans", trans,
                                "phonetic_us", "/" + clean + "/",
                                "phonetic_uk", "/" + clean + "/",
                                "example", "The word \"" + clean + "\" is widely used in English.",
                                "example_cn", "单词 \"" + clean + "\" 在日常英语交流中非常常用。",
                                "tags", List.of("在线查词", "通用词汇")
                        );
                        CACHE.put(clean, entry);
                        return Result.success(entry);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("在线查词失败 word={}: {}", clean, e.getMessage());
        }

        return Result.error(404, "Word not found");
    }
}
