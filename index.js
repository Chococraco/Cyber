//Require
const electron = require('electron');
var path = require('path');
var mysql = require('mysql');
var ldap = require('ldapjs');
const URL = require('url').URL
const fs = require('fs');
const sessionHash = 'GF!K97jX$NJrdU!E_vnRw#z5$$gG8rDA';


const ipc = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const width = 1920; //Valeurs a définir automatiquement après
const height = 1080; //Valeurs a définir automatiquement après

let mainWindow;

/* PARTIE BDD */
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : null, // or the original password : 'apaswword'
    database : 'cyber'
});

//Auth for ad
function authenticate(user, pswd, callback){
    var client = ldap.createClient({
        url: 'ldap://ad.alphapar.mylocal'
    })

    client.bind(user, pswd,(err)=> {
        if (err){
            console.log('Err : ' + err);
            callback(false);
        }
        else {
            console.log('Connect OK');
            callback(true);
        }
    });
}

//Log function
function log(text){
    var today = new Date();
    var day = today.getDate() + "";
    var month = (today.getMonth() + 1) + "";
    var year = today.getFullYear() + "";
    var hour = today.getHours() + "";
    var minutes = today.getMinutes() + "";
    var seconds = today.getSeconds() + "";

    var date = '[' + day + "/" + month + "/" + year + " " + hour + ":" + minutes + ":" + seconds + ']';




    var lg = date + ' ' + text;
    console.log(lg);
    fs.appendFile('log.txt', lg + '\n', function (err) {
        if (err) throw err;
    });
}

function createWindow () {

    //Option d'init
    mainWindow = new BrowserWindow({
        width:width,
        height: height,
        movable: true,
        resizable : false,
        icon: 'assets/icon.jpg',
        title: 'Home',
        fullscreenWindowTitle: true,
        webPreferences: {preload: path.join(app.getAppPath(), 'preload/preload.js')}
    });

    connection.connect(function(err) {
        // in case of error
        if(err){
            /*console.log(err.code);
            console.log(err.fatal);*/
            log('Erreur de la connexion à la base de données MYSQL');
        }
    });

    //Paramétrage session
    const ses = mainWindow.webContents.session
    var data = {
        login: 'unknown',
        session: '',
    };
    var json = JSON.stringify(data);
    ses.setUserAgent(json);


    //Lancement de la page principal
    mainWindow.loadURL(`file://${__dirname}/vue/connexion.html`);

    //Fermeture fenêtre
    mainWindow.on('closed', () => {
        mainWindow = null;
    })
}

//Création de la fenêtre principal quand l'application est prête
app.on('ready', createWindow);


//Fermeture de l'application quand l'ensemble des fenêtres sont fermées
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//Ligne pour MacOS, quand l'application se réactive, elle apparait.
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

//Demande authentification
ipc.on('auth-ask', (event, args) => {
    log('Tentative de connexion de l utilisateur : ' + args.login);
    // Authenticate
    var auth = authenticate("uid="+args.login+",cn=users,cn=accounts,dc=alphapar,dc=mylocal",args.password, (auth) => {
        if (auth) {
            log('Connexion reussie de l utilisateur : ' + args.login);
            const ses = mainWindow.webContents.session
            var data = {
                login: args.login,
                session: 'GF!K97jX$NJrdU!E_vnRw#z5$$gG8rDA',
            };
            var json = JSON.stringify(data);
            ses.setUserAgent(json);
            mainWindow.loadURL(`file://${__dirname}/vue/client.html`);
        }
        else {
            log('Connexion refuse de l utilisateur : ' + args.login);
            mainWindow.loadURL(`file://${__dirname}/vue/connexion.html`);
        }
    });
});

//Logout
ipc.on('logout', (event,args) => {
    const ses = mainWindow.webContents.session
    var str = JSON.parse(ses.getUserAgent());
    log('Deconnexion de : ' + str.login);
    var data = {
        login: 'unknown',
        session: 'unknonw',
    };
    var json = JSON.stringify(data);
    ses.setUserAgent(json);
    mainWindow.loadURL(`file://${__dirname}/vue/connexion.html`);
});

//Demande info client
ipc.on('ask-data-client', (event, args) => {
    const ses = mainWindow.webContents.session
    var str = JSON.parse(ses.getUserAgent());
    //Récupération des données en base
    var query = connection.query('SELECT * FROM client;','', function (err, result) {
        log('Demande des donnees clients de : ' + str.login);
        //Récupération facture
        var query2 = connection.query('SELECT facture.id as id, facture.nom as nom, facture.prix as prix, facture.id_client as client, facture.date as date, produit.nom as produit FROM facture, produit WHERE facture.id_produit = produit.id;','', (err, result2) =>{
            log('Demande des donnees factures de : ' + str.login);
            output = {r1: result, r2: result2};
            event.sender.send('resp-data-client',output);
        });
    });
})

//Demande info plan
ipc.on('ask-data-plan', (event, args) => {
    const ses = mainWindow.webContents.session
    var str = JSON.parse(ses.getUserAgent());
    //Récupération des données en base
    var query = connection.query('SELECT * FROM produit;','', function (err, result) {
        log('Demande donnees produits de : ' + str.login);
        //Récupération pieces
        var query2 = connection.query('SELECT piece.nom as nom, piece.stock as stock, forme.nombre as nombre, produit.id as id FROM produit, piece, forme WHERE produit.id = forme.id_produit AND piece.id = forme.id_piece;','', (err, result2) =>{
            log('Demande donnees pieces de : ' + str.login);
            event.sender.send('resp-data-plan',output);
        });
    });
});

//Demande info facturation
ipc.on('ask-data-facturation', (event,args) => {
    const ses = mainWindow.webContents.session
    var str = JSON.parse(ses.getUserAgent());
    //Récupération des données en base
    var query = connection.query('SELECT * FROM produit;','', function (err, result) {
        log('Demande donnees produits de : ' + str.login);
        var query2 = connection.query('SELECT * FROM client;','', function (err, result2) {
            log('demande donnees clients de : ' + str.login);
            event.sender.send('resp-data-facturation',output);
        });
    });
});

//On enregistre les factures
ipc.on('register-facture', (event, args) => {
    //On enregistre la facture
    var values = [args.client, args.produit, args.nom, args.prix, args.date];
    var query = connection.query("INSERT INTO facture (id_client, id_produit, nom, prix, date) VALUES (?)", [values], (err, result) => {
        log('Enregistrement de facture');
    });
});

//SECU
//On enregistre les factures
ipc.on('check-auth', (event, args) => {
    //Recup la session
    const ses = mainWindow.webContents.session
    var str = JSON.parse(ses.getUserAgent());
    log('Verification de la connexion');
    var actualURL = mainWindow.webContents.getURL();
    var connectURL = `file:///${__dirname}/vue/connexion.html`;
    var connectURL2 = connectURL.replace(/\\/g, '/');
    if(str.session != sessionHash && actualURL != connectURL2){
        mainWindow.loadURL(`file://${__dirname}/vue/connexion.html`);
    }
    else{

    }
});