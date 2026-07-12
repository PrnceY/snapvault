<?php
session_start();
include 'db_connect.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'customer') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$customerID = (int)$_SESSION['customerID'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("
        SELECT c.CartID, i.InventoryID, i.SerialNumber, i.ItemName, i.Description, i.RentalRate,
               i.ImagePath, i.ConditionStatus, i.Status, i.Archived, cat.CategoryName
        FROM Cart c
        JOIN Inventory i ON i.InventoryID = c.InventoryID
        JOIN Equipment_Categories cat ON cat.CategoryID = i.CategoryID
        WHERE c.CustomerID = ?
        ORDER BY c.AddedAt DESC
    ");
    $stmt->bind_param("i", $customerID);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    $stmt->close();
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? null;

if ($action === 'add') {
    $serial = $data['SerialNumber'] ?? null;
    if (!$serial) { http_response_code(400); echo json_encode(["success" => false, "error" => "Missing SerialNumber."]); exit; }

    $lookup = $conn->prepare("SELECT InventoryID FROM Inventory WHERE SerialNumber = ?");
    $lookup->bind_param("s", $serial);
    $lookup->execute();
    $inventoryId = $lookup->get_result()->fetch_assoc()['InventoryID'] ?? null;
    $lookup->close();

    if (!$inventoryId) { http_response_code(400); echo json_encode(["success" => false, "error" => "Item not found."]); exit; }

    $stmt = $conn->prepare("INSERT IGNORE INTO Cart (CustomerID, InventoryID) VALUES (?, ?)");
    $stmt->bind_param("ii", $customerID, $inventoryId);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'remove') {
    $serial = $data['SerialNumber'] ?? null;
    if (!$serial) { http_response_code(400); echo json_encode(["success" => false, "error" => "Missing SerialNumber."]); exit; }

    $stmt = $conn->prepare("DELETE c FROM Cart c JOIN Inventory i ON i.InventoryID = c.InventoryID WHERE c.CustomerID = ? AND i.SerialNumber = ?");
    $stmt->bind_param("is", $customerID, $serial);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'clear') {
    $stmt = $conn->prepare("DELETE FROM Cart WHERE CustomerID = ?");
    $stmt->bind_param("i", $customerID);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid or missing action."]);
$conn->close();