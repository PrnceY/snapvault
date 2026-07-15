<?php
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT r.RentalID, r.CustomerID,
               CONCAT_WS(' ', c.FirstName, NULLIF(c.MiddleName,''), c.LastName) AS Customer,
               GROUP_CONCAT(i.ItemName SEPARATOR ', ') AS Item,
               JSON_ARRAYAGG(JSON_OBJECT('ItemName', i.ItemName, 'SerialNumber', i.SerialNumber)) AS ItemDetails,
               r.DateOut, r.ExpectedBack, r.ActualReturn, r.Status
        FROM Rentals r
        JOIN Customers c ON r.CustomerID = c.CustomerID
        JOIN Rental_Items ri ON ri.RentalID = r.RentalID
        JOIN Inventory i ON i.InventoryID = ri.InventoryID
        GROUP BY r.RentalID, r.CustomerID, c.FirstName, c.MiddleName, c.LastName, r.DateOut, r.ExpectedBack, r.ActualReturn, r.Status
        ORDER BY r.RentalID DESC";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $row['ItemDetails'] = json_decode($row['ItemDetails'], true);
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
        $serials = $data['SerialNumbers'] ?? (isset($data['SerialNumber']) ? [$data['SerialNumber']] : []);

        $stmt = $conn->prepare("INSERT INTO Rentals (CustomerID, DateOut, ExpectedBack) VALUES (?, NOW(), ?)");
        $stmt->bind_param("is", $customerId, $expectedBack);
        $stmt->execute();
        $rentalId = $conn->insert_id;
        $stmt->close();

        foreach ($serials as $serial) {
            $lookup = $conn->prepare("SELECT InventoryID, RentalRate FROM Inventory WHERE SerialNumber = ?");
            $lookup->bind_param("s", $serial);
            $lookup->execute();
            $item = $lookup->get_result()->fetch_assoc();
            $lookup->close();

            $inventoryId = $item['InventoryID'];
            $agreedRate  = $item['RentalRate'];

            $stmt = $conn->prepare("INSERT INTO Rental_Items (RentalID, InventoryID, AgreedRate) VALUES (?, ?, ?)");
            $stmt->bind_param("iid", $rentalId, $inventoryId, $agreedRate);
            $stmt->execute();
            $stmt->close();

            $stmt = $conn->prepare("UPDATE Inventory SET Status = 'Rented' WHERE SerialNumber = ?");
            $stmt->bind_param("s", $serial);
            $stmt->execute();
            $stmt->close();
        }

        $stmt = $conn->prepare("INSERT INTO Deposits (RentalID, AmountHeld, RefundStatus) VALUES (?, ?, 'Held')");
        $stmt->bind_param("id", $rentalId, $depositAmount);
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
        $stmt = $conn->prepare("SELECT InventoryID FROM Rental_Items WHERE RentalID = ?");
        $stmt->bind_param("i", $rentalId);
        $stmt->execute();
        $items = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        if (empty($items)) {
            throw new Exception("Rental not found.");
        }

        foreach ($items as $item) {
            $s = $conn->prepare("UPDATE Inventory SET Status = 'Available' WHERE InventoryID = ?");
            $s->bind_param("i", $item['InventoryID']);
            $s->execute();
            $s->close();
        }

        $stmt = $conn->prepare("UPDATE Deposits SET RefundStatus = ? WHERE RentalID = ?");
        $stmt->bind_param("si", $refundStatus, $rentalId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("UPDATE Rentals SET ActualReturn = NOW(), Status = 'Completed' WHERE RentalID = ?");
        $stmt->bind_param("i", $rentalId);
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