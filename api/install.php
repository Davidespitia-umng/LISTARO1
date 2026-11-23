<?php

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Usa POST para ejecutar el instalador una sola vez.');
}

$pdo = db();
$schema = file_get_contents(__DIR__ . '/schema.sql');
$statements = array_filter(array_map('trim', preg_split('/;\s*(?:\r\n|\n|\r)/', $schema)));

try {
    $pdo->beginTransaction();
    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }

    $demoUsers = [
        ['nombre' => 'Administrador Demo', 'correo' => 'admin.demo@listaro.co', 'clave' => password_hash('demo1234', PASSWORD_DEFAULT), 'rol' => 'administrador'],
        ['nombre' => 'Almacenista Demo', 'correo' => 'almacenista.demo@listaro.co', 'clave' => password_hash('demo1234', PASSWORD_DEFAULT), 'rol' => 'almacenista'],
        ['nombre' => 'Repartidor Demo', 'correo' => 'repartidor.demo@listaro.co', 'clave' => password_hash('demo1234', PASSWORD_DEFAULT), 'rol' => 'repartidor'],
    ];

    $adminId = null;
    foreach ($demoUsers as $u) {
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE correo = ?');
        $stmt->execute([$u['correo']]);
        $row = $stmt->fetch();
        if ($row) {
            $stmt = $pdo->prepare('UPDATE usuarios SET nombre = ?, clave = ?, rol = ? WHERE id = ?');
            $stmt->execute([$u['nombre'], $u['clave'], $u['rol'], $row['id']]);
            $uId = (int)$row['id'];
        } else {
            $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, correo, clave, rol) VALUES (?, ?, ?, ?)');
            $stmt->execute([$u['nombre'], $u['correo'], $u['clave'], $u['rol']]);
            $uId = (int)$pdo->lastInsertId();
        }
        if ($u['rol'] === 'administrador' && $adminId === null) {
            $adminId = $uId;
        }
    }

    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM edificios');
    $row = $stmt->fetch();
    if ((int)$row['total'] === 0 && $adminId) {
        $stmt = $pdo->prepare('INSERT INTO edificios (usuario_id, nombre, direccion, notas) VALUES (?, ?, ?, ?)');
        $stmt->execute([$adminId, 'Hotel Central', 'Cra. 7 #45-12, Bogotá', '']);
        $buildingId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('INSERT INTO habitaciones (edificio_id, nombre, piso, estado) VALUES (?, ?, ?, ?)');
        $stmt->execute([$buildingId, 'Habitación 101', '1', 'activa']);
    }
    $pdo->commit();
    header('Content-Type: text/plain; charset=utf-8');
    echo "Instalación completada. Borra api/install.php del hosting.";
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo 'La instalación falló: ' . $error->getMessage();
}
