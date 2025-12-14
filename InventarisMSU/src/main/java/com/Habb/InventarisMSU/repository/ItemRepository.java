package com.Habb.InventarisMSU.repository;

import com.Habb.InventarisMSU.model.Item;
import com.Habb.InventarisMSU.model.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByTypeOrderByIdDesc(ItemType type);

    List<Item> findByType(ItemType type);

    List<Item> findTop4ByType(ItemType type);

    Item findByName(String name);
}
