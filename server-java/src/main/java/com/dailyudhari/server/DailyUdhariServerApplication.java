package com.dailyudhari.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
@EnableAsync
public class DailyUdhariServerApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(DailyUdhariServerApplication.class, args);
	}

	private static void loadEnv() {
		File[] candidates = new File[] {
			new File(".env"),
			new File("server-java/.env"),
			new File("../.env")
		};
		for (File file : candidates) {
			if (file.exists() && file.isFile()) {
				try {
					List<String> lines = Files.readAllLines(file.toPath());
					for (String line : lines) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) continue;
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String value = line.substring(eqIdx + 1).trim();
							if ((value.startsWith("\"") && value.endsWith("\"")) ||
							    (value.startsWith("'") && value.endsWith("'"))) {
								value = value.substring(1, value.length() - 1);
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
					System.out.println("[DailyUdhari] Successfully loaded environment from: " + file.getPath());
					break;
				} catch (Exception e) {
					System.err.println("[DailyUdhari] Warning: Failed to parse .env file: " + e.getMessage());
				}
			}
		}
	}
}
