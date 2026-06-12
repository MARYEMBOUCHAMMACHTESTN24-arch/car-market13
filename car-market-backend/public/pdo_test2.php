<?php
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
