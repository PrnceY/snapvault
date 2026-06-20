<?php
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['CustomerID'], $data['SerialNumber'], $data['ExpectedBack'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

$customerId = (int)$data['CustomerID'];
$serial = $data['SerialNumber'];
$expectedBack = $data['ExpectedBack'];
$depositAmount = isset($data['DepositAmount']) ? (float)$data['DepositAmount'] : 0;

$conn->begin_transaction();

try {
    // 1. Create the rental record (DateOut = right now)
    $stmt = $conn->prepare("INSERT INTO Rentals (CustomerID, SerialNumber, DateOut, ExpectedBack) VALUES (?, ?, NOW(), ?)");
    $stmt->bind_param("iss", $customerId, $serial, $expectedBack);
    $stmt->execute();
    $rentalId = $conn->insert_id;
    $stmt->close();

    // 2. Create the linked deposit, held until return
    $stmt = $conn->prepare("INSERT INTO Deposits (RentalID, AmountHeld, RefundStatus) VALUES (?, ?, 'Held')");
    $stmt->bind_param("id", $rentalId, $depositAmount);
    $stmt->execute();
    $stmt->close();

    // 3. Flip the inventory item to Rented so it can't be double-booked
    $stmt = $conn->prepare("UPDATE Inventory SET Status = 'Rented' WHERE SerialNumber = ?");
    $stmt->bind_param("s", $serial);
    $stmt->execute();
    $stmt->close();

    $conn->commit();
    echo json_encode(["success" => true, "RentalID" => $rentalId]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
