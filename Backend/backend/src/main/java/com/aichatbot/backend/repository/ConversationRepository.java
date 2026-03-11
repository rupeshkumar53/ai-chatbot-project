package com.aichatbot.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aichatbot.backend.model.Conversation;

public interface ConversationRepository 
extends JpaRepository<Conversation,Long>{

    List<Conversation> findByEmail(String email);

}