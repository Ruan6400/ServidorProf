const express = require('express');
const path = require('path');
const multer = require('multer');
const {Pool} = require('pg');
require('dotenv').config();

let idprof;
let nomeprof;

//criação do objeto que vai gerenciar as apis
const app = express();

//preparando o express para receber as informações de login
app.use(express.urlencoded({extended:true}));

//armazenamento de arquivos em buffer para enviar
const modoDeArmazenamento = multer.memoryStorage();
const upload = multer({storage:modoDeArmazenamento});

//dados do banco ocultos por segurança
const dadosBd = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    port:process.env.DB_PORT,
    host:process.env.DB_HOST
}

//conexão ao banco de dados
const pool = new Pool(dadosBd);

async function CriarBanco() {
    console.log("conectando ao banco de dados...");
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS professor(
                id SERIAL PRIMARY KEY,
                senha INT NOT NULL,
                nome VARCHAR(50)
            );
            CREATE TABLE IF NOT EXISTS arquivos(
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100),
                tipo  VARCHAR(50),
                dados BYTEA,
                professor_id INT NOT NULL,
                CONSTRAINT fk_professor FOREIGN KEY (professor_id) REFERENCES professor(id)
            );`)
            console.log("Banco conectado com sucesso");
    }catch(erro){
        console.error(erro);
    }
}

//Validar login
app.post('/login',async(req,res)=>{
    try{
        const {senha,nome} = req.body;
        const consulta = await pool.query("SELECT * FROM professor WHERE nome = $1;",[nome]);
        if(consulta.rows.length === 0|| consulta.rows[0].senha != senha){
            res.send(`
                <script>
                    window.location.assign("http://localhost:5500/erro.html")
                </script>`)
        }else{
        	console.log(consulta.rows);
		const dados = {nome:consulta.rows[0].nome,id:consulta.rows[0].id};

		res.send(`
			<script>
				window.location.assign("http://localhost:5500/paginaprof.html?id=${encodeURIComponent(JSON.stringify(dados))}")
			</script>`)
        }
        

    }catch(erro){
        console.error("Falha no login | "+erro);
    }
})

app.post('/upload',upload.single('arquivo'),async (req,res)=>{

    //Verificar se foi realmente enviado um arquivo
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo foi enviado.');
    }
	const {originalname,mimetype,buffer} = req.file;
	console.log(originalname);
	console.log(mimetype);
    try{
        
        const {id_professor} = req.body;
        await pool.query('INSERT INTO arquivos (nome,tipo,dados,professor_id) values($1,$2,$3,$4)'
        ,[originalname,mimetype,buffer,id_professor])
        console.log('arquivo enviado')
	res.send('seu arquivo foi enviado')
    }catch(erro){
        console.error("Erro no banco de dados | "+erro);
    }
})


app.get('/download/:id',async (req,res)=>{
	const consulta = await pool.query('SELECT * FROM arquivos WHERE id = $1',[req.params.id]);
	const arquivo = consulta.rows[0];
	if(!arquivo){
		console.log("não achei");
		return res.status(400).send("O arquivo solicitado não foi encontrado");
	}
    // Configurar o cabeçalho de resposta para download
    	 res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
    	 res.setHeader('Content-Type', arquivo.tipo);

    	// Enviar o arquivo
   	 res.send(arquivo.dados);
})

//Comando para criar a base de dados caso não exista
CriarBanco();

//comando para deixar o servidor ativo
app.listen(3000,'0.0.0.0',()=>{
    console.log('Conexão bem sucedida');
});
