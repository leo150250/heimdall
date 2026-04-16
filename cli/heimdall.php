<?php
$path = "../";
$server = null;
$clientes = array($server);
$comm = null;
require_once($path."interno/estrutura.php");

/*
if ($config->getPid() != 0) {
	echo "Servidor já em execução com PID {$config->getPid()}. Encerrando processo antigo...\n";
	if (stripos(php_uname('s'), 'win')>-1) {
		exec("taskkill /F /PID {$config->getPid()}");
	} else {
		exec("kill -9 {$config->getPid()}");
	}
	sleep(1);
	$config->setPid(0);
}*/
if (checkExec()) {
	echo "Servidor já em execução com PID {$config->getPid()}. Encerrando processo antigo...\n";
	killExec();
}


class Comm {
	protected $clients;

	public function __construct() {
		$this->clients = array();
	}

	public function onOpen($conn) {
		$this->clients[(int)$conn->resourceId] = $conn;
		echo "Nova conexão: {$conn->resourceId}\n";
		$conn->send(json_encode([
			'tipo' => 'welcome',
			'conteudo' => [
				'resourceId' => $conn->resourceId
			]
		]));
		return true;
	}

	public function onMessage($from, $msg) {
		global $recursos;
		if (strpos($msg, '\\') === 0) {
			// Se tiver \ no início, Interpretar como comando ao servidor
			$parts = explode(' ', substr($msg, 1));
			$command = $parts[0];
			$args = array_slice($parts, 1);
			echo sprintf("Comando recebido de %d: %s\n", $from->resourceId, $msg);
			switch ($command) {
				case "thnx":
					echo "Conexão {$from->resourceId} está acordada e ativa.\n";
					$novoCliente = new Cliente("Cliente {$from->resourceId}");
					$novoCliente->conexao = $from;
					$from->cliente = $novoCliente;
					break;
				case "recursos":
					echo "Conexão {$from->resourceId} solicitou os recursos.\n";
					$resposta = new stdClass();
					$resposta->tipo = "recursos";
					$resposta->mapas = [];
					foreach ($recursos->mapas as $_mapa) {
						array_push($resposta->mapas, $_mapa->json());
					}
					$from->send(json_encode($resposta));
					break;
				case "mapa":
					$idMapa = $args[0];
					echo "Conexão {$from->resourceId} solicitou mapa $idMapa.\n";
					$resposta = new stdClass();
					$resposta->tipo = "mapa";
					$dispositivosMapa = array_filter($recursos->dispositivos, function($item) use ($idMapa) {
						return $item->mapa->id == $idMapa;
					});
					$resposta->dispositivos = [];
					foreach ($dispositivosMapa as $_dispositivo) {
						$jsonDispositivo = $_dispositivo->json();
						$jsonDispositivo->status = $_dispositivo->status;
						array_push($resposta->dispositivos, $jsonDispositivo);
					}
					$from->send(json_encode($resposta));
					break;
				case "create":
					switch ($args[0]) {
						case "disp":
							$idMapa = $args[1];
							$endereco = $args[2];
							$mapaObj = array_filter($recursos->mapas, function($m) use ($idMapa) {
								return $m->id == $idMapa;
							});
							$mapaObj = array_shift($mapaObj);
							if (!$mapaObj) {
								echo "Mapa $idMapa não encontrado.\n";
								break;
							}
							$novoNome = "";
							$novoX = 0;
							$novoY = 0;
							
							for ($i = 3; $i < count($args); $i++) {
								switch ($args[$i]) {
									case "-n":
										$novoNome = $args[$i + 1];
										$i++;
										break;
									case "-p":
										$novoX = (int)$args[$i + 1];
										$novoY = (int)$args[$i + 2];
										$i += 2;
										break;
								}
							}

							$novoDispositivo = new Dispositivo(-1,$mapaObj,$novoNome,$endereco,$novoX,$novoY);
							
							$nextId = $recursos->proximoIdDisp();
							$novoDispositivo->id = $nextId;

							$recursos->salvar();
							$resposta = new stdClass();
							$resposta->tipo = "reg";
							$resposta->dispositivo = $nextId;
							$from->send(json_encode($resposta));
							break;
						case "mapa":
							$novoNome = $args[1];
							$novoDesc = "";
							$novoPingFreq = 5;
							$novoPingTimeout = 1000;
							$novoDispDown = 3;

							for ($i = 2; $i < count($args); $i++) {
								switch ($args[$i]) {
									case "-d":
										$novoDesc = $args[$i + 1];
										$i++;
										break;
									case "-pFreq":
										$novoPingFreq = (int)$args[$i + 1];
										$i++;
										break;
									case "-pTimeout":
										$novoPingTimeout = (int)$args[$i + 1];
										$i++;
										break;
									case "-dispDown":
										$novoDispDown = (int)$args[$i + 1];
										$i++;
										break;
								}
							}

							$novoMapa = new Mapa(-1,$novoNome, $novoDesc);
							$novoMapa->pingFreq = $novoPingFreq;
							$novoMapa->pingTimeout = $novoPingTimeout;
							$novoMapa->dispDown = $novoDispDown;

							$nextId = $recursos->proximoIdMapa();
							$novoMapa->id = $nextId;

							$recursos->salvar();
							$resposta = new stdClass();
							$resposta->tipo = "reg";
							$resposta->mapa = $nextId;
							$from->send(json_encode($resposta));
							break;
						default:
							echo "Comando create desconhecido: {$args[0]}\n";
					}
					break;
				case "update":
					switch ($args[0]) {
						case "disp":
							$idDispositivo = $args[1];
							$updateDispositivo = array_filter($recursos->dispositivos, function($item) use ($idDispositivo) {
								return $item->id == $idDispositivo;
							});
							//print_r($updateDispositivo);
							$updateDispositivo = array_shift($updateDispositivo);
							for ($argumento = 2; $argumento < count($args) - 1; $argumento++) {
								switch ($args[$argumento]) {
									case "-p":
										$updateDispositivo->x=(int)$args[$argumento+1];
										$updateDispositivo->y=(int)$args[$argumento+2];
										$argumento+=2;
										break;
									default:
										echo "Argumento update desconhecido: {$args[$argumento]}\n";
								}
							}
							$recursos->salvar();
							break;
						case "mapa":
							$idMapa = $args[1];
							$updateMapa = array_filter($recursos->mapas, function($item) use ($idMapa) {
								return $item->id == $idMapa;
							});
							$updateMapa = array_shift($updateMapa);
							for ($argumento = 2; $argumento < count($args) - 1; $argumento++) {
								switch ($args[$argumento]) {
									case "-n":
										$updateMapa->nome=$args[$argumento+1];
										$argumento++;
										break;
									case "-d":
										$updateMapa->descricao=$args[$argumento+1];
										$argumento++;
										break;
									case "-pFreq":
										$updateMapa->pingFreq=(int)$args[$argumento+1];
										$argumento++;
										break;
									case "-pTimeout":
										$updateMapa->pingTimeout=(int)$args[$argumento+1];
										$argumento++;
										break;
									case "-dispDown":
										$updateMapa->dispDown=(int)$args[$argumento+1];
										$argumento++;
										break;
									default:
										echo "Argumento update desconhecido: {$args[$argumento]}\n";
								}
							}
							$recursos->salvar();
							break;
						default:
							echo "Comando update desconhecido: {$args[0]}\n";
					}
					break;
				default:
					echo "Comando desconhecido: $command\n";
					break;
			}
		} else {
			// Senão, interpretar como mensagem de chat
			/*
			$numRecv = count($this->clients) - 1;
			echo sprintf('Conexão %d enviou mensagem "%s" para %d outras conexões',
				$from->resourceId, $msg, $numRecv);
			foreach ($this->clients as $client) {
				if ($from !== $client) {
					$client->send(json_encode([
						"tipo"=>"msg",
						"conteudo"=>[
							"remetente"=>$from->resourceId,
							"msg"=>$msg]]));
				}
			}
			*/
		}
	}

	public function onClose($conn) {
		unset($this->clients[(int)$conn->resourceId]);
		echo "Conexão {$conn->resourceId} fechada\n";
	}

	public function onError($conn, $e) {
		echo "Erro: {$e->getMessage()}\n";
		$conn->close();
	}

	public function enviarMensagemTodos($msg) {
		foreach ($this->clients as $client) {
			$client->send(json_encode([
				"tipo"=>"msg",
				"conteudo"=>[
					"resourceId"=>-1,
					"msg"=>$msg
				]
			]));
		}
	}

	public function obterClientes() {
		return $this->clients;
	}

	public function informarUp($_idDispositivo) {
		foreach ($this->clients as $client) {
			$client->send(json_encode([
				"tipo"=>"up",
				"dispositivo"=>$_idDispositivo
			]));
		}
	}
	public function informarDown($_idDispositivo) {
		foreach ($this->clients as $client) {
			$client->send(json_encode([
				"tipo"=>"down",
				"dispositivo"=>$_idDispositivo
			]));
		}
	}
}
class Conexao {
	public $resourceId;
	public $socket;
	public $cliente;

	public function __construct($socket) {
		$this->socket = $socket;
		$this->resourceId = (int)$socket;
	}

	public function send($msg) {
		fwrite($this->socket, encodeMessage($msg));
	}

	public function close() {
		fclose($this->socket);
	}
}

function iniciarSala($_porta) {
	global $server, $clientes, $comm, $porta, $config;
	if ($_porta == 0) {
		$_porta = intval(readline("Digite o número da porta: "));
	}
	echo "Iniciando sala na porta $_porta...\n";
	$context = stream_context_create();
	$server = stream_socket_server("tcp://0.0.0.0:$_porta", $errno, $errstr, STREAM_SERVER_BIND | STREAM_SERVER_LISTEN, $context);
	if (!$server) {
		die("Falha ao iniciar a sala: $errstr ($errno)");
	}
	echo "Sala iniciada na porta $_porta.\n";
	$config->setPid(getmypid());
	$clientes = array($server);
	$comm = new Comm();
	$porta = $config->getPorta() != 0 ? $config->getPorta() : $_porta;
}
function checarConexoes() {
	global $clientes;
	$read = $clientes;
	$write = null;
	$except = null;

	if (stream_select($read, $write, $except, 0, 10) > 0) {
		verificarNovasConexoes($read);
		echo "Heartbeats: ".implode(', ', $read)."\n";
		foreach ($read as $conn) {
			heartBeat($conn);
		}
	}
}
function verificarNovasConexoes($_read) {
	global $server, $clientes, $comm, $porta;
	if (in_array($server, $_read)) {
		$conn = stream_socket_accept($server);
		if ($conn) {
			$connection = new Conexao($conn);
			$clientes[] = $conn;

			// Perform WebSocket handshake
			$headers = fread($conn, 1024);
			perform_handshaking($headers, $conn, 'localhost', $porta);

			$comm->onOpen($connection);
		}
		unset($_read[array_search($server, $_read)]);
	}
}
function heartBeat($_conn) {
	global $comm, $clientes, $server;
	//echo "Heartbeat ".$_conn."\n");
	if ($_conn === $server) {
		//echo "Socket do servidor.\n");
		return;
	}
	$msg = fread($_conn, 1024);
	if ($msg === false || $msg === '') {
		$connection = new Conexao($_conn);
		$comm->onClose($connection);
		fclose($_conn);
		unset($clientes[array_search($_conn, $clientes)]);
	} else {
		$decoded_msg = unmask($msg);
		$connection = new Conexao($_conn);
		$comm->onMessage($connection, $decoded_msg);
	}
}
function enviarMensagemTodos($mensagem) {
	global $clientes;
	foreach ($clientes as $cliente) {
		enviarMensagem($cliente, $mensagem);
	}
}
function checarPing() {
	global $recursos;
	foreach ($recursos->mapas as $_mapa) {
		$_mapa->checarPing();
	}
}

iniciarSala(8080, "localhost", false);
while (true) {
	checarConexoes();
	checarPing();
	//checarDesconexoes();
	//receberMensagens();
	//enviarMensagens();
}
?>