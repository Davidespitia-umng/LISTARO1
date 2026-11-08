<?php

require_once __DIR__ . '/db.php';

$hash = password_hash('demo1234', PASSWORD_DEFAULT);

$correos = [
    'admin.demo@listaro.co',
    'almacenista.demo@listaro.co',
    'repartidor.demo@listaro.co',
];

$stmt = db()->prepare('UPDATE usuarios SET clave = ? WHERE correo = ?');

foreach ($correos as $correo) {
    $stmt->execute([$hash, $correo]);
}

echo 'Contraseñas actualizadas correctamente. Borra este archivo ahora.';