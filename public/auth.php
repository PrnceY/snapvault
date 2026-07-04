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
    $stmt = $conn->prepare("SELECT CustomerID, FullName, PasswordHash FROM Customers WHERE Email = ?");
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
    $stmt = $conn->prepare("SELECT ShopID, PasswordHash FROM Shop WHERE Email = ?");
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

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid login type."]);
$conn->close();