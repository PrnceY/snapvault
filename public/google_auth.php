<?php
session_start();
include 'db_connect.php';

$data  = json_decode(file_get_contents("php://input"), true);
$token = $data['credential'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "No token provided."]);
    exit;
}

// ── Verify token with Google ──────────────────────────────────────────────────
$clientId = "799662807230-4q31iroressgi5jtlou3o1j31c8ggn81.apps.googleusercontent.com"; // ← paste your Client ID here

$response = @file_get_contents(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($token)
);

if (!$response) {
    http_response_code(502);
    echo json_encode(["success" => false, "error" => "Could not reach Google to verify token."]);
    exit;
}

$payload = json_decode($response, true);

// Make sure it's valid and issued for YOUR app
if (
    !$payload ||
    ($payload['aud']            ?? '') !== $clientId ||
    ($payload['email_verified'] ?? '') !== 'true'
) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Invalid or unverified Google token."]);
    exit;
}

$email    = $payload['email'];
$fullName = $payload['name'] ?? $email;

// ── Find or create customer ───────────────────────────────────────────────────
$stmt = $conn->prepare("SELECT CustomerID, FullName FROM Customers WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$customer = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$customer) {
    // Auto-register: no password needed for Google users
    $stmt = $conn->prepare(
        "INSERT INTO Customers (FullName, Email, IDType, ContactNumber, Verified, PasswordHash)
         VALUES (?, ?, '', '', 0, NULL)"
    );
    $stmt->bind_param("ss", $fullName, $email);
    $stmt->execute();
    $customerId = $conn->insert_id;
    $stmt->close();
} else {
    $customerId = $customer['CustomerID'];
    $fullName   = $customer['FullName'];
}

// ── Set session ───────────────────────────────────────────────────────────────
$_SESSION['customerID'] = $customerId;
$_SESSION['role']       = 'customer';

$conn->close();
echo json_encode([
    "success"    => true,
    "role"       => "customer",
    "name"       => $fullName,
    "customerID" => $customerId,
]);
