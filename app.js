const express = require('express');
const fs = require('fs')
const app = express();
const session = require('express-session')
const router = require('./routes/products')
const routerTest = require('./routes/products-test')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')
// const normalizr = require('normalizr')
// const normalize = normalizr.normalize
// const denormalize = normalizr.denormalize
// const schema = normalizr.schema


const {Server: IOServer} = require('socket.io')
const {Server: HttpServer} = require('http')
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)
const advanceOptions = {useNewUrlParser:true, useUnifiedTopology:true}

const port = 8080


app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use('/api/products',router)
app.use('/api/products-test',routerTest)
app.use(cookieParser())
app.use(express.static('./public'))
app.use(session({
    store: MongoStore.create({
        mongoUrl:'mongodb+srv://jherlein:coderhouse@cluster0.hatkx.mongodb.net/?retryWrites=true&w=majority',
        mongoOptions: advanceOptions
    }),
    secret:'1234',
    resave:true,
    saveUninitialized:true,
    cookie:{
        maxAge:600000
    }
}))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs')

// app.get('/set', (req,res) =>{
//     res.cookie('server','express').send('Cookie Set')
// })
// app.get('/setEx', (req,res) =>{
//     res.cookie('server2','express2',{maxAge:10000}).send('Cookie Set Ex')
// })
// app.get('/readCookie',(req,res) =>{
//     console.log('holi')
//     res.send(req.cookies)
// })
// app.get('/clear',(req,res) =>{    
//     res.clearCookie('server').send('Cookie Cleared')
// })
// app.get('/con-session',(req,res) =>{    
//     res.send(`session inicializada ${req.session.name}`)
// })

app.post('/login',(req,res)=>{
    req.session.name = req.body.user
    res.render('login.html')
})

app.get('/login',(req,res)=>{    
    res.render('login.html')
})

app.get('/login-info',(req,res)=>{
    res.json({user:req.session.name})
})

app.get('/logout',(req,res)=>{
    req.session.destroy(err=>{
        if(!err){
            res.render('logout.html')
        }
        else{
            res.send('Error logout')
        }
    })
})


httpServer.listen(port,console.log(`Listening on port ${port}`))


// GET '/api/productos' -> devuelve todos los productos.
// GET '/api/productos/:id' -> devuelve un producto según su id.
// POST '/api/productos' -> recibe y agrega un producto, y lo devuelve con su id asignado.
// PUT '/api/productos/:id' -> recibe y actualiza un producto según su id.
// DELETE '/api/productos/:id' -> elimina un producto según su id.


// const messages = [
//     { author: "Juan",text:"Hola, que tal?",time:new Date()},
//     { author: "Pedro",text:"Holiiii",time:new Date()},
//     { author: "Ana",text:"uwu", time:new Date()}
// ]

const getAllMensajes = async () => {
    try {
        let file = await fs.promises.readFile('./files/mensajes.txt')
        file = new Array(file)
        return JSON.parse(file)    
    } catch (error) {
        console.log(error)
    }    
}

const createMensaje = async (mensaje) => {      
    try {
        let file = await fs.promises.readFile('./files/mensajes.txt','utf-8')
        file = JSON.parse(file)        
        file.push(mensaje)
        await fs.promises.writeFile('./files/mensajes.txt',JSON.stringify(file,null,2))
        return file              
    } catch (error) {
        console.log(error)
    }  
}

let messages = getAllMensajes()


app.get('/products',(req,res) => {    
    res.render('products.html')
})


io.on('connection', async (socket) => {
    console.log('Usuario conectado')
    socket.emit('render','')    
    socket.emit('messages',await messages.then(data => {return data}))       
    socket.on("productAdded", (data) => {
        console.log("Recibi producto agregado")        
        io.sockets.emit('newProduct','Nuevo producto agregado')
    });
    socket.on('new-message', async data => {        
        messages = createMensaje(data)
        io.sockets.emit('messages',await messages.then(data => {return data}))
    });
})


// const mensajesNew = {
//     id:'100',    
//     mensajes:[
//     {   
//         id:'1',
//         author: {
//             email: 'jherlein12@gmail.com',
//             nombre:'Julian',
//             apellido:'Herlein',
//             edad:'27',
//             alias:'jherlein',
//             avatar:'asd'
//         },
//         text:'mensaje 1'
//     },
//     {
//         id:'2',
//         author: {
//             email: 'jherlein13@gmail.com',
//             nombre:'Juliana',
//             apellido:'Herleina',
//             edad:'27',
//             alias:'jherlein123',
//             avatar:'asd'
//         },
//         text:'mensaje 2'
//     },
//     {
//         id:'3',
//         author: {
//             email: 'jherlein13@gmail.com',
//             nombre:'Juliana',
//             apellido:'Herleina',
//             edad:'27',
//             alias:'jherlein123',
//             avatar:'asd'
//         },
//         text:'mensaje 3'
//     }
// ]}

// const authorSchemaNor = new schema.Entity('author',{},{idAttribute:'email'})
// const mensajeSchemaNor = new schema.Entity('mensaje',{
//     author:authorSchemaNor
// })
// const mensajesSchemaNor = new schema.Entity('mensajes',{
//     mensajes:[mensajeSchemaNor]
// })

// const util = require('util')

// function print(objeto){
//     console.log(util.inspect(objeto,false,12,true))
// }

// console.log('Objeto Original')
// console.log(JSON.stringify(mensajesNew).length)

// console.log('Objeto Normalizado')
// const normalizedData = normalize(mensajesNew,mensajesSchemaNor)
// print(normalizedData)
// console.log(normalizedData)
// console.log(JSON.stringify(normalizedData).length)

// console.log('Objeto Desnormalizado')
// const denormalizeData = denormalize(normalizedData.result,mensajesSchemaNor,normalizedData.entities)
// console.log(JSON.stringify(denormalizeData).length)

