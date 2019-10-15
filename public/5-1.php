<?php
    $data = NULL;
    if(isset($_POST) and $_SERVER['REQUEST_METHOD'] == "POST") {
        $dataType = INPUT_POST;
    } elseif (isset($_GET) and $_SERVER['REQUEST_METHOD'] == "GET") {
        $dataType = INPUT_GET;
    }

    $inputText = NULL;
    if(isset($dataType)) {
        $inputText = filter_input($dataType, 'inputText', FILTER_SANITIZE_STRING);
    }
?>
<div class="center">
    <p>
        This is screen 5.1. Pressing Submit on form will do a tab refresh (and not a browser refresh).
    </p>
    <?php
        if(isset($inputText)) {
            echo("<p>Your text is <strong style='color: orange;'>'" . $inputText . "'</strong>");
        }
    ?>
    <p id="timer">
        0 seconds
        <!-- dynamic content -->
    </p>
    <form class="bs-override-submit" method="post" action="5-1.php">
        Fill this in:<br>
        <input type="text" name="inputText"><br>
        <input type="submit" value="Submit">
    </form>
    <p class="large-text">
        <a href="" class="bs-override-back"><<</a> || <a disabled>>></a>
    </p>
</div>
<script type="text/javascript">
    var start = new Date;
    setInterval(function() {
        $('#timer').text(Math.round((new Date - start) / 1000, 0) + " seconds"); 
    }, 1000);   
</script>