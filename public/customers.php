<?php
session_start();
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT CustomerID, FullName, IDType, ContactNumber, IDImagePath, VerificationStatus FROM Customers";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode($rows);
    $conn->close();
    exit;
}

$data = null;
$action = $_POST['action'] ?? null;
if (!$action) {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? null;
}

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
    $chk = $conn->prepare("SELECT CustomerID FROM Customers WHERE Email = ?");
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
        $s1 = $conn->prepare("INSERT INTO Customers (FullName, IDType, ContactNumber, Email, PasswordHash) VALUES (?, ?, ?, ?, ?)");
        $s1->bind_param("sssss", $fullName, $idType, $contact, $email, $hash);
        $s1->execute();
        $customerId = $conn->insert_id;
        $s1->close();

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

if ($action === 'edit') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'customer') {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        $conn->close();
        exit;
    }

    $customerId = (int)$_SESSION['customerID'];
    $fullName   = trim($data['FullName'] ?? '');
    $idType     = $data['IDType'] ?? '';
    $contact    = trim($data['ContactNumber'] ?? '');

    if (!$fullName) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Full name is required."]);
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare("UPDATE Customers SET FullName = ?, IDType = ?, ContactNumber = ? WHERE CustomerID = ?");
    $stmt->bind_param("sssi", $fullName, $idType, $contact, $customerId);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'upload_id') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'customer') {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        $conn->close();
        exit;
    }

    $customerId = (int)$_SESSION['customerID'];

    if (!isset($_FILES['IDImage']) || $_FILES['IDImage']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "No ID image was uploaded."]);
        $conn->close();
        exit;
    }

    $allowed = ['jpg', 'jpeg', 'png', 'webp'];
    $ext = strtolower(pathinfo($_FILES['IDImage']['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Only JPG, PNG, or WEBP images are allowed."]);
        $conn->close();
        exit;
    }

    $uploadDir = __DIR__ . '/uploads/ids/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = 'cust' . $customerId . '_' . time() . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (!move_uploaded_file($_FILES['IDImage']['tmp_name'], $destination)) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Failed to save uploaded image."]);
        $conn->close();
        exit;
    }

    $imagePath = 'uploads/ids/' . $filename;
    $stmt = $conn->prepare("UPDATE Customers SET IDImagePath = ?, VerificationStatus = 'Pending' WHERE CustomerID = ?");
    $stmt->bind_param("si", $imagePath, $customerId);
    $stmt->execute()
        ? print(json_encode(["success" => true, "IDImagePath" => $imagePath]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'verify') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'shop') {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        $conn->close();
        exit;
    }

    $customerId = (int)($data['CustomerID'] ?? 0);
    $stmt = $conn->prepare("UPDATE Customers SET VerificationStatus = 'Verified' WHERE CustomerID = ?");
    $stmt->bind_param("i", $customerId);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'reject') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'shop') {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Unauthorized"]);
        $conn->close();
        exit;
    }

    $customerId = (int)($data['CustomerID'] ?? 0);
    $stmt = $conn->prepare("UPDATE Customers SET VerificationStatus = 'Unverified', IDImagePath = NULL WHERE CustomerID = ?");
    $stmt->bind_param("i", $customerId);
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
?>