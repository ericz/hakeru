var me = new Object();

var latestChat;

var hasFocus = true;
window.onblur = function () {
	hasFocus = false;}
window.onfocus = gotFocus;

function gotFocus() {

		document.title =  "Hakeru - " + pipeName;
		hasFocus = true;

}


// Handles different modules
var messageHandlers = new Object();
// Handle chat
messageHandlers['chat'] = function(data){
	if(latestChat != null && "attr" in latestChat && latestChat.attr('user_id') == data.user_id){
		latestChat.append("<br>" + data.msg);
	} else {
		if(data.user_id == me.userId){
			var bgClass = "chatbg-me";
		} else {
			var bgClass = "chatbg";
		}
		latestChat = $("<div></div>").attr("user_id", data.user_id).html(data.msg).addClass(bgClass);
		$("#chat-messages").append("<strong>" + data.user_id + "</strong>" +"<br>").append(latestChat);
	}
	
	latestChat.mailto();
	latestChat.autolink();
	if(!hasFocus){
		document.title = data.user_id + " says " + data.msg.substring(0,100);
	}
	scrollPaneToBottom($("#chatwrap .innercontent"), false, true);
}

messageHandlers['new_task'] = function(data){
	latestChat = null;
	var newLink = $("<a></a>").attr("href", "#").addClass("accept_task").attr("task_id", data.the_task.id).text("I'm on it");	
	var newTask = $("<div></div>").attr("id", "newtask"+data.the_task.id).addClass("newtaskbg").append(data.the_task.text + " ").append(newLink);
	$("#chat-messages").append("<strong>" + data.user_id + " posted a new task</strong>").append(newTask);
	//console.log(data);
	newLink.click(acceptButtonClick);
	addToOpenTasks(data.the_task);
	updateOpenTaskCount();
	drawMenuWindow();
	scrollPaneToBottom($("#chatwrap .innercontent"), false, true);
	showHTMLNotification("Task Created" ,data.msg,"");
}

messageHandlers['accept_success'] = function(data){

	$('a[class="accept_task"][task_id="'+data.the_task.id+'"]').remove();
	$('a[class="delete_task"][task_id="'+data.the_task.id+'"]').remove();

	var notice = $("#givenuptask"+data.the_task.id + ", #newtask"+data.the_task.id);
	notice.append('<strong>Claimed by ' + data.user_id + '</strong>');
	notice.attr("id", notice.attr("id") + "_old");
	var notice2 = $("#opentask" + data.the_task.id + " .right");
	notice2.append('<strong>Claimed by ' + data.user_id + '</strong>');
	notice2.parent().attr("id", notice2.parent().attr("id") + "_old");
	
	drawMenuWindow();
	setTimeout(function(){
		$('#opentask'+data.the_task.id+'_old').slideUp(function(){
			$(this).remove();
			updateOpenTaskCount();	
			drawMenuWindow();
		});
	}, 3000);
	
	bindTaskButtons(data.user_id, data.the_task);
	showHTMLNotification("Task Accepted" ,data.user_id + " accepted task " + data.the_task.text,"");
}
messageHandlers['gone'] = function(data){
	$("li[user_id="+data.user_id+"]").removeClass("useractive");
}
messageHandlers['user_joined'] = function(data){
	if($("li[user_id="+data.user_id+"]").length == 0){
		var userItem = $("<li></li>").addClass("user").addClass("useractive").attr('user_id', data.user_id).append('<div user_id="'+data.user_id+'" class="expand"><div class="left">'+data.user_id+'</div><div class="right arrow">&#9660;</div><div class="clear"></div></div><ul class="task-list clear"> </ul>');
		$('#user-list').append(userItem);
	
		bindExpandCollapseButton(userItem);	
	
	} else {
		$("li[user_id="+data.user_id+"]").addClass("useractive");
	}
	showHTMLNotification("New User" ,data.user_id + " joined " + pipeName,"");
}

messageHandlers['zip'] = function(data){
	console.log('i am', data.sessionId);
	me.sessionId = data.sessionId;
	$("#spinner").remove();
	$('#user-list').empty();
	$('#opentask-list-permenant').empty();
	$('#chat-messages').empty();
	
	for(var user_id in data.zipped.users){
		if(user_id != 0){
			var userItem = $("<li></li>").addClass("user").attr('user_id', user_id).append('<div user_id="'+user_id+'" class="expand"><div class="left">'+user_id+'</div><div class="right arrow">&#9660;</div><div class="clear"></div></div><ul class="task-list"> </ul>');
			if('here' in data.zipped.users[user_id] && data.zipped.users[user_id].here == true){
				userItem.addClass("useractive");
			}
			$('#user-list').append(userItem);
			bindExpandCollapseButton(userItem);
			for(var task_id in data.zipped.users[user_id]){
				if(task_id != 'here'){
					var the_task = data.zipped.users[user_id][task_id];
					bindTaskButtons(user_id, the_task);
				}
			}
		} else {
			for(var task_id in data.zipped.users[user_id]){
				if(task_id != 'here'){
					var the_task = data.zipped.users[user_id][task_id];
					addToOpenTasks(the_task);
				}
			}
		}
	}
	for(var message in data.zipped.messages){
		messageHandlers['chat'](data.zipped.messages[message]);
	}
	
	for(var file in data.zipped.files){
		addToSharedFilesList(data.zipped.files[file]);
	}
	
	latestChat = null;
	
	updateSharedFilesCount();
	
	updateOpenTaskCount();
	
	drawMainWindow();
	drawMenuWindow();
	drawChatWindow();
	scrollPaneToBottom($("#chatwrap .innercontent"), true, true);
	
	$("#chat-messages").append('<div class="hr"></div>');
	
}

messageHandlers['file_upload'] = function(data){
	
	var filename = data.file_url.split('/').pop() ;
	
	
	
	addToSharedFilesList(data);
	
	if(data.user_id == me.userId){
		var bgClass = "chatbg-me";
	} else {
		var bgClass = "chatbg";
	}
	
	var fileLink = $("<a></a>").attr('target', '_blank').attr('href', data.file_url).text(filename);
	
	latestChat = $("<div></div>").attr("user_id", data.user_id).addClass(bgClass).append(fileLink).append(" " + size_format(data.size));
	$("#chat-messages").append("<strong>" + data.user_id + " shared a file</strong>" +"<br>").append(latestChat);

	if(!hasFocus){
		document.title = data.user_id + " shared " + filename.substring(0,100);
	}
	latestChat = null;
	
	scrollPaneToBottom($("#chatwrap .innercontent"), false, true);
}

messageHandlers['task_completed'] = function (data){
	latestChat = null;
	var completedTask = $("<div></div>").addClass("completetaskbg").append(data.the_task.text);
	$("#chat-messages").append("<strong>"+data.user_id+" has completed a task</strong>").append(completedTask);
	$('li[task_id="'+data.the_task.id+'"]').remove();
	showHTMLNotification("Task Completed" ,data.user_id + " completed task " + data.the_task.text,"");
	scrollPaneToBottom($("#chatwrap .innercontent"), false, true);
}

messageHandlers['deleted_task'] = function (data){
	$('a[class="accept_task"][task_id="'+data.the_task.id+'"]').remove();

	var notice = $("#givenuptask"+data.the_task.id + ", #newtask"+data.the_task.id);
	notice.append('<strong>Task Deleted</strong>');
	notice.attr("id", notice.attr("id") + "_old");
	
	$("#opentask"+data.the_task.id).slideUp(function(){
		$(this).remove();
		updateOpenTaskCount();
		drawMenuWindow();
	});
}

messageHandlers['given_up'] = function (data){
	latestChat = null;
	var newLink = $("<a></a>").attr("href", "#").addClass("accept_task").attr("task_id", data.the_task.id).text("I'm on it");
	var newTask = $("<div></div>").attr("id","givenuptask"+data.the_task.id).html(data.the_task.text + " ").addClass("giveuptaskbg").append(newLink)
	$("#chat-messages").append("<strong>"+data.user_id+" has given up on a task</strong>").append(newTask);
	$('li[task_id="'+data.the_task.id+'"]').remove();
	newLink.click(acceptButtonClick);
	
	showHTMLNotification("Task Given Up" ,data.user_id + " gave up on " + data.the_task.text,"");
	addToOpenTasks(data.the_task);
	updateOpenTaskCount();
	drawMenuWindow();
	scrollPaneToBottom($("#chatwrap .innercontent"), false, true);
}

//Identify message type
function identifyMessageType(text){
	if (text.charAt(0) == '!'){
		return "new_task";
	} else {
		return "chat";
	}
}

function identifyTaskGroup(text){
	if(text.charAt(1) == '#'){
		var endStr = text.indexOf(' ');
		return text.substring(2, endStr);
	} else {
		return "";
	}

}

//The click and event handlers;

function acceptButtonClick(e){
	e.preventDefault();
	socket.emit('message',JSON.stringify({type:"accept_task", data: {task_id: $(this).attr("task_id")}}));
}

function deleteButtonClick(e){
	e.preventDefault();
	socket.emit('message',JSON.stringify({type:"delete_task", data: {task_id: $(this).attr("task_id")}}));
}

function giveUpClick(e){
	e.preventDefault();
	socket.emit('message',JSON.stringify({type:"give_up", data:{task_id: $(this).attr("task_id")}}));
}

function markCompletedClick(e){
	e.preventDefault();
	socket.emit('message',JSON.stringify({type:"complete_task", data:{task_id: $(this).attr("task_id")}}));
}

function bindTaskButtons(user_id, the_task){
	if(user_id == me.userId){
		var markCompletedLink = $("<a></a>").attr("href", "#").attr("task_id", the_task.id).addClass("mark_completed").text("Mark as complete");
		var giveUpLink = $("<a></a>").attr("href", "#").attr("task_id", the_task.id).addClass("give_up").text("Give up");
		var rightDiv = $("<div></div>").addClass("right").append(markCompletedLink).append(" ").append(giveUpLink);
		var taskItem = $("<li></li>").addClass("task").attr("task_id", the_task.id).append('<div class="left">'+the_task.text+'</div>').append(rightDiv).append('<div class="clear"></div>');;
		$('li[user_id="'+me.userId+'"] .task-list').append(taskItem);
		giveUpLink.click(giveUpClick);
		markCompletedLink.click(markCompletedClick);

	} else {
		$('li[user_id="'+user_id+'"] .task-list').append('<li class="task" task_id="'+the_task.id+'">'+the_task.text+'</li>');
	}

}

function bindExpandCollapseButton(userItem){
	userItem.children(".expand").toggle(function(){
		 $(this).siblings("ul").slideUp();
		 $(this).children(".arrow").animate({rotate: '-90deg'}, 500, drawMenuWindow);
	}, function(){
		 $(this).siblings("ul").slideDown();
		 $(this).children(".arrow").animate({rotate: '0deg'}, 500, drawMenuWindow);	
	});
}

function addToSharedFilesList(data){
	var filename = data.file_url.split('/').pop() ;
	
	
		
	var fileLink = $("<a></a>").attr('target', '_blank').attr('href', data.file_url).text(filename);
	
	// Add to list
	$("#file-list").append($("<li></li>").append(fileLink).append(" " + size_format(data.size)));

	updateSharedFilesCount();

	drawMenuWindow();
}

function addToOpenTasks(the_task){
	
	var newLink = $("<a></a>").attr("href", "#").addClass("accept_task").attr("task_id", the_task.id).text("I'm on it");
	var deleteLink = $("<a></a>").attr("href", "#").addClass("delete_task").attr("task_id", the_task.id).text("Delete");
	var rightDiv = $("<div></div>").addClass("right").append(newLink).append(" ").append(deleteLink);
	var taskItem = $("<li></li>").append('<div class="left">' + the_task.text + '</div>').attr("id", "opentask"+the_task.id).addClass("task").append(rightDiv).append('<div class="clear"></div>');
	//console.log(the_task.group);
	if(the_task.group == null || the_task.group == ""){
		$('#opentask-list-permenant').append(taskItem);
	} else {
		var groupEl = 'opentasks'+the_task.group;
		if($('li[group="'+groupEl+'"]').length == 0){
			var newBg = $("<li></li>").addClass("opentask").attr("group", groupEl).html('<div class="expand"><div class="left">'+the_task.group+'&nbsp;&nbsp;</div> <div class="count left"></div><div class="right arrow">&#9660;</div><div class="clear"></div></div><ul group="opentasks'+the_task.group+'-list"></ul>');
			bindExpandCollapseButton(newBg);
			$("#opentask-list").append(newBg);
		}
		
		$('ul[group="'+groupEl+'-list"]').append(taskItem);
	}
	
	newLink.click(acceptButtonClick);
	deleteLink.click(deleteButtonClick);
}

$(document).ready(function() {
	document.title =  "Hakeru - " + pipeName;
		
	socket = new io.connect('http://node.hakeruapp.com');
	
	socket.on('message', function(message){
		console.log(message);
		try {
			var messageObj = JSON.parse(message);
			console.log(messageObj);
			if("type" in messageObj && messageObj.type in messageHandlers) {
		    	messageHandlers[messageObj.type](messageObj.data);
			}
		} catch (exception) {
			//console.log(exception);
		}
	});
	
	socket.on('connect', function(message){		
		socket.emit('message',JSON.stringify({type: "sessionCheckIn", data: {pipe: pipeName, user_id: me.userId}}));
	});
	
	
	$("#msg").keypress(function(e){
		if(e.keyCode == 13) {
			if(!e.ctrlKey && !e.shiftKey){ 
				var msgText = $("#msg").val();
				if(msgText.length == 0) {
					return false;
				}
				socket.emit('message',JSON.stringify({type: identifyMessageType(msgText), data: {msg: msgText, group: identifyTaskGroup(msgText)}}));
				$("#msg").val("");
				scrollPaneToBottom($("#chatwrap .innercontent"), true, true);
				return false;
			}
		}	
	});
	
	
	$('a.accept_task').click(acceptButtonClick);
	$('a.delete_task').click(deleteButtonClick);
	
	$('a.give_up').click(giveUpClick);
	$('a.mark_completed').click(markCompletedClick);
	
	
	bindExpandCollapseButton($("#opentask-listbg"));
	
	bindExpandCollapseButton($("#files-bg"));
	
	bindExpandCollapseButton($("#opentask-listbg"));
	
	$(window).resize(function() {
		$('.innercontent').jScrollPaneRemove();
		
		drawMainWindow();
		drawMenuWindow();
		drawChatWindow();
		scrollPaneToBottom($("#chatwrap .innercontent"), true, false);
	});
	drawMainWindow();
	drawMenuWindow();
	drawChatWindow();
	
	$.extend($.gritter.options, { 
		fade_in_speed: 'fast', // how fast notifications fade in (string or int)
		fade_out_speed: 'fast', // how fast the notices fade out
	});
	
	$("body").click(function(){
	
		if (window.webkitNotifications && window.webkitNotifications.checkPermission() > 0) {
			window.webkitNotifications.requestPermission(function(){});
		} 
		gotFocus();
			
	});
	
	
});

// GUI Helper Functions

function scrollPaneToBottom(el, forceToBottom, animate){
	var autoScroll = el.data('jScrollPaneMaxScroll') - el.data('jScrollPanePosition') < 30;
	el.jScrollPane({animateTo: animate, animateInterval:10, animateStep:4});
	if(autoScroll || forceToBottom){
		el[0].scrollTo(el.data('jScrollPaneMaxScroll'));
	}
}

function drawMainWindow(){
	$("#wrap").height($("body").height() - 15);
	$("#menuwrap").height($("#wrap").height() - $("#header").height() - $("#statusbar").height());
	$("#chatwrap").height($("#wrap").height() - $("#header").height() - $("#statusbar").height());
	$("#middle").height($("#wrap").height() - $("#header").height() - $("#statusbar").height());
}

function drawChatWindow(){
	$("#chatwrap").width($("#wrap").width() - $("#menuwrap").width() - $("#middle").width() - 15);
	$("#chatwrap .main").width($("#chatwrap").width());
	$("#chatwrap .main").height($("#chatwrap").height() - 22);
	$("#chatwrap .content").width($("#chatwrap .main").width() -22);
	$("#chatwrap .content").height($("#chatwrap .main").height() - $("#msgwrap").height() - 10);
	$("#chatwrap .innercontent").width($("#chatwrap .content").width());
	$("#chatwrap .innercontent").height($("#chatwrap .content").height());
	$('#chatwrap .innercontent').jScrollPane();
}

function drawMenuWindow(){
	$("#menuwrap .main").width($("#menuwrap").width());
	$("#menuwrap .main").height($("#menuwrap").height() - 22);
	$("#menuwrap .content").width($("#menuwrap .main").width() - 22);
	$("#menuwrap .content").height($("#menuwrap .main").height());
	$("#menuwrap .innercontent").width($("#menuwrap .content").width());
	$("#menuwrap .innercontent").height($("#menuwrap .content").height());
	$('#menuwrap .innercontent').jScrollPane();
}



function updateOpenTaskCount(){
	$('#opentaskcount').each(function(i, el){
		
		var count =  $(el).parent().siblings('ul').children('li').length;
			$(el).text(count + " tasks");	
	});
	$('.count').each(function(i, el){
		
		var count =  $(el).parent().siblings('ul').children('li').length;
		if(count == 0){
			$(el).parent().parent().slideUp(function(){$(this).remove();});
		} else {		
			$(el).text(count + " tasks");	
		}
	});
}

function updateSharedFilesCount(){
	$("#sharedfilecount").text($("#file-list li").length + " files");
}



function size_format (filesize) {
	if (filesize >= 1073741824) {
	     filesize = number_format(filesize / 1073741824, 2, '.', '') + ' Gb';
	} else { 
		if (filesize >= 1048576) {
     		filesize = number_format(filesize / 1048576, 2, '.', '') + ' Mb';
   	} else { 
			if (filesize >= 1024) {
    		filesize = number_format(filesize / 1024, 0) + ' Kb';
  		} else {
    		filesize = number_format(filesize, 0) + ' bytes';
			};
 		};
	};
  return filesize;
};

function number_format( number, decimals, dec_point, thousands_sep ) {
    // http://kevin.vanzonneveld.net
    // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +     bugfix by: Michael White (http://crestidg.com)
    // +     bugfix by: Benjamin Lupton
    // +     bugfix by: Allan Jensen (http://www.winternet.no)
    // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)    
    // *     example 1: number_format(1234.5678, 2, '.', '');
    // *     returns 1: 1234.57     
 
    var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
    var d = dec_point == undefined ? "," : dec_point;
    var t = thousands_sep == undefined ? "." : thousands_sep, s = n < 0 ? "-" : "";
    var i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
    
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

// HTML5 Notifications


/**
* This show a HTML notification
*/
function showHTMLNotification(title, msg, hash) {
	
	if (window.webkitNotifications) {
		if (window.webkitNotifications.checkPermission() > 0) {
			window.webkitNotifications.requestPermission(function(){});
		} else if (!hasFocus){
		
			var popup = window.webkitNotifications.createHTMLNotification('/notify.php?pipe='+ pipeName +'&title=' + title + '&msg=' + msg + '&hash=' + hash);
			
			setTimeout(function(){popup.cancel();}, 3000);
			popup.show();
		}
	}
} 

function closePopup() {
	if(latestPopup != null && "cancel" in latestPopup) {
		latestPopup.cancel();
	}
}





// Drag and drop code

		var TCNDDU = TCNDDU || {};
		
		(function(){
			var dropListing,
				dropArea,
				filesInput,
				body,
				reader;
			
			TCNDDU.setup = function () {
				body = $("body");
				dropListing = $("#uploads");
				dropArea = $("#modal");
				filesInput = $("#filesUpload");
				
				//if(typeof window["FileReader"] === "function") {
					// File API interaction goes here
				//} else {
					// No File API support fallback to file input
					//dropArea.prepend(fileInput);
					$("#filesUpload").bind("change", TCNDDU.handleDrop);
				//}
				body.bind("dragenter",TCNDDU.handleDrag);
				$("#modal").bind("dragleave", function(){$("#modal").hide();});
				
			};
			
			TCNDDU.handleDrag = function (evt) {
				 $("#modal").show();
				
			};
			
			TCNDDU.handleDrop = function (evt) {
				$("#modal").hide();
				var files = evt.target.files;
				
				for(var i = 0, len = files.length; i < len; i++) {
					//domElements[1].appendChild(document.createTextNode(files[i].name + " " + Math.round((files[i].size/1024*100000)/100000)+"K "));
					//domElements[0].id = "item"+i;

					if(files[i].size != 0) {
						
					
						var gritterIndex = $.gritter.add({
							// (string | mandatory) the heading of the notification
							title: 'Uploading ' + files[i].name,
							// (string | mandatory) the text inside the notification
							text: '<div id="item'+i+'">0%</div>',
		
							sticky: true
						});
	
						// Use xhr to send files to server async both Chrome and Safari support xhr2 upload and progress events
						TCNDDU.processXHR(files[i], i, gritterIndex);
					
					}
				}
			};
			
			TCNDDU.processXHR = function (file, index, gritterIndex) {
				var xhr = new XMLHttpRequest(),
					loader;
					fileUpload = xhr.upload,
	
			
				
				fileUpload.addEventListener("progress", function(event) {
					if (event.lengthComputable) {
						var percentage = Math.round((event.loaded * 100) / event.total);
						if (percentage < 100) {
							$('#item' + index).text(percentage + "%");
						}
					}
				}, false);
				
				fileUpload.addEventListener("load", function(event) {
					$('#item'+index).text("Upload completed. Now sharing " + file.name);
					setTimeout(function(){$.gritter.remove(gritterIndex, { 
						fade: true, // optional
					})}, 1000);
				}, false);
				
				fileUpload.addEventListener("error", function(evt) {
					$.gritter.add({
						// (string | mandatory) the heading of the notification
						title: 'Failed uploading ' + files[i].name,
						// (string | mandatory) the text inside the notification
						text: 'Unknown error'
					});
				}, false);

				xhr.open("POST", "upload.php");
				
				xhr.setRequestHeader("If-Modified-Since", "Mon, 26 Jul 1997 05:00:00 GMT");
				xhr.setRequestHeader("Cache-Control", "no-cache");
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				xhr.setRequestHeader("X-File-Name", file.name);
				xhr.setRequestHeader("X-File-Size", file.size);
				xhr.setRequestHeader("X-Client-Id", me.sessionId);
				xhr.setRequestHeader("X-Php-Id", me.userId);
				
				xhr.setRequestHeader("Content-Type", "multipart/form-data");
				xhr.send(file);
				
			};
			
			window.addEventListener("load", TCNDDU.setup, false);
		})();
