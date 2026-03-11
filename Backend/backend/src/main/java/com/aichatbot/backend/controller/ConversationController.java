package com.aichatbot.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.aichatbot.backend.model.Chat;
import com.aichatbot.backend.model.Conversation;
import com.aichatbot.backend.repository.ChatRepository;
import com.aichatbot.backend.repository.ConversationRepository;

@RestController
@RequestMapping("/conversation")
@CrossOrigin(origins = "http://localhost:3000")
public class ConversationController {

    @Autowired
    private ConversationRepository conversationRepository;
    @Autowired
    private ChatRepository  chatRepository;
    @PostMapping
    public Conversation createConversation(@RequestBody Conversation c) {
        return conversationRepository.save(c);
    }

    @GetMapping("/{email}")
    public List<Conversation> getConversations(@PathVariable String email) {
        return conversationRepository.findByEmail(email);
    }
    @GetMapping("/{id}/chats")
    public List<Chat> getChatsByConversation(@PathVariable Long id) {
        return chatRepository.findByConversationId(id);
    }
    @DeleteMapping("/{id}")
    public String deleteConversation(@PathVariable Long id){
        conversationRepository.deleteById(id);
        // optionally, delete all chats for this conversation
        chatRepository.deleteByConversationId(id);
        return "Conversation deleted";
    }
}