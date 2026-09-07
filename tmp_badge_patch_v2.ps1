function Replace-Once {
  param(
    [string]$SourceText,
    [string]$Pattern,
    [string]$Replacement
  )
  $regex = [regex]::new($Pattern)
  $match = $regex.Match($SourceText)
  if(-not $match.Success) { throw "pattern not found: $Pattern" }
  return $SourceText.Substring(0, $match.Index) + $Replacement + $SourceText.Substring($match.Index + $match.Length)
}

$path = 'E:\GitHub\shopee\sba.html'
$text = [System.IO.File]::ReadAllText($path)
if($text -match 'const TAG_MODE_LABEL') { throw 'badge auto-switch code already exists' }
if($text -notmatch '// ========== 掛標空白／紅／白切換') { throw 'tag block marker not found' }

$tagBlockStart = $text.IndexOf('// ========== 掛標空白／紅／白切換')
$applyStateMarker = '  function applyState(img, state){'
$applyStateIndex = $text.IndexOf($applyStateMarker, $tagBlockStart)
if($applyStateIndex -lt 0) { throw 'applyState marker not found' }

$autoCode = @'
  // 掛標自動顏色判斷：預設紅色，紅色系／深色背景且白版對比足夠時切換白色。
  const TAG_MODE_LABEL = { auto:'自動', red:'紅色掛標', white:'白色掛標', blank:'無掛標' };
  const TAG_RED_RGB = { r:208, g:2, b:27 };
  const TAG_WHITE_RGB = { r:255, g:255, b:255 };
  const TAG_MIN_CONTRAST = 3.0;
  const TAG_DARK_LUMINANCE = 0.35;
  const tagAutoRefreshTimers = {};

  function parseTagColor(value){
    const raw = String(value || '').trim();
    const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(hex){
      const full = hex[1].length === 3 ? hex[1].split('').map(c=>c+c).join('') : hex[1];
      return { r:parseInt(full.slice(0,2),16), g:parseInt(full.slice(2,4),16), b:parseInt(full.slice(4,6),16) };
    }
    const rgb = raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    return rgb ? { r:Math.round(Number(rgb[1])), g:Math.round(Number(rgb[2])), b:Math.round(Number(rgb[3])) } : null;
  }

  function tagRgbToHsl(rgb){
    let r=rgb.r/255, g=rgb.g/255, b=rgb.b/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
    let h=0, s=0, l=(max+min)/2;
    if(d){
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h=(g-b)/d+(g<b?6:0); break;
        case g: h=(b-r)/d+2; break;
        default: h=(r-g)/d+4; break;
      }
      h *= 60;
    }
    return { h, s, l };
  }

  function tagLinearChannel(value){
    const channel = Math.max(0, Math.min(255, value))/255;
    return channel <= 0.03928 ? channel/12.92 : Math.pow((channel+0.055)/1.055, 2.4);
  }

  function tagLuminance(rgb){
    return 0.2126*tagLinearChannel(rgb.r) + 0.7152*tagLinearChannel(rgb.g) + 0.0722*tagLinearChannel(rgb.b);
  }

  function tagContrast(a, b){
    const la=tagLuminance(a), lb=tagLuminance(b);
    const light=Math.max(la,lb), dark=Math.min(la,lb);
    return (light+0.05)/(dark+0.05);
  }

  function tagIsNearRed(rgb){
    const hsl=tagRgbToHsl(rgb);
    const hueDistance=Math.min(hsl.h, 360-hsl.h);
    return hsl.s >= 0.30 && hueDistance <= 25;
  }

  function tagBackgroundRgb(img){
    const isHoriz = img.id === 'tagH' || img.id === 'tagPH';
    const input = document.getElementById(isHoriz ? 'bg-color-h' : 'bg-color-s');
    const canvas = document.getElementById(isHoriz ? 'horiz' : 'square');
    return parseTagColor(input && input.value) ||
      parseTagColor(canvas && getComputedStyle(canvas).backgroundColor) || null;
  }

  function resolveAutoTagState(img){
    const bg = tagBackgroundRgb(img);
    if(!bg) return 'red';

    const redContrast=tagContrast(TAG_RED_RGB, bg);
    const whiteContrast=tagContrast(TAG_WHITE_RGB, bg);
    const redFamily=tagIsNearRed(bg);
    const dark=tagLuminance(bg) <= TAG_DARK_LUMINANCE;

    if((redFamily || dark) && whiteContrast >= TAG_MIN_CONTRAST) return 'white';
    if(redContrast >= TAG_MIN_CONTRAST && redContrast >= whiteContrast) return 'red';
    if(whiteContrast >= TAG_MIN_CONTRAST) return 'white';
    return 'red';
  }

'@
$text = $text.Insert($applyStateIndex, $autoCode)

$nextPattern = '(?s)  function nextState\(state\)\{.*?  \}\r?\n\r?\n'
$nextReplacement = @'
  function nextTagMode(mode){
    if(mode === 'auto') return 'red';
    if(mode === 'red') return 'white';
    if(mode === 'white') return 'blank';
    return 'auto';
  }

'@
$text = Replace-Once $text $nextPattern $nextReplacement

$togglePattern = '(?s)    const group = GROUPS\[id\] \|\| \[id\];\r?\n    const imgs = group\.map\(g=>document\.getElementById\(g\)\)\.filter\(Boolean\);\r?\n    if\(!imgs\.length\) return;\r?\n    const current = imgs\[0\]\.dataset\.tagState \|\| ''blank'';\r?\n    const state = nextState\(current\);\r?\n    imgs\.forEach\(img=>applyState\(img, state\)\);\r?\n    showToast\(`掛標切換：\$\{STATE_LABEL\[state\]\}`, ''ok'', 1000\);'
$toggleReplacement = @'
    const imgs = getTagGroupImages(id);
    if(!imgs.length) return;
    const current = imgs[0].dataset.tagMode || imgs[0].dataset.tagState || 'auto';
    const mode = nextTagMode(current);
    applyTagModeToGroup(id, mode);
    showToast(`掛標切換：${TAG_MODE_LABEL[mode]}`, 'ok', 1000);
'@
$text = Replace-Once $text $togglePattern $toggleReplacement

$text = Replace-Once $text "    btn\.title = '切換掛標（R / W / 無）';" "    btn.title = '切換掛標（自動 / R / W / 無）';`r`n    btn.setAttribute('aria-label', '切換掛標模式（自動、紅色、白色、無掛標）');"
$text = Replace-Once $text "    const img = document\.getElementById\(id\);\r?\n    if\(img\) applyState\(img, 'red'\);" "    applyTagModeToGroup(id, 'auto');"

$bindPattern = '  \}\);\r?\n\r?\n  // 讓其他 scope 的後製疊加可以使用 base64'
$bindReplacement = "  });`r`n  bindAutoTagRefresh();`r`n  window._bnRefreshAutoTags = refreshAutoTags;`r`n  window._bnSetTagMode = function(id, mode){ applyTagModeToGroup(id, mode); };`r`n`r`n  // 讓其他 scope 的後製疊加可以使用 base64"
$text = Replace-Once $text $bindPattern $bindReplacement

foreach($id in @('tagH','tagS','tagPH','tagPS')){
  $needle = "state: document.getElementById('$id')?.dataset?.tagState || 'blank'"
  $replacement = "$needle,`r`n           mode: document.getElementById('$id')?.dataset?.tagMode || 'auto'"
  if(-not $text.Contains($needle)){ throw "tag capture field not found: $id" }
  $text = $text.Replace($needle, $replacement)
}

$restorePattern = '(?s)        if\(data\.state\)\{\r?\n          el\.dataset\.tagState = data\.state;\r?\n        \}'
$restoreReplacement = @'
        if(data.state){
          el.dataset.tagState = data.state;
        }
        const restoredMode = data.mode || (data.state === 'red' || data.state === 'white' || data.state === 'blank' ? data.state : 'auto');
        el.dataset.tagMode = ['auto','red','white','blank'].includes(restoredMode) ? restoredMode : 'auto';
        if(el.dataset.tagMode === 'auto' && typeof window._bnRefreshAutoTags === 'function') window._bnRefreshAutoTags();
'@
$text = Replace-Once $text $restorePattern $restoreReplacement

[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
Write-Output 'ok'
