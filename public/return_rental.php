<?php
include 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['RentalID'], $data['RefundStatus'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

$rentalId = (int)$data['RentalID'];
$refundStatus = $data['RefundStatus'];

$conn->begin_transaction();

try {
    // Find which item this rental was for
    $stmt = $conn->prepare("SELECT SerialNumber FROM Rentals WHERE RentalID = ?");
    $stmt->bind_param("i", $rentalId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        throw new Exception("Rental not found.");
    }
    $serial = $row['SerialNumber'];

    // 1. Mark the rental as returned, right now
    $stmt = $conn->prepare("UPDATE Rentals SET ActualReturn = NOW() WHERE RentalID = ?");
    $stmt->bind_param("i", $rentalId);
    $stmt->execute();
    $stmt->close();

    // 2. Resolve the deposit's refund status
    $stmt = $conn->prepare("UPDATE Deposits SET RefundStatus = ? WHERE RentalID = ?");
    $stmt->bind_param("si", $refundStatus, $rentalId);
    $stmt->execute();
    $stmt->close();

    // 3. Free up the inventory item again
    $stmt = $conn->prepare("UPDATE Inventory SET Status = 'Available' WHERE SerialNumber = ?");
    $stmt->bind_param("s", $serial);
    $stmt->execute();
    $stmt->close();

    $conn->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
