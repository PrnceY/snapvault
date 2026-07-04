<?php
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT ec.CompatibilityID, cam.SerialNumber AS CameraSerial, lens.SerialNumber AS LensSerial,
                   cam.ItemName AS CameraName, lens.ItemName AS LensName, ec.CompatibilityType, ec.Notes
            FROM Equipment_Compatibility ec
            JOIN Inventory cam  ON cam.InventoryID  = ec.EquipmentID_A
            JOIN Inventory lens ON lens.InventoryID = ec.EquipmentID_B";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    echo json_encode($rows);
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? null;

if ($action === 'add') {
    $cam  = $data['CameraSerial'] ?? null;
    $lens = $data['LensSerial']   ?? null;
    if (!$cam || !$lens) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing serials."]);
        exit;
    }
    $notes = $data['Notes'] ?? null;
    $type  = $data['CompatibilityType'] ?? 'Camera-Lens';

    $lookup = $conn->prepare("SELECT InventoryID FROM Inventory WHERE SerialNumber = ?");
    $lookup->bind_param("s", $cam);
    $lookup->execute();
    $camId = $lookup->get_result()->fetch_assoc()['InventoryID'] ?? null;
    $lookup->close();

    $lookup = $conn->prepare("SELECT InventoryID FROM Inventory WHERE SerialNumber = ?");
    $lookup->bind_param("s", $lens);
    $lookup->execute();
    $lensId = $lookup->get_result()->fetch_assoc()['InventoryID'] ?? null;
    $lookup->close();

    if (!$camId || !$lensId) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "One or both serials were not found."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO Equipment_Compatibility (EquipmentID_A, EquipmentID_B, CompatibilityType, Notes) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiss", $camId, $lensId, $type, $notes);
    $stmt->execute() 
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'delete') {
    $id = (int)($data['CompatibilityID'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM Equipment_Compatibility WHERE CompatibilityID = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid action."]);
$conn->close();
?>