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
    if (!$data || !isset($data['FullName'], $data['Email'], $data['Password'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }

    $fullName = trim($data['FullName']);
    $idType   = $data['IDType'] ?? '';
    $contact  = $data['ContactNumber'] ?? '';
    $email    = trim($data['Email']);
    $hash     = password_hash($data['Password'], PASSWORD_DEFAULT);

    // Check if email already in use
    $chk = $conn->prepare("SELECT UserID FROM Users WHERE Email = ?");
    $chk->bind_param("s", $email);
    $chk->execute();
    $chk->store_result();
    if ($chk->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "An account with that email already exists."]);
        $chk->close();
        $conn->close();
        exit;
    }
    $chk->close();

    $conn->begin_transaction();
    try {
        $s1 = $conn->prepare("INSERT INTO Customers (FullName, IDType, ContactNumber, Verified) VALUES (?, ?, ?, 0)");
        $s1->bind_param("sss", $fullName, $idType, $contact);
        $s1->execute();
        $customerId = $conn->insert_id;
        $s1->close();

        $s2 = $conn->prepare("INSERT INTO Users (CustomerID, Email, PasswordHash, Role) VALUES (?, ?, ?, 'customer')");
        $s2->bind_param("iss", $customerId, $email, $hash);
        $s2->execute();
        $s2->close();

        $conn->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    $conn->close();
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid or missing action."]);
$conn->close();
?>