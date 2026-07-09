<?php
session_start();
include 'db_connect.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT s.ShopID, s.ShopName, s.Email, s.Active, s.CreatedAt,
                   (SELECT COUNT(*) FROM Inventory i WHERE i.ShopID = s.ShopID AND i.Archived = 0) AS UnitCount,
                   (SELECT COUNT(*) FROM Customers c WHERE c.ShopID = s.ShopID) AS CustomerCount,
                   (SELECT COUNT(*) FROM Rentals r JOIN Customers c2 ON c2.CustomerID = r.CustomerID
                     WHERE c2.ShopID = s.ShopID AND r.ActualReturn IS NULL) AS ActiveRentals
            FROM Shop s
            ORDER BY s.CreatedAt DESC";
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
    $shopName = trim($data['ShopName'] ?? '');
    $email    = trim($data['Email'] ?? '');
    $password = $data['Password'] ?? '';

    if (!$shopName || !$email || !$password) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }

    $chk = $conn->prepare("SELECT ShopID FROM Shop WHERE Email = ?");
    $chk->bind_param("s", $email);
    $chk->execute();
    $chk->store_result();
    if ($chk->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "A shop with that email already exists."]);
        $chk->close();
        $conn->close();
        exit;
    }
    $chk->close();

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $superAdminId = (int)$_SESSION['superAdminID'];

    $stmt = $conn->prepare("INSERT INTO Shop (SuperAdminID, ShopName, Email, PasswordHash, Active) VALUES (?, ?, ?, ?, 1)");
    $stmt->bind_param("isss", $superAdminId, $shopName, $email, $hash);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'deactivate' || $action === 'activate') {
    $shopId = (int)($data['ShopID'] ?? 0);
    $active = $action === 'activate' ? 1 : 0;
    $stmt = $conn->prepare("UPDATE Shop SET Active = ? WHERE ShopID = ?");
    $stmt->bind_param("ii", $active, $shopId);
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