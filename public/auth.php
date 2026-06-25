<?php
session_start();
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing credentials."]);
    exit;
}

// Try customer login first
$stmt = $conn->prepare("SELECT CustomerID, FullName, PasswordHash FROM Customers WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$customer = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($customer && password_verify($password, $customer['PasswordHash'])) {
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

// Try admin login
$stmt = $conn->prepare("SELECT UserID, PasswordHash FROM Admins WHERE Email = ?");
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

$_SESSION['adminID'] = $admin['UserID'];
$_SESSION['role']    = 'admin';
$conn->close();
echo json_encode([
    "success" => true,
    "role"    => "admin",
    "name"    => null,
]);