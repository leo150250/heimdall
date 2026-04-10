<?php
if (!isset($path)) {
	$path = "";
}
class Config {
	public $pid;
	public $porta;

	public function __construct() {
		$this->pid = 0;
		$this->porta = 8080;
	}

	public function salvar() {
		global $path;
		file_put_contents($path."interno/sys/config.json", json_encode($this));
	}

	public function carregar() {
		global $path;
		try {
			if (!file_exists($path."interno/sys/config.json")) {
				$this->salvar();
			}
		} catch (Exception $e) {
			echo "Erro ao carregar configuração: ".$e->getMessage()."\n";
			return;
		}
		$data = json_decode(file_get_contents($path."interno/sys/config.json"), true);
		$this->pid = $data['pid'];
		$this->porta = $data['porta'];
	}

	public function getPid() {	
		return $this->pid;
	}

	public function setPid($pid) {
		$this->pid = $pid;
		$this->salvar();
	}

	public function getPorta() {
		return $this->porta;
	}

	public function setPorta($porta) {
		$this->porta = $porta;
	}
}

function perform_handshaking($received_header, $client_conn, $host, $port) {
	$headers = array();
	$lines = preg_split("/\r\n/", $received_header);
	foreach ($lines as $line) {
		$line = chop($line);
		if (preg_match('/\A(\S+): (.*)\z/', $line, $matches)) {
			$headers[$matches[1]] = $matches[2];
		}
	}

	if (!isset($headers['Sec-WebSocket-Key'])) {
		return;
	}
	$secKey = $headers['Sec-WebSocket-Key'];
	$secAccept = base64_encode(sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));

	//$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? 'wss' : 'ws';
	$protocol = 'wss';
	$location = "{$protocol}://$host:$port";

	$upgrade = "HTTP/1.1 101 Switching Protocols\r\n" .
			   "Upgrade: websocket\r\n" .
			   "Connection: Upgrade\r\n" .
			   "Sec-WebSocket-Accept: $secAccept\r\n\r\n";
	fwrite($client_conn, $upgrade);
}
function unmask($payload) {
	$length = ord($payload[1]) & 127;

	if ($length == 126) {
		$masks = substr($payload, 4, 4);
		$data = substr($payload, 8);
	} elseif ($length == 127) {
		$masks = substr($payload, 10, 4);
		$data = substr($payload, 14);
	} else {
		$masks = substr($payload, 2, 4);
		$data = substr($payload, 6);
	}

	$text = '';
	for ($i = 0; $i < strlen($data); ++$i) {
		$text .= $data[$i] ^ $masks[$i % 4];
	}
	return $text;
}
function encodeMessage($msg) {
	$b1 = 0x80 | (0x1 & 0x0f); // FIN + opcode (text)
	$length = strlen($msg);

	if ($length <= 125) {
		$header = pack('CC', $b1, $length);
	} elseif ($length <= 65535) {
		$header = pack('CCn', $b1, 126, $length);
	} else {
		// 64 bits: PHP não tem pack 'J' em todo sistema, então use gmp or split em 2x32 bits
		$header = pack('CCNN', $b1, 127, 0, $length); // Funciona para mensagens < 4GB
	}

	return $header . $msg;
}

function checkExec() {
	global $config;
	$pid = $config->getPid();
	if ($pid == 0) {
		return false;
	}

	if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
		$output = shell_exec("tasklist /FI \"PID eq $pid\" 2>nul");
		return (strpos($output, (string)$pid) !== false);
	} else {
		return (posix_kill($pid, 0));
	}
}
function killExec() {
	global $config;
	$pid = $config->getPid();
	if ($pid == 0) {
		return false;
	}

	if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
		shell_exec("taskkill /PID $pid /F");
	} else {
		posix_kill($pid, 9);
	}
	$config->setPid(0);
	return true;
}

$config = new Config();
$config->carregar();
?>