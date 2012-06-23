<?php

//$url = "http://www.quickerfix.com/dragdrop";
//$x = get_headers  ( $url, 1);
// create the object and assign property
	$file = new stdClass;
	//$file->name = basename($headers['X-File-Name']);
	//$file->size = $headers['X-File-Size'];
	
	if(empty($_SERVER[HTTP_X_FILE_NAME]) || $_SERVER[HTTP_X_CLIENT_ID] == 'undefined' || $_SERVER[HTTP_X_PHP_ID] == 'undefined' || empty($_SERVER[HTTP_X_CLIENT_ID]) || empty( $_SERVER[HTTP_X_PHP_ID])){
		die;
	} else {
		$file->name = ($_SERVER[HTTP_X_FILE_NAME]);
		$file->content = file_get_contents("php://input");
	
	
		$parts = pathinfo($file->name);
		$ext = '.'.$parts['extension'];
		$name = basename($file->name, $ext);
		
		
		
		$i = 1;
		while(file_exists('uploads/'.$file->name)){
			$file->name = $name.'('.$i.')'.$ext;
			$i++;
		}
		 
		if(file_put_contents('uploads/'.$file->name, $file->content) != FALSE) {
			 $ch = get_web_page("http://node.hakeruapp.com/upload?url=http://hakeruapp.com/uploads/".urlencode($file->name)."&size=".$_SERVER[HTTP_X_FILE_SIZE]."&phpId=".urlencode($_SERVER[HTTP_X_PHP_ID])."&sessionId=". $_SERVER[HTTP_X_CLIENT_ID]); 
    }
	}
	
	
function get_web_page( $url ){
    $options = array(
        CURLOPT_RETURNTRANSFER => true,     // return web page
        CURLOPT_HEADER         => false,    // don't return headers
        CURLOPT_FOLLOWLOCATION => true,     // follow redirects
        CURLOPT_ENCODING       => "text/plain",       // handle all encodings
        CURLOPT_USERAGENT      => "Mozilla", // who am i
        CURLOPT_AUTOREFERER    => true,     // set referer on redirect
        CURLOPT_CONNECTTIMEOUT => 120,      // timeout on connect
        CURLOPT_TIMEOUT        => 120,      // timeout on response
        CURLOPT_MAXREDIRS      => 10,       // stop after 10 redirects
    );


    $ch      = curl_init( $url );
    curl_setopt_array( $ch, $options );
    $content = curl_exec( $ch );
    $err     = curl_errno( $ch );
    $errmsg  = curl_error( $ch );
    $header  = curl_getinfo( $ch );
    curl_close( $ch );

    $header['errno']   = $err;
    $header['errmsg']  = $errmsg;
    $header['content'] = $content;
    return $header;
}
	 
?>