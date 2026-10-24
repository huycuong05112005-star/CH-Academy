package vn.chacademy.identity.dto;

public class LoginResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private UserDto user;

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, UserDto user) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }
}
