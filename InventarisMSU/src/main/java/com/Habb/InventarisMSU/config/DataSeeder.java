package com.Habb.InventarisMSU.config;

import com.Habb.InventarisMSU.model.Item;
import com.Habb.InventarisMSU.model.ItemType;
import com.Habb.InventarisMSU.model.Role;
import com.Habb.InventarisMSU.model.User;
import com.Habb.InventarisMSU.repository.ItemRepository;
import com.Habb.InventarisMSU.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedItems();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            User pengelola = new User();
            pengelola.setUsername("pengelola");
            pengelola.setPassword("password"); // In prod, use BCrypt
            pengelola.setRole(Role.PENGELOLA);
            userRepository.save(pengelola);

            User pengurus = new User();
            pengurus.setUsername("pengurus");
            pengurus.setPassword("password");
            pengurus.setRole(Role.PENGURUS);
            userRepository.save(pengurus);
        }
    }

    private void seedItems() {
        if (itemRepository.count() == 0) {
            createItem("Proyektor", ItemType.BARANG, 7, "proyektor.jpeg", "Proyektor berkualitas tinggi");
            createItem("Sound System", ItemType.BARANG, 5, "sound.jpeg", "Sound system lengkap");
            createItem("Terpal", ItemType.BARANG, 12, "terpal.jpeg", "Terpal ukuran besar");
            createItem("Karpet", ItemType.BARANG, 8, "karpet.jpeg", "Karpet masjid");
            createItem("Kursi Lipat", ItemType.BARANG, 20, "kursi.jpeg", "Kursi lipat besi");
            createItem("Meja Lipat", ItemType.BARANG, 10, "meja.jpeg", "Meja lipat portable");
            createItem("Mic Wireless", ItemType.BARANG, 6, "mic.jpeg", "Microphone wireless");
            createItem("Kabel Roll", ItemType.BARANG, 9, "kabel.jpeg", "Kabel roll panjang");
            createItem("Tikar", ItemType.BARANG, 15, "tikar.jpeg", "Tikar plastik");
            createItem("Speaker Portable", ItemType.BARANG, 4, "speaker.jpeg", "Speaker portable dengan baterai");
        }
    }

    private void createItem(String name, ItemType type, int stock, String imageUrl, String description) {
        Item item = new Item();
        item.setName(name);
        item.setType(type);
        item.setStock(stock);
        item.setImageUrl(imageUrl);
        item.setDescription(description);
        item.setStatus("Tersedia");
        itemRepository.save(item);
    }
}
