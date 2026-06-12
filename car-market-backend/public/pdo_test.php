<?php
// Try SQLite first
try {
    $db = new PDO('sqlite:C:\xampp\htdocs\car-market13\car-market-backend\database\database.sqlite');
    $stmt = $db->query("SELECT DISTINCT brand FROM cars");
    if ($stmt) {
        $brands = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "SQLite brands: " . json_encode($brands) . "\n";
    } else {
        echo "SQLite has no cars table or query failed.\n";
    }
} catch (Exception $e) {
    echo "SQLite error: " . $e->getMessage() . "\n";
}

// Try MySQL (port 3306)
try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=automarket;charset=utf8', 'root', '');
    $stmt = $db->query("SELECT DISTINCT brand FROM cars");
    if ($stmt) {
        $brands = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "MySQL brands: " . json_encode($brands) . "\n";
    } else {
        echo "MySQL has no cars table or query failed.\n";
    }
} catch (Exception $e) {
    echo "MySQL error: " . $e->getMessage() . "\n";
}
