/* This server, unlike our previous ones, uses the express framework */
var express = require('express');
var formidable = require('formidable');  // we upload images in forms
// this is good for parsing forms and reading in the images

var sqlite3 = require("sqlite3").verbose();  // use sqlite
var dbFile = "photos.db";
var db = new sqlite3.Database(dbFile);  // new object, old DB

var querystring = require('querystring'); // handy for parsing query strings


//for db ops
function errorCallback(err) {
  if (err) {
    console.log("error: ", err, "\n");
  }
  else{
    console.log("db - op success");
  }
}

function dataCallback(err, tableData) {
  if (err) {
    console.log("error: ", err, "\n");
  }
  else {
    console.log("db - got: ", tableData, "\n");
  }
}
//for db ops


// make a new express server object
var app = express();

// Now we build a pipeline for processing incoming HTTP requests

// Case 1: static files
app.use(express.static('public')); // serve static files from public
// if this succeeds, exits, and rest of the pipeline does not get done

// Case 2: queries
// An example query URL is "138.68.25.50:???/query?img=hula"
app.get('/query', function (request, response){
  console.log("found a query");
  query = request.url.split("?")[1]; // get query string
  if (query) {
    answer(query, response);
  }
  else {
    sendCode(400,response,'query not recognized');
  }
}); //app.get()


// Case 3: upload images
// Responds to any POST request
app.post('/', function (request, response){
  var form = new formidable.IncomingForm();
  var fName; //filename of the pic we are uploading
  form.parse(request); // figures out what files are in form

  // callback for when a file begins to be processed
  form.on('fileBegin', function (name, file){
    //get filename to use it later
    fName = file.name;

    // put it in /public
    file.path = __dirname + '/public/' + file.name;
    console.log("uploading ", file.name, name);
  }); //form.on('fileBegin')

  // callback for when file is fully received
  form.on('end', function (){
    console.log('successfully uploaded ' + fName + ' to ./public');
    sendCode(201,response,'received file');  // respond to browser

    //DB STUFF START
    //should insert into db after we upload successfully to public
    console.log("db stuff");
    console.log("file is: " + fName);

    //insert into db - filename, no labels, no favorite
    db.run(
  	'INSERT OR REPLACE INTO photoLabels VALUES (?, "", 0)',
  	[fName], errorCallback);
    //DB STUFF END

  }); //form.on('end')
  //finished uploading to public

}); //post()

// You know what this is, right?
var port = 8650;
app.listen(port);
console.log ("listening to port: " + port);

// sends off an HTTP response with the given status code and message
function sendCode(code,response,message) {
  response.status(code);
  response.send(message);
}

// Stuff for dummy query answering
// We'll replace this with a real database someday!
function answer(query, response) {
  console.log("answering query");
  //
  // var labels = {
  //   hula: "Dance, Performing Arts, Sports, Entertainment, Quinceañera, Event, Hula, Folk Dance",
  // 	eagle: "Bird, Beak, Bird Of Prey, Eagle, Vertebrate, Bald Eagle, Fauna, Accipitriformes, Wing",
  // 	redwoods: "Habitat, Vegetation, Natural Environment, Woodland, Tree, Forest, Green, Ecosystem, Rainforest, Old Growth Forest" };
  //
  // kvpair = query.split("=");
  // labelStr = labels[kvpair[1]];
  // if (labelStr) {
  //   response.status(200);
  //   response.type("text/json");
  //   response.send(labelStr);
  // }
  // else{
  //   sendCode(400, response, "requested photo not found");
  // }
  queryObj = querystring.parse(query);
  if (queryObj.op == "dump"){
    // Dump whole database
    console.log("dump op detected - must be starting the page");

    function dbAllRet(err, tableData){
      if (err) {
        console.log("error: ", err, "\n");
      }
      else {
        response.status(200);
        response.type("application/json");
        JSON.stringify(tableData);
        response.send(tableData);
        console.log("sent dbAll to client");
      }
    } //dbAllRet()
    db.all('SELECT * FROM photoLabels', dbAllRet);
    //callback will return the json obj

  } //if op == dump
} //answer()
