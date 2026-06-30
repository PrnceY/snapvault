<?php
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT i.SerialNumber, i.ItemName, i.RentalRate, i.ImagePath, i.ConditionStatus, i.Status, i.Archived, c.CategoryName
        FROM Inventory i
        JOIN Equipment_Categories c ON i.CategoryID = c.CategoryID";
    $result = $conn->query($sql);
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode($rows);
    $conn->close();
    exit;
}

// POST: "add" comes in as multipart form data (file upload),
// "delete" and "restore" come in as JSON.
$data = null;
$action = $_POST['action'] ?? null;
if (!$action) {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? null;
}

if ($action === 'add') {
    $serial = $_POST['SerialNumber'] ?? null;
    $categoryId = isset($_POST['CategoryID']) ? (int)$_POST['CategoryID'] : null;
    $itemName = $_POST['ItemName'] ?? null;
    $rentalRate = isset($_POST['RentalRate']) ? (float)$_POST['RentalRate'] : 0.00;
    $condition = $_POST['ConditionStatus'] ?? 'Good';
    $status = $_POST['Status'] ?? 'Available';
    $status = $_POST['Status'] ?? 'Available';

    if (!$serial || !$categoryId || !$itemName) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }

    $imagePath = null;

    if (isset($_FILES['Image']) && $_FILES['Image']['error'] === UPLOAD_ERR_OK) {
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        $ext = strtolower(pathinfo($_FILES['Image']['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Only JPG, PNG, or WEBP images are allowed."]);
            exit;
        }

        $uploadDir = __DIR__ . '/uploads/inventory/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = preg_replace('/[^A-Za-z0-9_-]/', '_', $serial) . '_' . time() . '.' . $ext;
        $destination = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['Image']['tmp_name'], $destination)) {
            $imagePath = 'uploads/inventory/' . $filename;
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to save uploaded image."]);
            exit;
        }
    }

    $stmt = $conn->prepare("INSERT INTO Inventory (SerialNumber, CategoryID, ItemName, RentalRate, ImagePath, ConditionStatus, Status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sisdsss", $serial, $categoryId, $itemName, $rentalRate, $imagePath, $condition, $status);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'delete') {
    if (!$data || !isset($data['SerialNumber'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }
    $serial = $data['SerialNumber'];

    $stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM Rental_Items ri JOIN Rentals r ON r.RentalID = ri.RentalID WHERE ri.SerialNumber = ? AND r.ActualReturn IS NULL");
    $stmt->bind_param("s", $serial);
    $stmt->execute();
    $activeCount = $stmt->get_result()->fetch_assoc()['cnt'];
    $stmt->close();

    if ($activeCount > 0) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "This item is currently out on rental and can't be deleted."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE Inventory SET Archived = 1 WHERE SerialNumber = ?");
    $stmt->bind_param("s", $serial);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'restore') {
    if (!$data || !isset($data['SerialNumber'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields."]);
        exit;
    }
    $serial = $data['SerialNumber'];

    $stmt = $conn->prepare("UPDATE Inventory SET Archived = 0 WHERE SerialNumber = ?");
    $stmt->bind_param("s", $serial);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

if ($action === 'edit') {
    // Edit now arrives as multipart (FormData) so it can carry an optional image,
    // same shape as 'add'. Fall back to $data (JSON) if it's ever sent that way.
    $serial     = $_POST['SerialNumber']      ?? ($data['SerialNumber']      ?? null);
    $itemName   = $_POST['ItemName']          ?? ($data['ItemName']          ?? null);
    $rentalRate = isset($_POST['RentalRate']) ? (float)$_POST['RentalRate']
                 : (isset($data['RentalRate']) ? (float)$data['RentalRate'] : null);
    $condition  = $_POST['ConditionStatus']   ?? ($data['ConditionStatus']   ?? null);
    $status     = $_POST['Status']            ?? ($data['Status']            ?? null);
    $categoryId = isset($_POST['CategoryID']) ? (int)$_POST['CategoryID']
                 : (isset($data['CategoryID']) ? (int)$data['CategoryID'] : null);

    if (!$serial) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing SerialNumber."]);
        exit;
    }

    $fields = [];
    $types  = "";
    $vals   = [];

    if ($itemName   !== null) { $fields[] = "ItemName = ?";        $types .= "s"; $vals[] = $itemName; }
    if ($rentalRate !== null) { $fields[] = "RentalRate = ?";      $types .= "d"; $vals[] = $rentalRate; }
    if ($condition  !== null) { $fields[] = "ConditionStatus = ?"; $types .= "s"; $vals[] = $condition; }
    if ($status     !== null) { $fields[] = "Status = ?";          $types .= "s"; $vals[] = $status; }
    if ($categoryId !== null) { $fields[] = "CategoryID = ?";      $types .= "i"; $vals[] = $categoryId; }

    // Optional new image
    if (isset($_FILES['Image']) && $_FILES['Image']['error'] === UPLOAD_ERR_OK) {
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        $ext = strtolower(pathinfo($_FILES['Image']['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Only JPG, PNG, or WEBP images are allowed."]);
            exit;
        }

        $uploadDir = __DIR__ . '/uploads/inventory/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = preg_replace('/[^A-Za-z0-9_-]/', '_', $serial) . '_' . time() . '.' . $ext;
        $destination = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['Image']['tmp_name'], $destination)) {
            $fields[] = "ImagePath = ?";
            $types .= "s";
            $vals[] = 'uploads/inventory/' . $filename;
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to save uploaded image."]);
            exit;
        }
    }

    if (empty($fields)) {
        echo json_encode(["success" => true]);
        $conn->close(); exit;
    }

    $types .= "s";
    $vals[] = $serial;
    $stmt = $conn->prepare("UPDATE Inventory SET " . implode(", ", $fields) . " WHERE SerialNumber = ?");
    $stmt->bind_param($types, ...$vals);
    $stmt->execute()
        ? print(json_encode(["success" => true]))
        : (http_response_code(500) && print(json_encode(["success" => false, "error" => $stmt->error])));
    $stmt->close();
    $conn->close();
    exit;
}

http_response_code(400);
echo json_encode(["success" => false, "error" => "Invalid or missing action."]);
$conn->close();
?>