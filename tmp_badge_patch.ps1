$path = 'E:\GitHub\shopee\sba.html'
$text = [System.IO.File]::ReadAllText($path)
if($text -notmatch '掛標自動顏色判斷') { throw 'target marker not found' }
[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
Write-Output 'ok'
