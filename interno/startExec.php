<?php
$command = 'php ' . dirname(__DIR__) . '/cli/heimdall.php';

if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
	// Windows: procura pelo PHP executable
	$phpPath = php_ini_loaded_file();
	$phpDir = dirname($phpPath);
	$phpExe = $phpDir . DIRECTORY_SEPARATOR . 'php.exe';
	
	if (!file_exists($phpExe)) {
		$phpExe = 'php'; // fallback
	}
	$command = $phpExe . ' ' . dirname(__DIR__) . DIRECTORY_SEPARATOR . 'cli' . DIRECTORY_SEPARATOR . 'heimdall.php';
} else {
	// Linux/Unix
	$command = 'php ' . dirname(__DIR__) . '/cli/heimdall.php';
}

$output = shell_exec($command);
echo $output;

if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
	// Windows
	$result = pclose(popen('start /B ' . $command, 'r'));
	echo ($result === 0) ? 'success' : 'error';
} else {
	// Linux/Unix
	$output = shell_exec($command . ' > /dev/null 2>&1 &');
	echo ($output === null) ? 'success' : 'error';
}
?>