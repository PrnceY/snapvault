<?php
include 'db_connect.php';

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
?>
