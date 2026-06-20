<?php
include 'db_connect.php';

$sql = "SELECT DepositID, RentalID, AmountHeld, RefundStatus FROM Deposits";
$result = $conn->query($sql);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
?>
