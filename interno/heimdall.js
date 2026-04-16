const divTela = document.getElementById("tela");
const divListaRecursos = document.getElementById("listaRecursos");
const btnServidor = document.getElementById("btnServidor");
const btnAdicionarRecurso = document.getElementById("btnAdicionarRecurso");

var janelaMovendo = null;
var janelaRedimensionando = null;
var redimensionamentoDirecao = "";
var dispositivoMovendo = null;
var dispositivoSemRegistro = null;
var mapaSemRegistro = null;
var usuarioX = -1;
var usuarioY = -1;
var mapas = [];
var menuContextoExibido = null;
var formId = 0;

class Janela {
	constructor(_titulo, _tamX = -1, _tamY = -1) {
		this.tamMinX = window.width / 2;
		this.tamMinY = window.height / 2;
		this.tamX = _tamX;
		this.tamY = _tamY;

		this.elJanela = document.createElement("div");
		this.elJanela.classList.add("janela");
		
		this.elMenu = document.createElement("div");
		this.elMenu.classList.add("menu");
		this.elMenu.onmousedown = (_e) => {
			janelaMovendo = this;
			this.elJanela.offsetX = _e.clientX - this.elJanela.offsetLeft;
			this.elJanela.offsetY = _e.clientY - this.elJanela.offsetTop;
		}
		
		this.elTitulo = document.createElement("p");
		this.elTitulo.textContent = _titulo;
		
		this.elEspacador = document.createElement("hr");
		
		this.elBotaoFechar = document.createElement("button");
		this.elBotaoFechar.classList.add("fechar");
		this.elBotaoFechar.textContent = "X";
		this.elBotaoFechar.onclick = () => this.fecharJanela();
		
		this.elMenu.appendChild(this.elTitulo);
		this.elMenu.appendChild(this.elEspacador);
		this.elMenu.appendChild(this.elBotaoFechar);
		this.elJanela.appendChild(this.elMenu);

		this.elRedimensionadores = [
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div")
		];
		this.elRedimensionadores.forEach((el, index) => {
			el.classList.add("redimensionador");
			el.classList.add(`r${index}`);
			this.elJanela.appendChild(el);
		});
		for (let i = 0; i < 8; i++) {
			this.elRedimensionadores[i].onmousedown = (_e) => {
				janelaRedimensionando = this;
				redimensionamentoDirecao = "";
				let _direcao = i;
				if (_direcao === 0 || _direcao === 1 || _direcao === 4) {
					redimensionamentoDirecao += "n";
				}
				if (_direcao === 1 || _direcao === 2 || _direcao === 5) {
					redimensionamentoDirecao += "e";
				}
				if (_direcao === 2 || _direcao === 3 || _direcao === 6) {
					redimensionamentoDirecao += "s";
				}
				if (_direcao === 3 || _direcao === 0 || _direcao === 7) {
					redimensionamentoDirecao += "w";
				}
				this.elJanela.offsetX = _e.clientX - this.elJanela.offsetLeft;
				this.elJanela.offsetY = _e.clientY - this.elJanela.offsetTop;
				//console.log("OffsetX: " + this.elJanela.offsetX + " | OffsetY: " + this.elJanela.offsetY);
			}
		}
		this.reposicionarJanela();
		this.funcCallBackFechar = ()=>{};
	}
	moverJanela(_e) {
		let novaTopo = _e.clientY - this.elJanela.offsetY;
		let novaEsquerda = _e.clientX - this.elJanela.offsetX;
		if (novaEsquerda < 0) {
			novaEsquerda = 0;
		}
		if (novaTopo < 0) {
			novaTopo = 0;
		}
		if (novaEsquerda + this.elJanela.offsetWidth > window.innerWidth) {
			novaEsquerda = window.innerWidth - this.elJanela.offsetWidth;
		}
		if (novaTopo + this.elJanela.offsetHeight > window.innerHeight) {
			novaTopo = window.innerHeight - this.elJanela.offsetHeight;
		}
		this.elJanela.style.top = novaTopo + "px";
		this.elJanela.style.left = novaEsquerda + "px";
	}
	redimensionarJanela(_e,_largura = -1,_altura = -1) {
		let novaLargura = this.elJanela.offsetWidth;
		let novaAltura = this.elJanela.offsetHeight;
		let novaEsquerda = this.elJanela.offsetLeft;
		let novaTopo = this.elJanela.offsetTop;
		if (redimensionamentoDirecao.includes("n")) {
			novaTopo = _e.clientY;
			novaAltura = this.elJanela.offsetHeight + (this.elJanela.offsetTop - novaTopo);
		}
		if (redimensionamentoDirecao.includes("e")) {
			novaLargura = _e.clientX - this.elJanela.offsetLeft;
		}
		if (redimensionamentoDirecao.includes("s")) {
			novaAltura = _e.clientY - this.elJanela.offsetTop;
		}
		if (redimensionamentoDirecao.includes("w")) {
			novaEsquerda = _e.clientX;
			novaLargura = this.elJanela.offsetWidth + (this.elJanela.offsetLeft - novaEsquerda);
		}
		novaAltura -= 2;
		novaLargura -= 2;
		if (novaEsquerda < 0) {
			novaEsquerda = 0;
		}
		if (novaTopo < 0) {
			novaTopo = 0;
		}
		if (novaLargura < this.tamMinX) {
			novaLargura = this.tamMinX;
		}
		if (novaAltura < this.tamMinY) {
			novaAltura = this.tamMinY;
		}
		if (novaEsquerda + novaLargura > window.innerWidth) {
			if (novaEsquerda > window.innerWidth - this.tamMinX) {
				novaEsquerda = window.innerWidth - this.tamMinX;
			}
			novaLargura = window.innerWidth - novaEsquerda;
		}
		if (novaTopo + novaAltura > window.innerHeight) {
			if (novaTopo > window.innerHeight - this.tamMinY) {
				novaTopo = window.innerHeight - this.tamMinY;
			}
			novaAltura = window.innerHeight - novaTopo;
		}
		this.elJanela.style.top = novaTopo + "px";
		this.elJanela.style.height = novaAltura + "px";
		this.elJanela.style.left = novaEsquerda + "px";
		this.elJanela.style.width = novaLargura + "px";
	}

	pararMoverJanela() {
		janelaMovendo = null;
	}
	pararRedimensionarJanela() {
		janelaRedimensionando = null;
		redimensionamentoDirecao = "";
	}
	exibirJanela() {
		//console.log("Janela exibida");
		document.body.appendChild(this.elJanela);
		this.registrarNovoTamanhoMin();
		this.posicionarNoCentro();
	}
	fecharJanela() {
		document.body.removeChild(this.elJanela);
		this.funcCallBackFechar();
	}
	reposicionarJanela() {
		this.elJanela.style.left = (window.innerWidth / 4) + "px";
		this.elJanela.style.top = (window.innerHeight / 4) + "px";
	}
	posicionarNoCentro() {
		this.elJanela.style.left = (window.innerWidth / 2 - this.elJanela.offsetWidth / 2) + "px";
		this.elJanela.style.top = (window.innerHeight / 2 - this.elJanela.offsetHeight / 2) + "px";
	}
	registrarNovoTamanhoMin() {
		if (this.tamX == -1) {
			this.tamMinX = this.elJanela.offsetWidth;
		} else {
			this.tamMinX = this.tamX;
			this.elJanela.style.width = this.tamX;
		}
		if (this.tamY == -1) {
			this.tamMinY = this.elJanela.offsetHeight;
		} else {
			this.tamMinY = this.tamY;
			this.elJanela.style.height = this.tamY;
		}
	}
}

class MenuContexto {
	constructor() {
		this.elMenuContexto = document.createElement("div");
		this.elMenuContexto.classList.add("menu-contexto");
		this.exibiu = false;
	}
	adicionarItem(_texto, _acao) {
		const elItem = document.createElement("button");
		elItem.textContent = _texto;
		elItem.onclick = ()=>{
			_acao();
			this.esconderMenuContexto();
		}
		this.elMenuContexto.appendChild(elItem);
	}
	adicionarDivisa() {
		const elDivisa = document.createElement("hr");
		this.elMenuContexto.appendChild(elDivisa);
	}
	exibirMenuContexto(_x, _y) {
		//console.log("Exibiu menu de contexto");
		this.elMenuContexto.style.left = _x + "px";
		this.elMenuContexto.style.top = _y + "px";
		document.body.appendChild(this.elMenuContexto);
		menuContextoExibido = this;
	}
	esconderMenuContexto() {
		this.exibiu = false;
		//console.log("Escondeu menu de contexto");
		if (document.body.contains(this.elMenuContexto)) {
			document.body.removeChild(this.elMenuContexto);
		}
		menuContextoExibido = null;
	}
}

class Mapa {
	constructor(_id,_nome,_descricao="", _pingFreq = 5, _pingTimeout = 1000, _dispDown = 3) {
		this.id = _id;
		this.nome = _nome;
		this.descricao = _descricao;
		this.pingFreq = parseInt(_pingFreq);
		this.pingTimeout = parseInt(_pingTimeout);
		this.dispDown = parseInt(_dispDown);
		this.elTelaMapa = document.createElement("div");
		this.elTelaMapa.classList.add("tela-mapa");
		
		this.elMenu = document.createElement("div");
		this.elMenu.classList.add("menu");
		this.elTitulo = document.createElement("p");
		this.elTitulo.textContent = _nome;

		this.elBtnPropriedades = document.createElement("button");
		this.elBtnPropriedades.textContent = "Propriedades";
		this.elBtnPropriedades.onclick = ()=>{
			this.exibirJanelaPropriedades();
		}
		this.elBtnFecharMapa = document.createElement("button");
		this.elBtnFecharMapa.textContent = "X";
		this.elBtnFecharMapa.onclick = ()=>{
			this.ocultarMapaDaTela();
		}

		this.elMenu.appendChild(this.elTitulo);
		this.elMenu.appendChild(this.elBtnPropriedades);
		this.elMenu.appendChild(document.createElement("hr"));
		this.elMenu.appendChild(this.elBtnFecharMapa);
		this.elMapa = document.createElement("div");
		this.elMapa.classList.add("mapa");

		this.menuContexto = new MenuContexto();
		this.menuContexto.adicionarItem("📟 Adicionar dispositivo...", () => janela_AdicionarDispositivo(this));
		this.menuContexto.adicionarDivisa();
		this.menuContexto.adicionarItem("Propriedades...", () => this.exibirJanelaPropriedades());
		this.elMapa.oncontextmenu = (e) => {
			e.preventDefault();
			usuarioX = e.clientX;
			usuarioY = e.clientY;
			this.menuContexto.exibirMenuContexto(usuarioX, usuarioY);
		}
		this.elMapa.onmousedown = (e) => {
			if (menuContextoExibido != null) {
				menuContextoExibido.esconderMenuContexto();
			}
		}
		
		this.elTelaMapa.appendChild(this.elMenu);
		this.elTelaMapa.appendChild(this.elMapa);

		this.dispositivos = [];
		mapas.push(this);

		if (this.id == -1) {
			mapa_registrarNovo(this);
		}

		this.recursoMapa = listaMapas.adicionarRecurso(this.nome, () => {
			this.exibirMapaNaTela();
		});
		this.menuContextoRecurso = new MenuContexto();
		this.menuContextoRecurso.adicionarItem("Propriedades...", () => this.exibirJanelaPropriedades());
		this.recursoMapa.elRecurso.oncontextmenu = (e) => {
			e.preventDefault();
			this.menuContextoRecurso.exibirMenuContexto(e.clientX,e.clientY);
		}
	}
	exibirMapaNaTela() {
		divTela.appendChild(this.elTelaMapa);
		enviarMensagem(`\\mapa ${this.id}`);
	}
	ocultarMapaDaTela() {
		this.elTelaMapa.remove();
	}
	adicionarDispositivo(_dispositivo) {
		this.dispositivos.push(_dispositivo);
		this.elMapa.appendChild(_dispositivo.elDispositivo);
	}
	dispositivo_Id(_id) {
		let retorno = null;
		this.dispositivos.forEach(_dispositivo => {
			if (_dispositivo.id == _id) {
				retorno = _dispositivo;
			}
		});
		return retorno;
	}
	exibirJanelaPropriedades() {
		let janela = new Janela(`Propriedades do mapa ID ${this.id}`);
		let formMapa = new Form(`Confirmar`);
		janela.elJanela.appendChild(formMapa.elForm);

		let inputNome = formMapa.adicionarCampoTexto("Nome:","Nome do mapa",{required:true,value:this.nome});
		let inputDescricao = formMapa.adicionarCampoArea("Descrição:","Descrição informativa sobre o mapa",{value:this.descricao});
		let inputPingFreq = formMapa.adicionarCampoRange("Frequência do ping em segundos para os dispositivos:",0,600,{multiSteps:[1,10,60],value:this.pingFreq});
		let inputPingTimeout = formMapa.adicionarCampoRange("Tempo de timeout em milissegundos para os pings:",200,10000,{multiSteps:[200,1000],step:100,value:this.pingTimeout});
		let inputDownQtd = formMapa.adicionarCampoRange("Quantidade de pings para registrar downtime:",1,10,{multiSteps:[1],value:this.dispDown});
		
		formMapa.adicionarFuncaoSubmit(()=>{
			let atributos = [];
			this.nome = prepararAtributo(atributos,"n",inputNome.value,this.nome);
			this.descricao = prepararAtributo(atributos,"d",inputDescricao.value,this.descricao);
			this.pingFreq = prepararAtributo(atributos,"pFreq",inputPingFreq.value,this.pingFreq);
			this.pingTimeout = prepararAtributo(atributos,"pTimeout",inputPingTimeout.value,this.pingTimeout);
			this.dispDown = prepararAtributo(atributos,"dispDown",inputDownQtd.value,this.dispDown);
			enviarMensagem(`\\update mapa ${this.id} ${atributos.join(" ")}`);
			janela.fecharJanela();
		});
		janela.exibirJanela();
	}
}

class Dispositivo {
	constructor(_id,_mapa,_endereco,_nome = "",_x = 0,_y = 0) {
		this.id = _id;
		this.endereco = _endereco;
		this.nome = "";
		this.mapa = _mapa;
		this.x = _x;
		this.y = _y;
		this.status = 0;
		if (typeof this.mapa == "number") {
			this.mapa = mapa_Id(this.mapa);
		}
		this.elDispositivo = document.createElement("div");
		this.elDispositivo.classList.add("dispositivo");
		this.posicionarDispositivo(_x,_y);
		this.elDispositivo.onmousedown = (_e) => {
			dispositivoMovendo = this;
			this.elDispositivo.offsetX = _e.clientX - this.elDispositivo.offsetLeft;
			this.elDispositivo.offsetY = _e.clientY - this.elDispositivo.offsetTop;
		}

		this.nomearElemento(_nome);

		if (this.id == -1) {
			dispositivo_registrarNovo(this);
		}

		this.mapa.adicionarDispositivo(this);
		//console.log("Dispositivo criado!");
	}
	posicionarDispositivo(_x,_y) {
		if (_x < 0) {
			_x = 0;
		}
		if (_y < 0) {
			_y = 0;
		}
		this.elDispositivo.style.top = _y + "px";
		this.elDispositivo.style.left = _x + "px";
	}
	moverDispositivo(_e) {
		let novaTopo = _e.clientY - this.elDispositivo.offsetY;
		let novaEsquerda = _e.clientX - this.elDispositivo.offsetX;
		this.posicionarDispositivo(novaEsquerda,novaTopo);
	}
	pararMoverDispositivo() {
		dispositivoMovendo = null;
		if (
			(this.x != this.elDispositivo.offsetLeft)
			|| (this.y != this.elDispositivo.offsetTop)
		) {
			this.x = this.elDispositivo.offsetLeft;
			this.y = this.elDispositivo.offsetTop;
			enviarMensagem(`\\update disp ${this.id} -p ${this.x} ${this.y}`);
		}
	}
	nomearElemento(_nome = "") {
		this.nome = _nome;
		if (this.nome == "") {
			this.nome = this.endereco;
		}
		this.elDispositivo.textContent = this.nome;
		this.elDispositivo.title = this.endereco;
	}
	informarUp() {
		this.elDispositivo.classList.remove("down");
		this.elDispositivo.classList.add("up");
		this.status = 1;
	}
	informarDown() {
		this.elDispositivo.classList.remove("up");
		this.elDispositivo.classList.add("down");
		this.status = -1;
	}
	informarDesativado() {
		this.elDispositivo.classList.remove("up");
		this.elDispositivo.classList.remove("down");
		this.status = 0;
	}
}

class ListaRecurso {
	constructor(_nome) {
		this.nome = _nome;
		this.recursos = [];

		this.elIndiceRecurso = document.createElement("div");
		this.elIndiceRecurso.classList.add("indiceRecurso");
		this.elIndiceRecurso.textContent = this.nome;
		this.elIndiceRecurso.addEventListener("click", () => {
			this.elIndiceRecurso.classList.toggle("expandir");
		});
		this.elListaRecurso = document.createElement("div");
		this.elListaRecurso.classList.add("listaRecurso");
		
		divListaRecursos.appendChild(this.elIndiceRecurso);
		divListaRecursos.appendChild(this.elListaRecurso);
	}
	adicionarRecurso(_nome,_funcao) {
		const recurso = new Recurso(_nome, _funcao);
		this.recursos.push(recurso);
		this.elListaRecurso.appendChild(recurso.elRecurso);
		return recurso;
	}
}

class Recurso {
	constructor(_nome,_funcao) {
		this.nome = _nome;

		this.elRecurso = document.createElement("div");
		this.elRecurso.classList.add("recurso");
		this.elRecurso.textContent = this.nome;

		this.elRecurso.onclick = _funcao;
	}
}

class Form {
	constructor(_submit = null) {
		this.id = `form${formId}`;
		formId++;
		this.elForm = document.createElement("form");
		this.elForm.id = this.id
		this.elForm.onsubmit = (e) => {
			e.preventDefault();
			this.elSubmit.click();
		};
		this.elBotoesForm = document.createElement("div");
		this.elBotoesForm.classList.add("botoes-form");
		
		this.elSubmit = document.createElement("button");
		this.elSubmit.textContent = _submit ? _submit : "Enviar";
		this.elSubmit.tabIndex = 0;
		this.elBotoesForm.appendChild(this.elSubmit);

		this.campos = [];
		
		this.elForm.appendChild(this.elBotoesForm);
	}
	adicionarCampoTexto(_label, _placeholder, _atributos = {}) {
		let elInput = this.criarCampo("text", _label, _placeholder, _atributos);
		return elInput;
	}
	adicionarCampoArea(_label, _placeholder, _atributos = {}) {
		let elInput = this.criarCampo("textarea", _label, _placeholder, _atributos);
		return elInput;
	}
	adicionarCampoRange(_label, _min, _max, _atributos = {}) {
		_atributos.min = _min;
		_atributos.max = _max;
		let elInput = this.criarCampo("range", _label, "", _atributos);
		let elInputNumber = this.criarInput("number", null, _atributos);
		for (const [chave, valor] of Object.entries(_atributos)) {
			switch (chave) {
				case "multiSteps":
					//console.log(valor);
					let datalistRange = document.createElement("datalist");
					datalistRange.id = elInput.id+"_data";
					elInput.setAttribute("list",datalistRange.id);
					let incremento = 0;
					for (let contador = _min; contador <= _max; contador+=valor[incremento]) {
						let novaOption = document.createElement("option");
						novaOption.value = contador;
						datalistRange.appendChild(novaOption);
						if (incremento < valor.length-1) {
							if (valor[incremento+1] == contador) {
								incremento++;
							}
						}
					}
					this.elCampo.appendChild(datalistRange);
					break;
				case "value":
					elInput.value = valor;
					elInputNumber.value = valor;
					break;
			}
		}
		elInput.addEventListener('input', ()=>{
			elInputNumber.value = elInput.value;
		});
		elInputNumber.addEventListener('input', ()=>{
			elInput.value = elInputNumber.value;
		});
		if (!elInput.hasAttribute("value")) {
			elInput.value = _min;
			elInputNumber.value = _min;
		}
		this.elCampo.insertBefore(elInputNumber,elInput);
		return elInput;
	}
	criarInput(_tipo, _placeholder = "", _atributos = {}) {
		let elInput = null;
		if (_tipo != "textarea") {
			elInput = document.createElement("input");
			elInput.type = _tipo;
		} else {
			elInput = document.createElement("textarea");
			if (_atributos.value != undefined) {
				elInput.textContent = _atributos.value;
			}
		}
		elInput.id = this.id+`input${this.campos.length}`;
		if (_placeholder!="") {
			elInput.placeholder = _placeholder;
		}
		switch (_tipo) {
			case "textarea":
				elInput.style.resize = "none";
				break;
		}
		for (const [chave, valor] of Object.entries(_atributos)) {
			elInput.setAttribute(chave, valor);
		}
		elInput.tabIndex = this.campos.length + 1;
		this.campos.push(elInput);
		this.elSubmit.tabIndex = this.campos.length + 1;
		return elInput;
	}
	criarCampo(_tipo, _label, _placeholder="", _atributos = {}) {
		this.elCampo = document.createElement("div");
		const elLabel = document.createElement("label");
		elLabel.textContent = _label;
		elLabel.setAttribute("for",this.id+`input${this.campos.length}`);
		var elInput = this.criarInput(_tipo, _placeholder, _atributos);
		this.elCampo.appendChild(elLabel);
		this.elCampo.appendChild(elInput);
		this.elForm.appendChild(this.elCampo);
		return elInput;
	}
	adicionarFuncaoSubmit(_funcao) {
		this.elSubmit.onclick = _funcao;
	}
}

//#region Janelas
function janela_AdicionarDispositivo(_mapa) {
	let janela = new Janela("Adicionar dispositivo ao mapa");
	let form = new Form("Adicionar");
	janela.elJanela.appendChild(form.elForm);
	
    let inputEndereco = form.adicionarCampoTexto("Host:", "Endereço IP ou FQDN", { required: "required" });
	
	form.adicionarFuncaoSubmit(() => {
		const endereco = inputEndereco.value.trim();
		if (endereco) {
			if (usuarioX >= 0 && usuarioY >= 0) {
				new Dispositivo(-1,_mapa,endereco,endereco,usuarioX,usuarioY);
			} else {
				new Dispositivo(-1,_mapa,endereco);
			}
			
			janela.fecharJanela();
		}
	});
	
	janela.exibirJanela();
	inputEndereco.focus();
}
function janela_ControleServidor() {
	let janela = new Janela("Controle do servidor do Heimdall",500);
	let pDescricao = document.createElement("p");
	pDescricao.textContent = "Para seu funcionamento, o Heimdall requer um servidor web que tenha o PHP instalado, com algumas extensões habilitadas. Assim, um script PHP permanece em execução a todo momento no servidor, e ela é responsável por realizar o monitoramento da rede em tempo real.";
	let fieldsetServidor = document.createElement("fieldset");
	let legendServidor = document.createElement("legend");
	legendServidor.textContent = "Especificações:";
	fieldsetServidor.appendChild(legendServidor);
	var erros = 0;
	var verificando = 0;
	
	let pLocal = document.createElement("p");
	if (window.location.origin == "file://") {
		pLocal.textContent = "❌ Não está em servidor web";
		pLocal.title = "Foi detectado que esta página que você está vendo atualmente não está em um servidor web.\nÉ fortemente recomendado que seja inserida em um servidor web, para que ela possa se comunicar diretamente com o serviço do Heimdall.";
		erros++;
	} else {
		pLocal.textContent = "✅ Em servidor web: "+window.location.hostname;
	}

	let pPHP = document.createElement("p");
	pPHP.textContent = "⏳ Verificando PHP...";
	verificando++;

	fetch("interno/servidor.php")
		.then(response => response.json())
		.then(data => {
			//console.log(data);
			dataServidor = data;

			const phpVersion = data.phpVersion || "desconhecida";
			const isPhp8 = phpVersion.startsWith("8");
			pPHP.textContent = `PHP ${phpVersion} instalado`;
			if (!isPhp8) {
				pPHP.textContent += " (recomenda-se PHP 8+)";
				pPHP.textContent = "⚠️ " + pPHP.textContent;
				pPHP.title = "Foi detectado que a versão do PHP não é a 8. Recomenda-se atualizar para a versão 8 ou superior para melhor compatibilidade.";
				erros++;
			} else {
				pPHP.textContent = "✅ " + pPHP.textContent;
			}

			// Verificar demais propriedades como extensões opcionais
			for (const [chave, valor] of Object.entries(data)) {
				if (chave !== 'phpVersion' && chave !== 'timestamp') {
					const pExtensao = document.createElement("p");
					if (valor) {
						pExtensao.textContent = `✅ Extensão ${chave} habilitada`;
					} else {
						pExtensao.textContent = `⚠️ Extensão ${chave} não encontrada`;
						pExtensao.title = `A extensão ${chave} não está disponível. Recursos que dependem desta extensão não funcionarão corretamente.`;
						erros++;
					}
					fieldsetServidor.appendChild(pExtensao);
				}
			}

			verificando--;
			atualizarErros();
		})
		.catch(erro => {
			verificando--;
			pPHP.textContent = "❌ PHP não instalado no servidor web";
			pPHP.title = "Não foi detectada a presença do PHP no servidor web. Certifique-se de que o PHP está instalado e configurado corretamente.";
			erros++;
			atualizarErros();
		});

	let pResultado = document.createElement("p");
	pResultado.textContent = "⏳ Analisando...";
	function atualizarErros() {
		if (erros > 0) {
			pResultado.textContent = "⚠️ Um ou mais itens precisam da sua atenção para que o Heimdall funcione corretamente. Passe o mouse por cima deles para ver uma descrição breve sobre o problema.";
		} else {
			if (verificando > 0) {
				pResultado.textContent = "⏳ Analisando...";
			} else {
				pResultado.textContent = "O Heimdall está pronto para funcionar.";
			}
		}
		janela.registrarNovoTamanhoMin();
		janela.posicionarNoCentro();
	}
	
	//console.log({window});
	fieldsetServidor.appendChild(pLocal);
	fieldsetServidor.appendChild(pPHP);
	
	janela.elJanela.appendChild(pDescricao);
	//janela.elJanela.appendChild(document.createElement("hr"));
	janela.elJanela.appendChild(fieldsetServidor);
	janela.elJanela.appendChild(pResultado);

	let divBotoesControle = document.createElement("div");
	divBotoesControle.classList.add("flex");
	let btnIniciarHeimdall = document.createElement("button");
	btnIniciarHeimdall.textContent = "Iniciar Heimdall";
	let btnPararHeimdall = document.createElement("button");
	btnPararHeimdall.textContent = "Parar Heimdall";
	let divStatusHeimdall = document.createElement("div");
	divStatusHeimdall.textContent = "⏳ Obtendo estado do Heimdal...";
	divBotoesControle.appendChild(btnIniciarHeimdall);
	divBotoesControle.appendChild(btnPararHeimdall);
	btnIniciarHeimdall.onclick = () => {
		fetch("interno/startExec.php", { signal: AbortSignal.timeout(1000) })
			.then(response => response.json())
			.then(data => console.log(data))
			.catch(erro => console.error(erro));
	};
	btnPararHeimdall.onclick = () => {
		fetch("interno/stopExec.php")
			.then(response => response.json())
			.then(data => console.log(data))
			.catch(erro => console.error(erro));
	};
	divBotoesControle.appendChild(divStatusHeimdall);

	var timerEstado = setInterval(()=>{
		fetch("interno/checkExec.php")
			.then(response => response.json())
			.then(data => {
				if (data.checkExec) {
					divStatusHeimdall.textContent = "✅ Heimdall em execução";
				} else {
					divStatusHeimdall.textContent = "❌ Heimdall parado";
				}
			})
			.catch(erro => {
				divStatusHeimdall.textContent = "⚠️ Erro ao verificar status";
				console.error(erro);
			});
	},1000);

	janela.funcCallBackFechar = ()=>{
		clearInterval(timerEstado);
	}

	janela.elJanela.appendChild(divBotoesControle);
	janela.exibirJanela();
}
function janela_AdicionarRecurso(_tipo) {
	let janela = new Janela(`Adicionar novo(a) ${_tipo}`);
	switch (_tipo) {
		case "mapa":
			let formMapa = new Form("Criar mapa");
			janela.elJanela.appendChild(formMapa.elForm);
			let inputNome = formMapa.adicionarCampoTexto("Nome:","Nome do mapa",{required:true});
			let inputDescricao = formMapa.adicionarCampoArea("Descrição:","Descrição informativa sobre o mapa");
			let inputPingFreq = formMapa.adicionarCampoRange("Frequência do ping em segundos para os dispositivos:",0,600,{multiSteps:[1,10,60],value:5});
			let inputPingTimeout = formMapa.adicionarCampoRange("Tempo de timeout em milissegundos para os pings:",200,10000,{multiSteps:[200,1000],step:100,value:1000});
			let inputDownQtd = formMapa.adicionarCampoRange("Quantidade de pings para registrar downtime:",1,10,{multiSteps:[1],value:3});
			formMapa.adicionarFuncaoSubmit(()=>{
				let novoMapa = new Mapa(-1,inputNome.value,inputDescricao.value,inputPingFreq.value,inputPingTimeout.value,inputDownQtd.value);
				janela.fecharJanela();
				novoMapa.exibirMapaNaTela();
			});
			break;
	}
	janela.exibirJanela();
}
//#endregion


//#region Funções e EventListeners
function mapa_Id(_id) {
	let retorno = null;
	mapas.forEach(_mapa => {
		if (_mapa.id == _id) {
			retorno = _mapa;
		}
	});
	return retorno;
}
function mapa_registrarNovo(_mapa) {
	mapaSemRegistro = _mapa;
	let atributos = [];
	prepararAtributo(atributos,"d",_mapa.descricao);
	prepararAtributo(atributos,"pFreq",_mapa.pingFreq);
	prepararAtributo(atributos,"pTimeout",_mapa.pingTimeout);
	prepararAtributo(atributos,"dispDown",_mapa.dispDown);
	enviarMensagem(`\\create mapa ${_mapa.nome} ${atributos.join(" ")}`);
}
function dispositivo_Id(_id) {
	let retorno = null;
	mapas.forEach(_mapa => {
		let obterId = _mapa.dispositivo_Id(_id);
		//console.log(_mapa);
		if (obterId != null) {
			retorno = obterId;
		}
	});
	return retorno;
}
function dispositivo_registrarNovo(_disp) {
	dispositivoSemRegistro = _disp;
	enviarMensagem(`\\create disp ${dispositivoSemRegistro.mapa.id} ${dispositivoSemRegistro.endereco} -n ${dispositivoSemRegistro.nome} -p ${dispositivoSemRegistro.x} ${dispositivoSemRegistro.y}`);
}
function prepararAtributo(_array,_nomeAtributo,_valorNovo,_valorAtual = null) {
	if (_valorAtual != null) {
		if (_valorNovo != _valorAtual) {
			_array.push(`-${_nomeAtributo}`,_valorNovo);
		}
	} else {
		_array.push(`-${_nomeAtributo}`,_valorNovo);
	}
	return _valorNovo;
}

document.addEventListener("mousemove", (_e) => {
	if (janelaMovendo) {
		janelaMovendo.moverJanela(_e);
	}
	if (janelaRedimensionando) {
		janelaRedimensionando.redimensionarJanela(_e);
	}
	if (dispositivoMovendo) {
		dispositivoMovendo.moverDispositivo(_e);
	}
});
document.addEventListener("mouseup", (_e2) => {
	if (janelaMovendo) {
		janelaMovendo.pararMoverJanela();
	}
	if (janelaRedimensionando) {
		janelaRedimensionando.pararRedimensionarJanela();
	}
	if (dispositivoMovendo) {
		dispositivoMovendo.pararMoverDispositivo();
	}
	if (menuContextoExibido != null) {
		//console.log(_e2.target.parentElement);
		//console.log(menuContextoExibido.elMenuContexto);
		if (_e2.target.parentElement != menuContextoExibido.elMenuContexto) {
			menuContextoExibido.esconderMenuContexto();
		}
	}
});
//#endregion


//#region Comunicação com servidor
var socket = null;
var meuId = 0;
var conectadoServidor = false;

function iniciarWebSocket(_porta,_endereco,_seguro) {
	let protocolo = (_seguro?"wss":"ws");
	let novoSocket = new WebSocket(`${protocolo}://${_endereco}:${_porta}`);
	novoSocket.onopen = () => {
		//console.log("Conectado ao servidor");
		atualizarBotaoServidor();
	};
	novoSocket.onmessage = (evento) => {
		console.log("<== RECEBIDO\n", evento.data);
		jsonServer = JSON.parse(evento.data);
		switch (jsonServer.tipo) {
			case "welcome":
				meuId = jsonServer.conteudo.resourceId;
				enviarMensagem("\\thnx");
				enviarMensagem("\\recursos");
				break;
			case "recursos":
				jsonServer.mapas.forEach(_mapa => {
					let mapa = mapa_Id(_mapa.id);
					if (mapa == null) {
						mapa = new Mapa(_mapa.id,_mapa.nome,_mapa.descricao);
					}
					mapa.pingFreq = _mapa.pingFreq;
					mapa.pingTimeout = _mapa.pingTimeout;
					mapa.dispDown = _mapa.dispDown;
				});
				break;
			case "mapa":
				jsonServer.dispositivos.forEach(_dispositivo => {
					let mapaId = mapa_Id(_dispositivo.mapa);
					if (mapaId !== null) {
						let dispositivo = mapaId.dispositivo_Id(_dispositivo.id);
						if (dispositivo == null) {
							dispositivo = new Dispositivo(_dispositivo.id,_dispositivo.mapa,_dispositivo.endereco,_dispositivo.nome,_dispositivo.pos[0],_dispositivo.pos[1]);
						}
						dispositivo.endereco = _dispositivo.endereco;
						dispositivo.posicionarDispositivo(_dispositivo.pos[0],_dispositivo.pos[1]);
						dispositivo.nomearElemento(_dispositivo.nome);
						if (_dispositivo.status == 0) {
							dispositivo.informarUp();
						} else if (_dispositivo.status > 0) {
							dispositivo.informarDown();
						}
					} else {
						//console.log(`Não é este o mapa solicitado: ${_dispositivo.mapa}`);
					}
				})
				break;
			case "reg":
				if (dispositivoSemRegistro != null) {
					dispositivoSemRegistro.id = jsonServer.dispositivo;
					dispositivoSemRegistro = null;
				}
				if (mapaSemRegistro != null) {
					mapaSemRegistro.id = jsonServer.mapa;
					mapaSemRegistro = null;
				}
				break;
			case "up":
				var dispositivoUp = dispositivo_Id(jsonServer.dispositivo);
				if (dispositivoUp != null) {
					dispositivoUp.informarUp();
				}
				break;
			case "down":
				var dispositivoDown = dispositivo_Id(jsonServer.dispositivo);
				if (dispositivoDown != null) {
					dispositivoDown.informarDown();
				}
				break;
		}
	};
	novoSocket.onerror = (erro) => {
		console.error("Erro na conexão:", erro);
		atualizarBotaoServidor();
	};
	novoSocket.onclose = () => {
		//console.log("Desconectado do servidor");
		atualizarBotaoServidor();
		setTimeout(()=>{
			//console.log(`Tentando novamente reconectar a ${_endereco}:${_porta}...`);
			conectarServidor(_porta,_endereco,_seguro);
		},5000);
	};
	return novoSocket;
}

function conectarServidor(_porta,_endereco="localhost",_seguro=true) {
	try {
		socket = iniciarWebSocket(_porta,_endereco,_seguro);
	} catch(_erro) {
		console.error("Falha ao conectar no servidor:",_erro);
		setTimeout(()=>{
			//console.log(`Tentando novamente reconectar a ${_endereco}:${_porta}...`);
			conectarServidor(_porta,_endereco,_seguro);
		},5000);
	}
}

var mensagens = [];
function enviarMensagem(_texto) {
	mensagens.push(_texto);
};
function _monitorSend() {
	if (mensagens.length > 0) {
		if (socket.readyState === WebSocket.OPEN) {
			let mensagem = mensagens.shift();
			//console.log("ENVIANDO ==>\n", mensagem);
			socket.send(mensagem);
		}
	}
}
setInterval(_monitorSend, 100);
function atualizarBotaoServidor() {
	if (
		(socket!==null)
		&& (socket.readyState == 1)
	) {
		//console.log(socket);
		btnServidor.classList.add("ok");
	} else {
		btnServidor.classList.remove("ok");
	}
}
//#endregion


listaMapas = new ListaRecurso("Mapas");
menuContextoRecursos = new MenuContexto();
menuContextoRecursos.adicionarItem("🗺️ Novo mapa...",()=>{
	janela_AdicionarRecurso("mapa");
});
btnAdicionarRecurso.onclick = (_e)=>{
	_e.preventDefault();
	menuContextoRecursos.exibirMenuContexto(_e.clientX,_e.clientY);
}
//let mapaTeste = new Mapa("Mapa de teste");
//listaMapas.adicionarRecurso(mapaTeste.nome, () => {
//	mapaTeste.exibirMapaNaTela();
//});
//mapaTeste.exibirMapaNaTela();

conectarServidor(8080,"localhost", false);
//new Dispositivo(mapaTeste, "192.168.1.1", 100, 100);