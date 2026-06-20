<?php
include 'db_connect.php';

$sql = "SELECT i.SerialNumber, i.ItemName, i.ImagePath, i.ConditionStatus, i.Status, c.CategoryName
        FROM Inventory i
        JOIN Equipment_Categories c ON i.CategoryID = c.CategoryID";
$result = $conn->query($sql);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
?>
