// JavaScript Document

$(document).ready(function() {
	
	$("#submit").click(function(e){
		$("#notice").slideUp(function(){
			$.getJSON("/control/governor.php", { handle: $("#handle").val(), password: $("#password").val() }, function(json){
				if(json.msg == 'success'){
					window.location = '/'+ pipeName;
				} else {
					$("#notice").text(json.msg).slideDown();
				}
			});
		});
	});
	
	$("#handle, #password").keypress(function(e){
		if(e.keyCode == 13) {
			$("#submit").click();
		}	
	});
});