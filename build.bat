set /P smartTemplateRev=<revision.txt
set /a oldRev=%smartTemplateRev%
set /a smartTemplateRev+=1
powershell -Command "(gc -en UTF8 manifest.json) -replace 'pre%oldRev%', 'pre%smartTemplateRev%' | Out-File manifest.json -encoding utf8"
"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplateWeb.zip manifest.json _locales scripts html chrome locale popup st-background.* license.txt icon.png release-notes.html
echo %smartTemplateRev% > revision.txt
move smartTemplate-*.xpi "..\..\..\Test Versions\4.3\"
powershell -Command "Start-Sleep -m 150"
rename smartTemplateWeb.zip smartTemplate-fx-4.3.2pre%smartTemplateRev%.xpi