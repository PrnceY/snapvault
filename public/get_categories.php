<?php
include 'db_connect.php';

$sql = "SELECT CategoryID, CategoryName, Description FROM Equipment_Categories";
$result = $conn->query($sql);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
?>
