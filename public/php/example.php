<?php
    if(isset($_POST) and $_SERVER['REQUEST_METHOD'] == "POST") {
        echo($_POST);
    } else {
        echo($_GET);
    }
?>