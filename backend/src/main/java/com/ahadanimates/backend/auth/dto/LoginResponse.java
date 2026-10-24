package com.ahadanimates.backend.auth.dto;

public class LoginResponse {

    private String message;
    private AuthUserDto user;
    private String token;

    public LoginResponse() {
    }

    public LoginResponse(String message, AuthUserDto user, String token) {
        this.message = message;
        this.user = user;
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public AuthUserDto getUser() {
        return user;
    }

    public void setUser(AuthUserDto user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
