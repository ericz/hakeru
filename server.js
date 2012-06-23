var http = require('http'); 
var io = require('socket.io');

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSONPure;

var mongo = new Db('hakeru', new Server("localhost", 27017, {}));




var conferencePipes = new Object();

var clientPipeDictionary = new Object();
		
//Sanitizing user input
function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/>/g, '&gt;');
}

		
// Handles different modules
var messageHandlers = new Object();

// Handle chat
messageHandlers['sessionCheckIn'] = function(client, data){
	clientPipeDictionary[client.sessionId] = data.pipe;
	
	client.phpId = data.user_id;
  if(!(data.pipe in conferencePipes)) {
		conferencePipes[data.pipe] = new Pipe(data.pipe);
		conferencePipes[data.pipe].construct(client);
		console.log("Creating new pipe " + data.pipe);
		var newPipe = true;
	} else {
		var newPipe = false;
	}
	conferencePipes[data.pipe].addClient(client);
	conferencePipes[data.pipe].sendToOthers('user_joined', {user_id:client.phpId, client_name: client.name}, client.sessionId);
	if(!newPipe){
		client.emit('message', JSON.stringify({type:'zip' , data: {sessionId: client.sessionId, zipped: conferencePipes[data.pipe].zip()}}));
	}
}

// Handle chat
messageHandlers['chat'] = function(client, data){
    var clientPipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	clientPipe.bufferMessage({msg: encodeHTML(data.msg), user_id: client.phpId, client_name: client.name});
	clientPipe.send('chat', {msg: encodeHTML(data.msg), user_id: client.phpId, client_name: client.name});
}

messageHandlers['new_task'] = function(client, data){
	var clientPipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	if(data.group != ""){
			var msg = data.msg.slice(2 + data.group.length + 1);
	} else {
			var msg = data.msg.slice(1);
	}
		
	var theTask = clientPipe.newTask(encodeHTML(msg), data.group);
	clientPipe.send('new_task', {msg: encodeHTML(data.msg.slice(1)), the_task: theTask, user_id: client.phpId, client_name: client.name});
}

messageHandlers['accept_task'] = function(client, data){
	var clientPipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	var theTask = clientPipe.acceptTask(data.task_id, client.phpId);
	clientPipe.send('accept_success', {the_task: theTask, user_id:client.phpId, client_name: client.name});
}

messageHandlers['complete_task'] = function(client, data){
	console.log("RECEIVING COMPLETION REQUEST");
	var clientPipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	var theTask = clientPipe.completeTask(data.task_id, client.phpId);
	clientPipe.send('task_completed', {the_task: theTask, user_id:client.phpId, client_name: client.name});
}

messageHandlers['give_up'] = function(client, data){
	var clientPipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	var theTask = clientPipe.giveUpTask(data.task_id, client.phpId);
	clientPipe.send('given_up', {the_task: theTask, user_id:client.phpId, client_name: client.name});
}

messageHandlers['delete_task'] = function(client, data){
	var clientPipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	var theTask = clientPipe.deleteTask(data.task_id, client.phpId);
	clientPipe.send('deleted_task', {the_task: theTask, user_id:client.phpId, client_name: client.name});
}



function handleNewConnection(client){
	client.on('message', function(message){	    
    console.log('Message Received', message);   
		var messageObj = JSON.parse(message);
		if(messageObj != null && "type" in messageObj && messageObj.type in messageHandlers) {
		    messageHandlers[messageObj.type](client, messageObj.data);
		}
	});
	
	client.on('disconnect', function(){
		handleDisconnection(client);	
	});
}

function handleDisconnection(client) {
	var pipe = conferencePipes[clientPipeDictionary[client.sessionId]];
	
	if(pipe != null && "removeClient" in pipe) {
		pipe.removeClient(client);
		if(!pipe.hasClient(client.phpId)){
			pipe.send('gone', {user_id: client.phpId});
		}
		if(pipe.members() == 0) {
		//	delete conferencePipes[clientPipeDictionary[client.sessionId]];
		//	console.log("Deleting pipe " + clientPipeDictionary[client.sessionId]);
		}
		delete clientPipeDictionary[client.sessionId];
	}
	
}

function handleHttp(req, res){
	var requestInfo = require('url').parse(req.url, true);
	if(requestInfo.pathname == "/upload" && 'query' in requestInfo && 'sessionId' in requestInfo.query && 'phpId' in requestInfo.query && 'url' in requestInfo.query && 'size' in requestInfo.query){
		console.log("RECEIVING UPLOAD");
		var clientPipe = conferencePipes[clientPipeDictionary[requestInfo.query.sessionId]];
		
		var fileObj = {file_url: requestInfo.query.url, user_id: requestInfo.query.phpId, size: requestInfo.query.size, pipe:clientPipeDictionary[requestInfo.query.sessionId]};
		
		clientPipe.send('file_upload', {file_url: requestInfo.query.url, user_id: requestInfo.query.phpId, size: requestInfo.query.size});
		clientPipe.newFile(fileObj);
		clientPipe.files.push(fileObj);
		
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('Hello World\n');
	}

}

server = http.createServer(handleHttp);
server.listen(8003);


// Start socket.io
var io = io.listen(server, {'log level': 1});
		
io.sockets.on('connection', function(client){
  client.sessionId = client.id;
	handleNewConnection(client);
});

// Classes

function Pipe (name) {

	var clients = new Object();
	var tasks = new Object();
	var messages = [];
	var files = [];
	
	var nextId = 0;

	
	
	this.name = name;
	this.nextId= nextId;
	this.clients = clients;
	this.tasks = tasks;
	this.messages = messages;
	this.files = files;
	
	this.construct = function(client){
		// Necessary for the anonymous functions below
		var self = this;
		console.log("Constructing");
		mongo.open(function(p_client){
			mongo.collection('tasks', function(err, collection){
				collection.find({'pipe': name}, 
					function(err, cursor){
						cursor.toArray(function(err, docs){
							var maxIdSoFar = 0;
							for (var taskIndex in docs){
								var task = docs[taskIndex];
								tasks[task.id] = task;
								maxIdSoFar = Math.max(maxIdSoFar, task.id);
							}
							nextId = maxIdSoFar + 1;
											
							mongo.collection('files', function(err,collection){
								collection.find({'pipe':name}, 
									function(err, cursor){
										cursor.toArray(function(err,docs){
											
											for(var fileIndex in docs){
												files.push(docs[fileIndex]);
											}
											self.send('zip' , {sessionId: client.sessionId, zipped: self.zip()});
											mongo.close();
										});
								});
							});
						});
					});
				});
		});
	}
	
	this.addClient = function(client){
		clients[client.sessionId] = client;
	}
	this.removeClient = function(client){
		delete clients[client.sessionId];
	}
	this.send = function(type, data){
		for(var client in clients) {
			if (clients[client] != null && "sessionId" in clients[client]) {
				clients[client].emit('message', JSON.stringify({type: type, data: data}));
			}
		}
	}
	
	this.sendToOthers = function(type, data, excluded_id){
		for(var client in clients) {
			if (clients[client] != null && "sessionId" in clients[client] && client != excluded_id) {
				clients[client].emit('message', JSON.stringify({type: type, data: data}));
			}
		}
	
	}
	
	this.newFile = function(fileObj){
		console.log("Inserting le file" + JSON.stringify(fileObj));
		mongo.open(function(p_client){
			mongo.collection('files', function(err, collection){
				collection.insert(fileObj, function(err, docs){mongo.close();});
		
			});
		});
	}

	this.newTask = function(text, group){
		
		var theTask = new Task(text, nextId, 0, name, group);
		tasks[nextId] = theTask;
		console.log(theTask);
		mongo.open(function(p_client){
			mongo.collection('tasks', function(err, collection){
				collection.insert(theTask, function(err, docs){mongo.close();});
			});
		});
		nextId++;
		return theTask;
	}
	
	this.acceptTask = function(taskId, phpId){
		var theTask = tasks[taskId];
		theTask.owner = phpId;
		mongo.open(function(p_client){
			mongo.collection('tasks', function(err, collection){
				console.log(taskId);
				collection.update({id: Number(taskId), pipe: name}, {"$set" : {owner: phpId}}, function(err, docs){mongo.close();});
			});
		});
		return tasks[taskId];
	}
	
	this.completeTask = function(taskId, phpId){
		var theTask = tasks[taskId];
		theTask.completed = true;
		mongo.open(function(p_client){
			mongo.collection('tasks', function(err, collection){
				collection.update({id: Number(taskId), pipe: name}, {"$set" : {completed: true}}, function(err, docs){mongo.close();});
			});
		});
		return tasks[taskId];
	}
	
	this.giveUpTask = function(taskId, phpId){
		var theTask = tasks[taskId];
		theTask.owner = 0;
		mongo.open(function(p_client){
			mongo.collection('tasks', function(err, collection){
				collection.update({id: Number(taskId), pipe: name}, {"$set" : {owner: 0}}, function(err, docs){mongo.close();});
			});
		});
		return theTask;
	}
	
	this.deleteTask = function(taskId, phpId){
		var theTask = tasks[taskId];
		mongo.open(function(p_client){
			mongo.collection('tasks', function(err,collection){
				collection.remove({id: Number(taskId), pipe: name}, function(err,docs){
					mongo.close();
				});
			});
		});
		delete tasks[taskId];
		return theTask;
	}
	
	this.members = function(){
		var i = 0;
		for(var client in clients) {
			if (clients[client] != null && "sessionId" in clients[client]) {
				i++;
			}
		}
		return i;
	}
	
	this.hasClient = function(phpId){
		for(var clientIndex in clients){
			if((clients[clientIndex]).phpId == phpId){
				return true;
			}
		}
		return false;
	}

	this.zip = function(){
		
		var theZip = new Object();
		var users_tasks = new Object();
		
		for(var taskId in tasks) {
			if(!(tasks[taskId].owner in users_tasks)) {
				users_tasks[tasks[taskId].owner] = new Object();
			}
			if(tasks[taskId].completed != true){
				users_tasks[tasks[taskId].owner][taskId] = tasks[taskId];
			}
		}
		for(var id in clients) {
			var client = clients[id];
			if(!(client.phpId in users_tasks)){
				users_tasks[client.phpId] = new Object();
			}
			users_tasks[client.phpId].here = true;
			
		}
		
		theZip["users"] = users_tasks;
		theZip["messages"] = messages;
		theZip['files'] = files;
		
		console.log("Zipping contents");
		
		return theZip;
	
	}
	
	this.bufferMessage= function(messageObj){
		messages.push(messageObj);
		if(messages.length > 100){
			messages.splice(0, messages.length - 100);
		}
	}
	
}

function Task(text, id, owner, pipe, group){
	this.text = text;
	this.id = id;
	this.owner = owner;
	this.completed = false;
	this.pipe = pipe;
	this.group = group;
}