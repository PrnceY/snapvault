<?php
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT r.RentalID, c.FullName AS Customer, i.ItemName AS Item,
                   r.DateOut, r.ExpectedBack, r.ActualReturn
            FROM Rentals r
            JOIN Customers c ON r.CustomerID = c.CustomerID
            JOIN Inventory i ON r.SerialNumber = i.SerialNumber";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode($rows);
    $conn->close();
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? null;

if ($action === 'create') {
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
        $stmt = $conn->prepare("INSERT INTO Rentals (CustomerID, SerialNumber, DateOut, ExpectedBack) VALUES (?, ?, NOW(), ?)");
        $stmt->bind_param("iss", $customerId, $serial, $expectedBack);
        $stmt->execute();
        $rentalId = $conn->insert_id;
        $stmt->close();

        $stmt = $conn->prepare("INSERT INTO Deposits (RentalID, AmountHeld, RefundStatus) VALUES (?, ?, 'Held')");
        $stmt->bind_param("id", $rentalId, $depositAmount);
        $stmt->execute();
        $stmt->close();

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
    exit;
}

if ($action === 'return') {
    if (!$data || !isset($data['RentalID'], $data['RefundStatus'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }

    $rentalId = (int)$data['RentalID'];
    $refundStatus = $data['RefundStatus'];

    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("SELECT SerialNumber FROM Rentals WHERE RentalID = ?");
        $stmt->bind_param("i", $rentalId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row) {
            throw new Exception("Rental not found.");
        }
        $serial = $row['SerialNumber'];

        $stmt = $conn->prepare("UPDATE Rentals SET ActualReturn = NOW() WHERE RentalID = ?");
        $stmt->bind_param("i", $rentalId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("UPDATE Deposits SET RefundStatus = ? WHERE RentalID = ?");
        $stmt->bind_param("si", $refundStatus, $rentalId);
        $stmt->execute();
        $stmt->close();

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
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid or missing action."]);
$conn->close();
?>