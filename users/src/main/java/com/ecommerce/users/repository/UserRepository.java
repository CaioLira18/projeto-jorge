package com.ecommerce.users.repository;

import com.ecommerce.users.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    @Value("${data.file}")
    private String dataFile;

    private final ObjectMapper mapper = new ObjectMapper();

    private File getFile() {
        File f = new File(dataFile);
        f.getParentFile().mkdirs();
        return f;
    }

    public List<User> findAll() {
        File f = getFile();
        if (!f.exists()) return new ArrayList<>();
        try {
            return mapper.readValue(f, new TypeReference<List<User>>() {});
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    public Optional<User> findById(String id) {
        return findAll().stream().filter(u -> u.getId().equals(id)).findFirst();
    }

    public Optional<User> findByEmail(String email) {
        return findAll().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst();
    }

    public User save(User user) {
        List<User> users = findAll();
        users.removeIf(u -> u.getId().equals(user.getId()));
        users.add(user);
        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(getFile(), users);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar usuário", e);
        }
        return user;
    }

    public boolean existsByEmail(String email) {
        return findAll().stream().anyMatch(u -> u.getEmail().equalsIgnoreCase(email));
    }
}
