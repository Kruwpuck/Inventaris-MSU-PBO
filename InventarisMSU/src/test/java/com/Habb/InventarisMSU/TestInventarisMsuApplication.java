package com.Habb.InventarisMSU;

import org.springframework.boot.SpringApplication;

public class TestInventarisMsuApplication {

	public static void main(String[] args) {
		SpringApplication.from(InventarisMsuApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
