package com.example.brickatime.config;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;

@Configuration
public class EnvAutoBackupConfig {
    private static final String ENV_PATH = "src/main/resources/.env";
    private static final String BACKUP_PATH = "src/main/resources/.env.backup";

    @PostConstruct
    public void setupBackup() throws IOException {
        File envFile = new File(ENV_PATH);
        File backupFile = new File(BACKUP_PATH);

        // Create initial backup if missing
        if (envFile.exists() && !backupFile.exists()) {
            Files.copy(envFile.toPath(), backupFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }

        // If .env missing, restore automatically
        if (!envFile.exists() && backupFile.exists()) {
            Files.copy(backupFile.toPath(), envFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }

    // Restore .env on-demand
    public static void restoreEnv() throws IOException {
        Files.copy(Path.of(BACKUP_PATH), Path.of(ENV_PATH), StandardCopyOption.REPLACE_EXISTING);
    }
}