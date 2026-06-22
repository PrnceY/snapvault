<?php
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT CustomerID, FullName, IDType, ContactNumber, Verified FROM Customers";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode($rows);
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? null;

if ($action === 'add') {
    if (!$data || !isset($data['FullName'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }

    $fullName = $data['FullName'];
    $idType = $data['IDType'] ?? '';
    $contact = $data['ContactNumber'] ?? '';
    $verified = !empty($data['Verified']) ? 1 : 0;

    $stmt = $conn->prepare("INSERT INTO Customers (FullName, IDType, ContactNumber, Verified) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $fullName, $idType, $contact, $verified);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid or missing action."]);
$conn->close();
?>