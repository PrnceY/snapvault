<?php
session_start();
include 'db_connect.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'customer') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$customerID = (int)$_SESSION['customerID'];

// Customer profile
$stmt = $conn->prepare("SELECT CustomerID, FullName, IDType, ContactNumber, IDImagePath, VerificationStatus FROM Customers WHERE CustomerID = ?");
$stmt->bind_param("i", $customerID);
$stmt->execute();
$customer = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Their rentals
$stmt = $conn->prepare("
    SELECT r.RentalID,
           GROUP_CONCAT(i.ItemName SEPARATOR ', ') AS Item,
           r.DateOut, r.ExpectedBack, r.ActualReturn,
           d.AmountHeld, d.RefundStatus
    FROM Rentals r
    JOIN Rental_Items ri ON ri.RentalID = r.RentalID
    JOIN Inventory i ON i.SerialNumber = ri.SerialNumber
    LEFT JOIN Deposits d ON d.RentalID = r.RentalID
    WHERE r.CustomerID = ?
    GROUP BY r.RentalID, r.DateOut, r.ExpectedBack, r.ActualReturn, d.AmountHeld, d.RefundStatus
    ORDER BY r.DateOut DESC
");
$stmt->bind_param("i", $customerID);
$stmt->execute();
$rentals = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Available inventory count (public info)
$result = $conn->query("SELECT COUNT(*) AS cnt FROM Inventory WHERE Status = 'Available' AND Archived = 0");
$availableCount = $result->fetch_assoc()['cnt'];

$conn->close();

echo json_encode([
    "customer"       => $customer,
    "rentals"        => $rentals,
    "availableCount" => $availableCount,
]);