package com.example.linguaverse.dto;

import lombok.Data;

@Data
public class PlayerState {
    private Long userId;
    private String nickname;
    private String skin;
    private int x;
    private int y;
    private String direction;
    private String mapId;
}
