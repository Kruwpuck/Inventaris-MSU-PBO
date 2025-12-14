package com.Habb.InventarisMSU.repository;

import com.Habb.InventarisMSU.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import com.Habb.InventarisMSU.model.ItemType;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByType(ItemType type);

    List<Item> findTop4ByType(ItemType type);

    Item findByName(String name);
}
