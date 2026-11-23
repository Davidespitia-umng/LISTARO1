-- Script SQL para insertar o actualizar las cuentas de demostración en InfinityFree / MySQL phpMyAdmin:
-- Contraseña para todas: demo1234

INSERT INTO usuarios (nombre, correo, clave, rol)
VALUES ('Administrador Demo', 'admin.demo@listaro.co', '$2y$10$tUa06UYJSFcwBIYiPPBNFeJXT1NMHrPiE0B9dUAaKtgvVY84mEwjG', 'administrador')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), clave = VALUES(clave), rol = VALUES(rol);

INSERT INTO usuarios (nombre, correo, clave, rol)
VALUES ('Almacenista Demo', 'almacenista.demo@listaro.co', '$2y$10$tUa06UYJSFcwBIYiPPBNFeJXT1NMHrPiE0B9dUAaKtgvVY84mEwjG', 'almacenista')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), clave = VALUES(clave), rol = VALUES(rol);

INSERT INTO usuarios (nombre, correo, clave, rol)
VALUES ('Repartidor Demo', 'repartidor.demo@listaro.co', '$2y$10$tUa06UYJSFcwBIYiPPBNFeJXT1NMHrPiE0B9dUAaKtgvVY84mEwjG', 'repartidor')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), clave = VALUES(clave), rol = VALUES(rol);
