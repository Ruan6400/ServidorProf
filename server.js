const express = require('express');
const path = require('path');
const multer = require('multer');
const {Pool,Client} = require('pg');
require('dotenv').config();



//criação do objeto que vai gerenciar as apis
const app = express();

//preparando o express para receber as informações de login
app.use(express.urlencoded({extended:true}));
//preparando o servidor para requisições fetch
app.use((req,res,next)=>{
	res.header('Access-Control-Allow-Origin','*');
	res.header('Access-Control-Allow-Methods','GET,POST');
	res.header('Access-Control-Allow-Headers','Content-Type');
	next();
})



//armazenamento de arquivos em buffer para enviar
const modoDeArmazenamento = multer.memoryStorage();
const upload = multer({storage:modoDeArmazenamento});
const tratalogin = multer();



//dados do banco ocultos por segurança
const dadosBd = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    port:process.env.DB_PORT,
    host:process.env.DB_HOST
}

//Criação do banco de dados
async function CriaBanco() {
    const cliente = new Client({
        user:dadosBd.user,
        password:dadosBd.password,
        host:dadosBd.host,
        port:dadosBd.port,
    });
    try{
        await cliente.connect();
        const consulta = await cliente.query('SELECT datname FROM pg_database');
        const result = consulta.rows.filter(bd=>bd.datname == dadosBd.database)
        if (result.length == 0)
            await cliente.query('CREATE DATABASE adelia;')
        await cliente.end();

    }catch(erro){
        console.error('Deu merda | ',erro)
    }
}
async function CriarTabela() {
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






/////////////APIs////////////////////
//Validar login
app.post('/login',tratalogin.none(),async(req,res)=>{
    try{
	const {nome,senha} = req.body
        const consulta = await pool.query("SELECT * FROM professor WHERE nome = $1;",[nome]);
        if(consulta.rows.length === 0|| consulta.rows[0].senha != senha){
	    const erromsg = {message:"login ou senha incorretos"}
            res.send(JSON.stringify(erromsg))
        }else{
        	console.log(consulta.rows);
		const dados = {nome:consulta.rows[0].nome,id:consulta.rows[0].id};
		res.send(JSON.stringify(dados));
        }
    }catch(erro){
        console.error("Falha no login | "+erro);
    }
})

//upload
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
        await pool.query('INSERT INTO arquivos (nome,tipo,dados,professor_id,data_upload) values($1,$2,$3,$4,CURRENT_TIMESTAMP);'
        ,[originalname,mimetype,buffer,id_professor])
        console.log('arquivo enviado')
	res.send('seu arquivo foi enviado')
    }catch(erro){
        console.error("Erro no banco de dados | "+erro);
    }
})

//download
app.get('/download/:id',async (req,res)=>{
	const consulta = await pool.query('SELECT * FROM arquivos WHERE id = $1',[req.params.id]);
	const arquivo = consulta.rows[0];
	if(!arquivo){
		console.log("não achei");
		return res.status(400).send("O arquivo solicitado não foi encontrado");
	}
    // Configurar o cabeçalho de resposcd %SRV%
    // ta para download
    	 res.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
    	 res.setHeader('Content-Type', arquivo.tipo);

    	// Enviar o arquivo
   	 res.send(arquivo.dados);
     console.log('download feito')
})

//listar os 5 ultimos arquivos
app.get('/list/:id',async (req,res)=>{
	const consulta = await pool.query('SELECT nome,id FROM arquivos WHERE professor_id = $1 ORDER BY data_upload LIMIT 5;',[req.params.id])
    const resultado = {array:consulta.rows}
    res.send(resultado)
})






//INICIALIZAR SQL
//Comando para criar a base de dados caso não exista
CriaBanco()
const pool = new Pool(dadosBd);
CriarTabela();


//RODAR O SERVIDOR
//comando para deixar o servidor ativo
app.listen(3000,'0.0.0.0',()=>{
    console.log('Conexão bem sucedida');
});
