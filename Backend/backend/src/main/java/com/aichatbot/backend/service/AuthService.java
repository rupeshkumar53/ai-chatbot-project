package com.aichatbot.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.aichatbot.backend.model.User;
import com.aichatbot.backend.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public User signup(User user) {
        return userRepository.save(user);
    }

    public User login(User user) {
        User u = userRepository.findByEmail(user.getEmail());
        if (u != null && u.getPassword().equals(user.getPassword())) {
            return u;
        }
        return null;
    }
}