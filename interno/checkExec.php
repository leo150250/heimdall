<?php
$path = "../";
require_once($path."interno/funcoes.php");

$info = [
	"checkExec" => checkExec()
];
header('Content-Type: application/json');
echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>