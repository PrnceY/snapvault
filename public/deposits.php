<?php
include 'db_connect.php';

$sql = "SELECT d.DepositID, d.RentalID,
               CONCAT_WS(' ', c.FirstName, NULLIF(c.MiddleName,''), c.LastName) AS Customer,
               GROUP_CONCAT(i.ItemName SEPARATOR ', ') AS Item,
               d.AmountHeld, d.RefundStatus
        FROM Deposits d
        JOIN Rentals r ON r.RentalID = d.RentalID
        JOIN Customers c ON c.CustomerID = r.CustomerID
        JOIN Rental_Items ri ON ri.RentalID = r.RentalID
        JOIN Inventory i ON i.InventoryID = ri.InventoryID
        GROUP BY d.DepositID, d.RentalID, c.FirstName, c.MiddleName, c.LastName, d.AmountHeld, d.RefundStatus
        ORDER BY d.DepositID DESC";
$result = $conn->query($sql);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
?>