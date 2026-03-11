package com.aichatbot.backend.service;

import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import reactor.core.publisher.Mono;

@Service
public class ChatService {

    @Value("${gemini.api.key}")
    private String GEMINI_API_KEY;

    @Value("${gemini.api.url}")
    private String GEMINI_API_URL;

    private WebClient webClient;
    private final WebClient.Builder webClientBuilder;

    public ChatService(WebClient.Builder builder) {
        this.webClientBuilder = builder;
    }

    @PostConstruct
    public void init() {
        this.webClient = webClientBuilder
                .baseUrl(GEMINI_API_URL)
                .build();
    }

    // ─── Text only ───────────────────────────────────────────────
    public String processChat(String message) throws Exception {
        String body = "{ \"contents\": [ { \"parts\": [ { \"text\": \"" + message + "\" } ] } ] }";
        return callGemini(body);
    }

    // ─── File + optional text ─────────────────────────────────────
    public String processChatWithFile(String message, MultipartFile file) throws Exception {
        String base64Data = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType();

        String textPart = (message != null && !message.isEmpty())
                ? "{ \"text\": \"" + message + "\" },"
                : "";

        String body = "{"
                + "\"contents\": [{"
                + "  \"parts\": ["
                +      textPart
                + "    {"
                + "      \"inline_data\": {"
                + "        \"mime_type\": \"" + mimeType + "\","
                + "        \"data\": \"" + base64Data + "\""
                + "      }"
                + "    }"
                + "  ]"
                + "}]"
                + "}";

        return callGemini(body);
    }

    // ─── Shared Gemini call ───────────────────────────────────────
    private String callGemini(String body) throws Exception {
        String response = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("key", GEMINI_API_KEY)
                        .build())
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(), clientResponse ->
                    clientResponse.bodyToMono(String.class)
                        .doOnNext(err -> System.out.println("Gemini Error: " + err))
                        .then(Mono.error(new RuntimeException("Gemini API 4xx error")))
                )
                .onStatus(status -> status.is5xxServerError(), clientResponse ->
                    clientResponse.bodyToMono(String.class)
                        .doOnNext(err -> System.out.println("Gemini Server Error: " + err))
                        .then(Mono.error(new RuntimeException("Gemini API 5xx error")))
                )
                .bodyToMono(String.class)
                .block();

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(response);

        return root
                .path("candidates")
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text")
                .asText();
    }
}