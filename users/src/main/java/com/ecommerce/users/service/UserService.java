package com.ecommerce.users.service;

import com.ecommerce.users.model.User;
import com.ecommerce.users.repository.UserRepository;
import com.ecommerce.users.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User register(String name, String email, String password, String role) {
        if (repository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email já cadastrado");
        }
        String hashed = passwordEncoder.encode(password);
        User user = new User(
                UUID.randomUUID().toString(),
                name,
                email,
                hashed,
                role != null ? role : "user",
                System.currentTimeMillis()
        );
        return repository.save(user);
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> optUser = repository.findByEmail(email);
        if (optUser.isEmpty()) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }
        User user = optUser.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        return response;
    }

    public Optional<User> findById(String id) {
        return repository.findById(id);
    }

    public boolean validateToken(String token) {
        try {
            jwtService.validateToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
