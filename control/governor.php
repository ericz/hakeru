<?
 /**
  * Handles when users favorite a song 
  */
require_once("database.class.php");

session_start();

$db = new Database(DB_SERVER, DB_USER, DB_PASS, DB_DATABASE);
$db->connect();
$data = $db->query_first("SELECT * FROM users WHERE handle = '$_GET[handle]'");
if($data[handle] == $_GET[handle]) {
	if(md5($_GET[password]) == $data[password]){
		$_SESSION[user] = $data[handle];
		$result[msg] = 'success';
	} else {
		$result[msg] = 'Incorrect password';
	}
} elseif(!empty($_GET[handle])) {
	$db->query_insert('users', array("handle" => $_GET[handle],"password" => md5($_GET[password])));
	$result[msg] = 'Registered. Click login again to proceed.';
}

echo json_encode($result);

?>