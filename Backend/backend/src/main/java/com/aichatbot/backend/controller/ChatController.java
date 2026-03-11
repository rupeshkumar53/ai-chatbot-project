package com.aichatbot.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aichatbot.backend.model.Chat;
import com.aichatbot.backend.repository.ChatRepository;
import com.aichatbot.backend.service.ChatService;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ChatRepository chatRepository;

    @PostMapping
    public String chat(@RequestBody Chat chat) throws Exception {
        String response = chatService.processChat(chat.getMessage());
        
        // ✅ save karo DB mein
        chat.setResponse(response);
        chatRepository.save(chat);  // email aur conversationId bhi save hoga
        
        return response;
    }

    @GetMapping("/{email}")
    public List<Chat> getChats(@PathVariable String email) {
        return chatRepository.findByEmail(email);
    }
}