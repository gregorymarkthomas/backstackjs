<!-- php file acting as backend -->
<?php
    $data = NULL;
    if(isset($_POST) and $_SERVER['REQUEST_METHOD'] == "POST") {
        $data = $_POST;
    } else if (isset($_GET) and $_SERVER['REQUEST_METHOD'] == "GET") {
        $data = $_GET;
    }
    if(isset($data)) {
        $inputText = filter_input($data, 'inputText', FILTER_SANITIZE_STRING);
    }
    echo $inputText;
?>