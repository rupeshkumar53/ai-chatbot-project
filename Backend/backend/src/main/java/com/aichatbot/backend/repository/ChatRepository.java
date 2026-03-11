package com.aichatbot.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aichatbot.backend.model.Chat;

public interface ChatRepository extends JpaRepository<Chat,Long>{

	 List<Chat> findByEmail(String email);
	    List<Chat> findByConversationId(Long conversationId); // ✅ add karo
	    void deleteByConversationId(Long conversationId);
}