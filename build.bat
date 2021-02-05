set /P smartTemplateRev=<revision.txt
set /a oldRev=%smartTemplateRev%
set /a smartTemplateRev+=1
pwsh -Command "(gc -en UTF8NoBOM manifest.json) -replace 'pre%oldRev%', 'pre%smartTemplateRev%' | Out-File manifest.json"
"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplateWeb.zip manifest.json _locales chrome locale popup st-background.js license.txt icon.png release-notes.html
echo %smartTemplateRev% > revision.txt
move smartTemplate-*.xpi "..\..\..\Test Versions\3.4\"
pwsh -Command "Start-Sleep -m 150"
rename smartTemplateWeb.zip smartTemplate-fx-3.4.1pre%smartTemplateRev%.xpi