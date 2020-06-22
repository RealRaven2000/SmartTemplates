set /P smartTemplateWebRev=<revisionWeb.txt
set /a oldRev=%smartTemplateWebRev%
set /a smartTemplateWebRev+=1
pwsh -Command "(gc -en UTF8NoBOM install.rdf) -replace 'pre%oldRev%', 'pre%smartTemplateWebRev%' | Out-File install.rdf"
"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplateWeb.zip manifest.json chrome.manifest content defaults locale skin license.txt icon.png 
echo %smartTemplateWebRev% > revisionWeb.txt
move smartTemplateWeb*.xpi "..\..\Release\_Test Versions\1.6\web\"
rename smartTemplateWeb.zip smartTemplateWeb-1.6pre%smartTemplateWebRev%.xpi