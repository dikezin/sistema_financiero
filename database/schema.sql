CREATE DATABASE IF NOT EXISTS mi_base;
USE mi_base;

CREATE TABLE IF NOT EXISTS movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cuenta VARCHAR(50) NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  fecha DATE NOT NULL,
  INDEX idx_movimientos_cuenta (cuenta)
);