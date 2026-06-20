<?php
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['SerialNumber'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

$serial = $data['SerialNumber'];

// Block deletion if the item is currently out on an active (unreturned) rental
$stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM Rentals WHERE SerialNumber = ? AND ActualReturn IS NULL");
$stmt->bind_param("s", $serial);
$stmt->execute();
$activeCount = $stmt->get_result()->fetch_assoc()['cnt'];
$stmt->close();

if ($activeCount > 0) {
    http_response_code(409);
    echo json_encode(["success" => false, "error" => "This item is currently out on rental and can't be deleted."]);
    exit;
}

// Grab the image path so the file can be cleaned up after the row is gone
$stmt = $conn->prepare("SELECT ImagePath FROM Inventory WHERE SerialNumber = ?");
$stmt->bind_param("s", $serial);
$stmt->execute();
$imgRow = $stmt->get_result()->fetch_assoc();
$stmt->close();

$stmt = $conn->prepare("DELETE FROM Inventory WHERE SerialNumber = ?");
$stmt->bind_param("s", $serial);

if ($stmt->execute()) {
    if ($imgRow && !empty($imgRow['ImagePath']) && file_exists(__DIR__ . '/' . $imgRow['ImagePath'])) {
        @unlink(__DIR__ . '/' . $imgRow['ImagePath']);
    }
    echo json_encode(["success" => true]);
} elseif ($conn->errno === 1451) {
    http_response_code(409);
    echo json_encode(["success" => false, "error" => "This item has rental history tied to it and can't be deleted."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>