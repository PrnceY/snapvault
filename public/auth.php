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

$stmt = $conn->prepare("SELECT UserID, CustomerID, PasswordHash, Role FROM Users WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['PasswordHash'])) {
    $conn->close();
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid email or password."]);
    exit;
}

$_SESSION['userID']     = $user['UserID'];
$_SESSION['customerID'] = $user['CustomerID'];
$_SESSION['role']       = $user['Role'];

$name = null;
if ($user['CustomerID']) {
    $s = $conn->prepare("SELECT FullName FROM Customers WHERE CustomerID = ?");
    $s->bind_param("i", $user['CustomerID']);
    $s->execute();
    $row = $s->get_result()->fetch_assoc();
    $s->close();
    $name = $row['FullName'] ?? null;
}

$conn->close();
echo json_encode([
    "success"    => true,
    "role"       => $user['Role'],
    "name"       => $name,
    "customerID" => $user['CustomerID'],
]);