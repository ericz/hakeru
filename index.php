<?

session_start();

require_once("inc/index.inc.php");

if($page == 'session' && empty($_SESSION['user'])){
	header('Location: /login/'.$param[1]);
}


?>
<!DOCTYPE HTML>
<html lang="en">
<head>
<title>Hakeru - Dev</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="Content-Language" content="en-us">
<link rel="icon" href="/favicon.png" type="image/png">
<link href="/style.css" rel="stylesheet" type="text/css">
<link href="/jquery.gritter.css" rel="stylesheet" type="text/css">
<link rel="stylesheet" type="text/css" media="all" href="/jScrollPane.css" />
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
<script type="text/javascript" src="/lib/jquery.mousewheel.js"></script>
<script type="text/javascript" src="/lib/jquery.em.js"></script>
<script type="text/javascript" src="/lib/jScrollPane.js"></script>
<script type="text/javascript" src="/lib/jquery.autolink.js"></script>
<script type="text/javascript" src="/lib/jquery-css-transform.js"></script>
<script type="text/javascript" src="/lib/jquery-animate-css-rotate-scale.js"></script>
<script type="text/javascript" src="/lib/jquery.gritter.min.js"></script>
<script type="text/javascript" src="/lib/jquery.simplemodal.1.4.min.js"></script>



<script type="text/javascript" src="http://node.hakeruapp.com/socket.io/socket.io.js"></script> 
<script type="text/javascript" src="/js/<?=$page?>.js"></script>
<script type="text/javascript">var pipeName = '<?=$pipeName?>'; me.userId = '<?=$_SESSION[user]?>';</script>
</head>
<body>
<div id="modal"><input type="file" multiple="true" id="filesUpload"></div>
<? include($page.".php"); ?>
</body>
</html>