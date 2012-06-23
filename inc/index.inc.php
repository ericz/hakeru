<?

$requested = empty($_SERVER['REQUEST_URI']) ? false : $_SERVER['REQUEST_URI']                                                     ;
$param = explode('/', $requested);

if($param[1] == 'login'){
		$pipeName = $param[2];
    $page = 'loginpage';
} elseif($requested == '/'){
    $page = 'home';
} else {
	$pipeName = $param[1];
	$page = 'session';
}


?>