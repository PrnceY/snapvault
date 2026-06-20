<?php
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['SerialNumber'], $data['CategoryID'], $data['ItemName'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

$serial = $data['SerialNumber'];
$categoryId = (int)$data['CategoryID'];
$itemName = $data['ItemName'];
$condition = $data['ConditionStatus'] ?? 'Good';
$status = $data['Status'] ?? 'Available';

$stmt = $conn->prepare("INSERT INTO Inventory (SerialNumber, CategoryID, ItemName, ConditionStatus, Status) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sisss", $serial, $categoryId, $itemName, $condition, $status);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
