<?php
session_start();
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$loginAs = $data['loginAs'] ?? null;

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing credentials."]);
    exit;
}

if ($loginAs === 'customer') {
    $stmt = $conn->prepare("SELECT CustomerID, CONCAT_WS(' ', FirstName, NULLIF(MiddleName,''), LastName) AS FullName, PasswordHash FROM Customers WHERE Email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $customer = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$customer || !password_verify($password, $customer['PasswordHash'])) {
        $conn->close();
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid email or password."]);
        exit;
    }

    $_SESSION['customerID'] = $customer['CustomerID'];
    $_SESSION['role']       = 'customer';
    $conn->close();
    echo json_encode([
        "success"    => true,
        "role"       => "customer",
        "name"       => $customer['FullName'],
        "customerID" => $customer['CustomerID'],
    ]);
    exit;
}

if ($loginAs === 'shop') {
    $stmt = $conn->prepare("SELECT ShopID, PasswordHash, Active FROM Shop WHERE Email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $shop = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$shop || !password_verify($password, $shop['PasswordHash'])) {
        $conn->close();
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid email or password."]);
        exit;
    }

    if ((int)$shop['Active'] === 0) {
        $conn->close();
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "This shop account has been deactivated."]);
        exit;
    }

    $_SESSION['shopID'] = $shop['ShopID'];
    $_SESSION['role']       = 'shop';
    $conn->close();
    echo json_encode([
        "success" => true,
        "role"    => "shop",
        "name"    => null,
    ]);
    exit;
}

if ($loginAs === 'superadmin') {
    $stmt = $conn->prepare("SELECT SuperAdminID, PasswordHash FROM Super_Admin WHERE Email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $admin = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$admin || !password_verify($password, $admin['PasswordHash'])) {
        $conn->close();
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Invalid email or password."]);
        exit;
    }

    $_SESSION['superAdminID'] = $admin['SuperAdminID'];
    $_SESSION['role']         = 'superadmin';
    $conn->close();
    echo json_encode([
        "success" => true,
        "role"    => "superadmin",
        "name"    => null,
    ]);
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid login type."]);
$conn->close();