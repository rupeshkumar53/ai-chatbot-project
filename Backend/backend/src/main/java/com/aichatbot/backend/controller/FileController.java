package com.aichatbot.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.aichatbot.backend.service.ChatService;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/file")
public class FileController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/upload")
    public String upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "message", required = false) String message
    ) {
        try {
            return chatService.processChatWithFile(message, file);
        } catch (Exception e) {
            return "Error processing file: " + e.getMessage();
        }
    }
}