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

$stmt = $conn->prepare("UPDATE Inventory SET Archived = 1 WHERE SerialNumber = ?");
$stmt->bind_param("s", $serial);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>