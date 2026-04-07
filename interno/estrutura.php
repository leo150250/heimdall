<?php
if (!isset($path)) {
	$path = "../";
}
require_once($path."interno/funcoes.php");

class Recursos {
	public $mapas = [];
	public $dispositivos = [];
	public function __construct() {
		global $recursos;
		$recursos = $this;
		$this->carregar();
	}
	public function carregar() {
		global $path;
		try {
			if (!file_exists($path."interno/sys/recursos.json")) {
				$this->salvar();
			}
		} catch (Exception $e) {
			echo "Erro ao carregar recursos: ".$e->getMessage()."\n";
			return;
		}
		$this->mapas = [];
		$this->dispositivos = [];
		$jsonRecursos = json_decode(file_get_contents($path."interno/sys/recursos.json"));
		foreach ($jsonRecursos->mapas as $_mapa) {
			$novoMapa = new Mapa($_mapa->id,$_mapa->nome,$_mapa->descricao);
		}
		foreach ($jsonRecursos->dispositivos as $_dispositivo) {
			$novoDispositivo = new Dispositivo($_dispositivo->id,$_dispositivo->mapa,$_dispositivo->endereco,$_dispositivo->nome,$_dispositivo->pos[0],$_dispositivo->pos[1]);
		}
		echo "Recursos carregados.\n";
	}
	public function salvar() {
		global $path;
		$conteudo = new stdClass();
		$conteudo->mapas = [];
		$conteudo->dispositivos = [];
		if (count($this->mapas)==0) {
			echo "=== Iniciando mapa padrão do Heimdall ===\n";
			$mapaPadrao = new Mapa(0,"default","Mapa padrão inicial do Heimdall");
			$dispositivoPadrao = new Dispositivo(0,$mapaPadrao,"127.0.0.1","localhost",100,100);
		}
		foreach ($this->mapas as $_mapa) {
			array_push($conteudo->mapas,$_mapa->json());
		}
		foreach ($this->dispositivos as $_dispositivo) {
			array_push($conteudo->dispositivos,$_dispositivo->json());
		}
		file_put_contents($path."interno/sys/recursos.json",json_encode($conteudo,JSON_PRETTY_PRINT));
	}
	public function proximoId() {
		if (empty($this->dispositivos)) {
			return 0;
		}
		$ids = array_column($this->dispositivos, 'id');
		$maxId = max($ids);
		return $maxId + 1;
	}
}

class Mapa {
	public $id;
	public $nome;
	public $descricao = "";
	public $dispositivos = [];
	public $links = [];
	public $dispositivosEmTeste = [];
	public $pingFreq = 5;
	public $dispDown = 3;
	public $timestampPing = null;

	public function __construct($_id, $_nome, $_descricao = "") {
		global $recursos;
		$this->id = $_id;
		$this->nome = $_nome;
		$this->descricao = $_descricao;
		$this->timestampPing = date_create();
		array_push($recursos->mapas,$this);
	}

	public function json() {
		$resposta = new stdClass();
		$resposta->id = $this->id;
		$resposta->nome = $this->nome;
		$resposta->descricao = $this->descricao;
		return $resposta;
	}

	public function associarDispositivo($_dispositivo) {
		array_push($this->dispositivos,$_dispositivo);
	}

	public function checarPing() {
		foreach ($this->dispositivosEmTeste as $_dispositivo) {
			$_dispositivo->checarPing();
		}
		$now = date_create();
		$now->sub(new DateInterval('PT' . $this->pingFreq . 'S'));
		if ($now > $this->timestampPing) {
			echo "Verificando ping do mapa {$this->nome}: ".count($this->dispositivos)." dispositivos\n";

			foreach ($this->dispositivos as $_dispositivo) {
				$_dispositivo->checarPing();
			}

			$this->timestampPing = date_create();
			return true;
		}
		return false;
	}

	public function informarUp($_dispositivo) {
		global $comm;
		$comm->informarUp($_dispositivo->id);
	}

	public function informarDown($_dispositivo) {
		global $comm;
		$comm->informarDown($_dispositivo->id);
	}
}
class Dispositivo {
	public $id;
	public $nome;
	public $tipo;
	public $mapa;
	public $status = 0;
	public $pingProcess = null;
	public $pingStatus = null;

	public function __construct($_id, $_mapa, $_endereco, $_nome = "", $_x = 0, $_y = 0) {
		global $recursos;
		$this->id = $_id;
		$this->mapa = $_mapa;
		if (is_int($this->mapa)) {
			$this->mapa = mapa_Id($this->mapa);
		}
		$this->endereco = $_endereco;
		$this->nome = $_nome;
		$this->x = $_x;
		$this->y = $_y;
		array_push($recursos->dispositivos,$this);
		$this->mapa->associarDispositivo($this);
		$this->status = $this->mapa->dispDown;
	}

	public function json() {
		$resposta = new stdClass();
		$resposta->id = $this->id;
		$resposta->mapa = $this->mapa->id;
		$resposta->nome = $this->nome;
		$resposta->endereco = $this->endereco;
		$resposta->pos = [$this->x,$this->y];
		return $resposta;
	}

	public function checarPing() {
		if ($this->pingProcess === null) {
			// Iniciar ping em background
			$descriptors = array(
				0 => array("pipe", "r"),
				1 => array("pipe", "w"),
				2 => array("pipe", "w")
			);
			$this->pingProcess = proc_open("ping -n 1 -w 1000 " . escapeshellarg($this->endereco), $descriptors, $pipes);
			if ($this->pingProcess === false) {
				$this->pingStatus = false;
				$this->pingFalha();
				return;
			}
			$this->adicionarDeTeste();
		} else {
			// Verificar se o processo terminou
			$status = proc_get_status($this->pingProcess);
			if (!$status['running']) {
				$exitCode = $status['exitcode'];
				//print_r($status);
				proc_close($this->pingProcess);
				$this->pingProcess = null;
				if ($exitCode === 0) {
					$this->pingStatus = true;
					$this->pingSucesso();
				} else {
					$this->pingStatus = false;
					$this->pingFalha();
				}
				
			}
		}
	}

	public function pingSucesso() {
		//echo "Ping para {$this->endereco} sucesso\n";
		if ($this->status >= $this->mapa->dispDown) {
			$this->mapa->informarUp($this);
		}
		$this->status = 0;
		$this->removerDeTeste();
	}

	public function pingFalha() {
		//echo "Ping para {$this->endereco} falhou\n";
		if ($this->status == $this->mapa->dispDown) {
			$this->mapa->informarDown($this);
		}
		$this->status++;
		$this->removerDeTeste();
	}

	public function adicionarDeTeste() {
		array_push($this->mapa->dispositivosEmTeste,$this);
	}

	public function removerDeTeste() {
		$key = array_search($this, $this->mapa->dispositivosEmTeste, true);
		if ($key !== false) {
			array_splice($this->mapa->dispositivosEmTeste, $key, 1);
		}
	}
}

class Cliente {
	public $nome;
	public $conexao;

	public function __construct($nome) {
		$this->nome = $nome;
	}
}

function mapa_Id($_id) {
	global $recursos;
	$retorno = null;
	foreach ($recursos->mapas as $mapa) {
		if ($mapa->id === $_id) {
			$retorno = $mapa;
			break;
		}
	}
	return $retorno;
}

new Recursos();
?>