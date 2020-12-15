//Intégration du renderer
const ipc = require('electron').ipcRenderer;

ipc.send('check-auth');


//Attente du chargement de la page
window.addEventListener('DOMContentLoaded', () => {

    //Init jquerry
    window.$ = window.jQuery=  require('jquery');

    //Login event
    if($('#login').length != 0){
        document.getElementById('login-button').addEventListener('click', () => {
            var data = { login: $('#login').val(), password: $('#password').val() }
            ipc.send('auth-ask', data);
        });
    }

    //Logout event
    document.getElementById('logout').addEventListener('click', () => {
        ipc.send('logout', data);
    });

    //Si on est sur la page client on charge les données
    if($('#client-page').length != 0){
        var data = ipc.send('ask-data-client');
    }

    //Si on est sur la page plan on charge les données
    if($('#plan-page').length != 0){
        var data = ipc.send('ask-data-plan');
    }

    //Si on est sur la page facturation on charge les données
    if($('#produit-liste').length != 0){
        var data = ipc.send('ask-data-facturation');
        document.getElementById('facture-button').addEventListener('click', () => {
            var data = { produit: $('#produit-liste').val(), client: $('#client-liste').val(), date: $('#date').val(),nom: $('#nom').val(), detail: $('#detail').val(), prix: $('#prix').val() }
            ipc.send('register-facture', data);
        });
    }


})

//Réponse données clients
ipc.on('resp-data-client', function (event, args) {
    //Mise en forme du tableau
    var i = 1;
    //Pour chaque client
    args.r1.forEach( (arg) => {
        var casetab = ""
        var html = ""
        if(i & 1){ casetab = "impair"; }
        else{ casetab = "pair";}
        html += '<div class="row tab '+ casetab +'" onclick="expand('+ arg['id'] +')"><div class="col-1">'+ arg['id'] +'</div><div class="col-3">'+ arg['nom'] +'</div><div class="col-4">'+ arg['adresse'] +'</div>\<div class="col-4">'+ arg['rib'] +'</div></div>';
        html += '<div id="fact'+i+'" style="display: none">';
        html += '<div class="row">';
        html += '<div class="sub-toptab col-3">FACTURE</div>';
        html += '<div class="sub-toptab col-3">PRODUIT</div>';
        html += '<div class="sub-toptab col-3">PRIX</div>';
        html += '<div class="sub-toptab col-3">DATE</div>';
        html += '</div>';


        //Pour chaque facture d'un client
        var f = args.r2.length;
        for (var f = 0;f < args.r2.length; f++){
            if(args.r2[f]['client'] == arg['id']){
                html += '<div class="row sub-tab '+casetab+'">';
                html += '<div class="col-3">'+ args.r2[f]['nom'] +'</div>';
                html += '<div class="col-3">'+ args.r2[f]['produit'] +'</div>';
                html += '<div class="col-3">'+ args.r2[f]['prix'] +'</div>';
                html += '<div class="col-3">'+ convertDate(args.r2[f]['date']) +'</div>';
                html += '</div>';
            }
        }
        html += '</div>';
        $('#tabclient').append(html);
        console.log(html);
        i++;
    });




    //console.log(args[0]['adresse']);
});

//Réponse données plan
ipc.on('resp-data-plan', (event, args) => {
    //Mise en forme du tableau
    var i = 1;
    //Pour chaque client
    args.r1.forEach( (arg) => {
        var casetab = ""
        var html = ""
        if(i & 1){ casetab = "impair"; }
        else{ casetab = "pair";}
        html += '<div class="row tab '+casetab+'" onclick="expand('+i+')">';
        html += '<div class="col-1">'+ arg['id'] +'</div>';
        html += '<div class="col-3">'+ arg['nom'] +'</div>';
        html += '<div class="col-6">Description [...]</div>';
        html += '<div class="col-1">'+ arg['prix'] +'</div>';
        html += '<div class="col-1">PDF</div>';
        html += '</div>';

        html += '<div id="piece'+i+'" style="display: none">';
        html += '<div class="row">';
        html += '<div class="sub-toptab col-3">NOM PIECE</div>';
        html += '<div class="sub-toptab col-3">NOMBRE</div>';
        html += '<div class="sub-toptab col-3">PRIX UNITAIRE</div>';
        html += '<div class="sub-toptab col-3">STOCK</div>';
        html += '</div>';


        //Pour chaque facture d'un client
        var f = args.r2.length;
        for (var f = 0;f < args.r2.length; f++){
            if(args.r2[f]['id'] == arg['id']){
                html += '<div class="row sub-tab '+casetab+'">';
                html += '<div class="col-3">'+ args.r2[f]['nom'] +'</div>';
                html += '<div class="col-3">'+ args.r2[f]['nombre'] +'</div>';
                html += '<div class="col-3">XX€</div>';
                html += '<div class="col-3">'+ args.r2[f]['stock'] +'</div>';
                html += '</div>';
            }
        }
        html += '</div>';
        $('#tabplan').append(html);
        console.log(html);
        i++;
    });
});

ipc.on('resp-data-facturation',(event,args) => {
    //Pour chaque produit
    args.r1.forEach((arg) => {
        $('#produit-liste').append('<option value ="'+ arg['id'] +'">'+ arg['nom']+'</option>');
    });
    //Pour chaque client
    args.r2.forEach((arg) => {
        $('#client-liste').append('<option value ="'+ arg['id'] +'">'+ arg['nom']+'</option>');
    });
});

function convertDate(inputFormat) {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    var d = new Date(inputFormat)
    return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('/')
}