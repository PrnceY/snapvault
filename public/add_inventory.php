<?php
include 'db_connect.php';

$serial = $_POST['SerialNumber'] ?? null;
$categoryId = isset($_POST['CategoryID']) ? (int)$_POST['CategoryID'] : null;
$itemName = $_POST['ItemName'] ?? null;
$condition = $_POST['ConditionStatus'] ?? 'Good';
$status = $_POST['Status'] ?? 'Available';

if (!$serial || !$categoryId || !$itemName) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

$imagePath = null;

if (isset($_FILES['Image']) && $_FILES['Image']['error'] === UPLOAD_ERR_OK) {
    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    $ext = strtolower(pathinfo($_FILES['Image']['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Only JPG, PNG, or WEBP images are allowed."]);
        exit;
    }

    $uploadDir = __DIR__ . '/uploads/inventory/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = preg_replace('/[^A-Za-z0-9_-]/', '_', $serial) . '_' . time() . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['Image']['tmp_name'], $destination)) {
        $imagePath = 'uploads/inventory/' . $filename;
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Failed to save uploaded image."]);
        exit;
    }
}

$stmt = $conn->prepare("INSERT INTO Inventory (SerialNumber, CategoryID, ItemName, ImagePath, ConditionStatus, Status) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sissss", $serial, $categoryId, $itemName, $imagePath, $condition, $status);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>