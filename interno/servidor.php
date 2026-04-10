<?php
$teste = false;
if ($teste) {
	//Simula que o PHP não está em execução, e devolve o arquivo bruto
	echo file_get_contents(__FILE__);
	die;
}
$info = [
	'phpVersion' => phpversion(),
	'curl' => extension_loaded('curl'),
	'sockets' => extension_loaded('sockets'),
	'snmp' => extension_loaded('snmp'),
	'openssl' => extension_loaded('openssl'),
	'timestamp' => date('Y-m-d H:i:s')
];

header('Content-Type: application/json');
echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>