<?php
session_start();
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT CustomerID, FirstName, MiddleName, LastName,
               CONCAT_WS(' ', FirstName, NULLIF(MiddleName,''), LastName) AS FullName,
               IDType, ContactNumber, IDImagePath, VerificationStatus
        FROM Customers
        ORDER BY CustomerID DESC";
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
    if (!$data || !isset($data['FirstName'], $data['LastName'], $data['Email'], $data['Password'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }

    $firstName  = trim($data['FirstName']);
    $middleName = trim($data['MiddleName'] ?? '');
    $lastName   = trim($data['LastName']);
    $idType     = $data['IDType'] ?? '';
    $contact    = $data['ContactNumber'] ?? '';
    $email      = trim($data['Email']);
    $hash       = password_hash($data['Password'], PASSWORD_DEFAULT);

    if (!$firstName || !$lastName) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "First name and last name are required."]);
        exit;
    }

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
        $s1 = $conn->prepare("INSERT INTO Customers (ShopID, FirstName, MiddleName, LastName, IDType, ContactNumber, Email, PasswordHash) VALUES ((SELECT ShopID FROM Shop LIMIT 1), ?, ?, ?, ?, ?, ?, ?)");
        $s1->bind_param("sssssss", $firstName, $middleName, $lastName, $idType, $contact, $email, $hash);
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
    $firstName  = trim($data['FirstName'] ?? '');
    $middleName = trim($data['MiddleName'] ?? '');
    $lastName   = trim($data['LastName'] ?? '');
    $idType     = $data['IDType'] ?? '';
    $contact    = trim($data['ContactNumber'] ?? '');

    if (!$firstName || !$lastName) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "First name and last name are required."]);
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare("UPDATE Customers SET FirstName = ?, MiddleName = ?, LastName = ?, IDType = ?, ContactNumber = ? WHERE CustomerID = ?");
    $stmt->bind_param("sssssi", $firstName, $middleName, $lastName, $idType, $contact, $customerId);
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
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
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
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
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