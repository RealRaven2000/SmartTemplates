set /P smartTemplateRev=<revision.txt
set /a oldRev=%smartTemplateRev%
set /a smartTemplateRev+=1
pwsh -Command "(gc -en UTF8NoBOM install.rdf) -replace 'pre%oldRev%', 'pre%smartTemplateRev%' | Out-File install.rdf"
pwsh -Command "(gc -en UTF8NoBOM manifest.json) -replace 'pre%oldRev%', 'pre%smartTemplateRev%' | Out-File manifest.json"
rem "C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplate.zip install.rdf chrome.manifest content defaults locale skin license.txt icon.png 
"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplateWeb.zip manifest.json install.rdf chrome.manifest content defaults locale skin license.txt icon.png 
echo %smartTemplateRev% > revision.txt
move smartTemplate-*.xpi "..\..\Test Versions\2.8\"
pwsh -Command "Start-Sleep -m 150"
rename smartTemplateWeb.zip smartTemplate-fx-2.8pre%smartTemplateRev%.xpi