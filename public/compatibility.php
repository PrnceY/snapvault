<?php
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT ec.CompatibilityID, ec.CameraSerial, ec.LensSerial,
                   cam.ItemName AS CameraName, lens.ItemName AS LensName, ec.Notes
            FROM Equipment_Compatibility ec
            JOIN Inventory cam  ON cam.SerialNumber  = ec.CameraSerial
            JOIN Inventory lens ON lens.SerialNumber = ec.LensSerial";
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
    $stmt = $conn->prepare("INSERT INTO Equipment_Compatibility (CameraSerial, LensSerial, Notes) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $cam, $lens, $notes);
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