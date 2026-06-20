<?php
include 'db_connect.php';

$sql = "SELECT CustomerID, FullName, IDType, ContactNumber, Verified FROM Customers";
$result = $conn->query($sql);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
?>
